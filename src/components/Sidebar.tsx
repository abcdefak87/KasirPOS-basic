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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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
        <Link href="/" className="flex items-center gap-2.5 px-2 mb-8">
          <span className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-base shadow-card-lg">
            K
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight leading-tight">KasirPOS</p>
            <p className="text-[11px] text-text-subtle leading-tight">Konter & Printing</p>
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

        <button
          onClick={() => setConfirmOpen(true)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-text-muted hover:bg-danger-50 hover:text-danger-600 transition-colors"
        >
          <IconLogout size={18} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-border px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
            K
          </span>
          <span className="font-semibold tracking-tight">KasirPOS</span>
        </Link>
        <button
          onClick={() => setConfirmOpen(true)}
          aria-label="Logout"
          className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted"
        >
          <IconLogout size={18} />
        </button>
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
        title="Logout dari KasirPOS?"
        description="Kamu perlu login ulang untuk mengakses dashboard."
        confirmLabel="Logout"
        tone="danger"
        loading={loggingOut}
      />
    </>
  );
}
