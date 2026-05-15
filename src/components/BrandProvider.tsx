"use client";
import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { BusinessSettings } from "@/lib/types";

const DEFAULTS: BusinessSettings = {
  id: 1,
  brand_name: "KasirPOS",
  tagline: "Konter & Printing",
  logo_url: null,
  updated_at: new Date().toISOString(),
};

interface Ctx {
  brand: BusinessSettings;
  initial: () => string;
  setBrand: (b: BusinessSettings) => void;
}

const BrandCtx = createContext<Ctx | null>(null);

export function BrandProvider({
  initialBrand,
  children,
}: {
  initialBrand: BusinessSettings | null;
  children: ReactNode;
}) {
  const [brand, setBrandState] = useState<BusinessSettings>(initialBrand ?? DEFAULTS);

  const setBrand = useCallback((b: BusinessSettings) => setBrandState(b), []);

  const initial = useCallback(() => {
    const name = brand.brand_name?.trim() || "K";
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [brand.brand_name]);

  const value = useMemo<Ctx>(() => ({ brand, setBrand, initial }), [brand, setBrand, initial]);

  return <BrandCtx.Provider value={value}>{children}</BrandCtx.Provider>;
}

export function useBrand() {
  const ctx = useContext(BrandCtx);
  if (!ctx) {
    return {
      brand: DEFAULTS,
      initial: () => "K",
      setBrand: () => {},
    };
  }
  return ctx;
}
