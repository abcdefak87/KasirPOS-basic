"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Entry = { data: unknown; ts: number };
type Listener = () => void;

const store = new Map<string, Entry>();
const listeners = new Map<string, Set<Listener>>();
const inflight = new Map<string, Promise<unknown>>();

export function getCache<T>(key: string): T | undefined {
  return store.get(key)?.data as T | undefined;
}

export function setCache<T>(key: string, data: T) {
  store.set(key, { data, ts: Date.now() });
  listeners.get(key)?.forEach((cb) => cb());
}

export function patchCache<T>(key: string, updater: (prev: T | undefined) => T) {
  const prev = getCache<T>(key);
  setCache(key, updater(prev));
}

export function invalidate(key: string) {
  store.delete(key);
  listeners.get(key)?.forEach((cb) => cb());
}

export function invalidatePrefix(prefix: string) {
  for (const k of Array.from(store.keys())) {
    if (k.startsWith(prefix)) {
      store.delete(k);
      listeners.get(k)?.forEach((cb) => cb());
    }
  }
}

function subscribe(key: string, cb: Listener) {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(cb);
  return () => {
    set!.delete(cb);
    if (set!.size === 0) listeners.delete(key);
  };
}

export function useCachedQuery<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  opts: { staleMs?: number } = {}
) {
  const { staleMs = 15_000 } = opts;
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const [data, setData] = useState<T | undefined>(() =>
    key ? getCache<T>(key) : undefined
  );
  const [loading, setLoading] = useState<boolean>(() => {
    if (!key) return false;
    return getCache<T>(key) === undefined;
  });

  const refresh = useCallback(async () => {
    if (!key) return;
    let promise = inflight.get(key) as Promise<T> | undefined;
    if (!promise) {
      promise = (async () => {
        const result = await fetcherRef.current();
        setCache(key, result);
        return result;
      })().finally(() => inflight.delete(key)) as Promise<T>;
      inflight.set(key, promise);
    }
    if (getCache<T>(key) === undefined) setLoading(true);
    try {
      await promise;
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    if (!key) return;
    const sync = () => setData(getCache<T>(key));
    const unsub = subscribe(key, sync);
    sync();
    const ts = store.get(key)?.ts ?? 0;
    const isStale = Date.now() - ts > staleMs;
    if (isStale) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refresh();
    }
    return unsub;
  }, [key, staleMs, refresh]);

  return { data, loading, refresh };
}
