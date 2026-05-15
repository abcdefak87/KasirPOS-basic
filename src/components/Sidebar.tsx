"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/stok", label: "Stok", icon: "📦" },
  { href: "/penjualan", label: "Penjualan", icon: "💰" },
  { href: "/rekap", label: "Rekap", icon: "📋" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4 flex flex-col max-md:w-full max-md:min-h-auto max-md:flex-row max-md:border-b max-md:border-r-0 max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:z-50 max-md:p-2 max-md:justify-around">
      <div className="max-md:hidden mb-8">
        <h1 className="text-xl font-bold text-blue-600">KasirPOS</h1>
        <p className="text-xs text-gray-400">Konter & Printing</p>
      </div>
      <nav className="flex-1 space-y-1 max-md:flex max-md:space-y-0 max-md:gap-1 max-md:flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm max-md:flex-col max-md:text-xs max-md:px-2 max-md:py-1 ${
              pathname === item.href
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <button
        onClick={handleLogout}
        className="mt-4 text-sm text-gray-500 hover:text-red-500 max-md:hidden"
      >
        Logout
      </button>
    </aside>
  );
}
