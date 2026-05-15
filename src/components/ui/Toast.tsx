"use client";
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { IconCheck, IconAlert, IconClose } from "./Icon";

type ToastTone = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface Ctx {
  toast: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast harus di dalam ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message, tone }]);
      setTimeout(() => remove(id), 3500);
    },
    [remove]
  );

  const value: Ctx = {
    toast,
    success: (m) => toast(m, "success"),
    error: (m) => toast(m, "error"),
  };

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 left-4 sm:left-auto sm:max-w-sm z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), 3200);
    return () => clearTimeout(t);
  }, []);
  const styles = {
    success: "bg-white border-success-600/20 text-text",
    error: "bg-white border-danger-500/30 text-text",
    info: "bg-white border-border text-text",
  }[toast.tone];

  const iconWrap = {
    success: "bg-success-50 text-success-700",
    error: "bg-danger-50 text-danger-600",
    info: "bg-brand-50 text-brand-600",
  }[toast.tone];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3 pr-2 rounded-xl border shadow-pop anim-pop ${styles} ${
        leaving ? "opacity-0 transition-opacity duration-300" : ""
      }`}
    >
      <span className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg ${iconWrap}`}>
        {toast.tone === "success" ? <IconCheck size={18} /> : <IconAlert size={18} />}
      </span>
      <p className="flex-1 text-sm leading-5 pt-1">{toast.message}</p>
      <button
        onClick={onClose}
        className="shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-md text-text-muted hover:bg-surface-muted"
        aria-label="Tutup"
      >
        <IconClose size={16} />
      </button>
    </div>
  );
}
