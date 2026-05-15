"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  IconDashboard,
  IconBox,
  IconCart,
  IconChart,
  IconLogout,
} from "@/components/ui/Icon";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/Modal";
import { BrandLogo } from "@/components/BrandLogo";
import { useBrand } from "@/components/BrandProvider";

type NavItem = {
  href: string;
  label: string;
  icon: (p: { size?: number }) => React.ReactNode;
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: IconDashboard },
  { href: "/stok", label: "Stok", icon: IconBox },
  { href: "/penjualan", label: "Penjualan", icon: IconCart },
  { href: "/rekap", label: "Rekap", icon: IconChart },
];

function IconSettings({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { brand } = useBrand();

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 bg-surface border-r border-border min-h-screen p-4 flex-col sticky top-0">
        <Link href="/" className="flex items-center gap-2.5 px-2 mb-8 min-w-0">
          <BrandLogo size={36} className="shadow-card-lg shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight leading-tight truncate">
              {brand.brand_name}
            </p>
            <p className="text-[11px] text-text-subtle leading-tight truncate">
              {brand.tagline}
            </p>
          </div>
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-text-muted hover:bg-surface-muted hover:text-text"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-600" />}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 pt-2 border-t border-border">
          <Link
            href="/pengaturan"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === "/pengaturan"
                ? "bg-brand-50 text-brand-700 font-medium"
                : "text-text-muted hover:bg-surface-muted hover:text-text"
            }`}
          >
            <IconSettings size={18} />
            <span>Pengaturan</span>
          </Link>
          <button
            onClick={() => setConfirmOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-muted hover:bg-danger-50 hover:text-danger-600 transition-colors"
          >
            <IconLogout size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-border px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <BrandLogo size={32} rounded="rounded-lg" className="shrink-0" />
          <span className="font-semibold tracking-tight truncate">{brand.brand_name}</span>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/pengaturan"
            aria-label="Pengaturan"
            className={`w-9 h-9 inline-flex items-center justify-center rounded-lg ${
              pathname === "/pengaturan"
                ? "bg-brand-50 text-brand-700"
                : "text-text-muted hover:bg-surface-muted"
            }`}
          >
            <IconSettings size={18} />
          </Link>
          <button
            onClick={() => setConfirmOpen(true)}
            aria-label="Logout"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted"
          >
            <IconLogout size={18} />
          </button>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur border-t border-border px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] grid grid-cols-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1.5 rounded-lg text-[11px] transition-colors ${
                active ? "text-brand-700" : "text-text-muted"
              }`}
            >
              <span
                className={`inline-flex items-center justify-center px-3 py-1 rounded-full transition-colors ${
                  active ? "bg-brand-50" : ""
                }`}
              >
                <Icon size={20} />
              </span>
              <span className={active ? "font-medium" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleLogout}
        title={`Logout dari ${brand.brand_name}?`}
        description="Kamu perlu login ulang untuk mengakses dashboard."
        confirmLabel="Logout"
        tone="danger"
        loading={loggingOut}
      />
    </>
  );
}
