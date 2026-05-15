"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconEye, IconEyeOff, IconAlert } from "@/components/ui/Icon";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: hero */}
      <div className="hidden lg:flex relative bg-brand-600 text-white p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden>
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-32 -right-10 w-[28rem] h-[28rem] rounded-full bg-brand-100/40 blur-3xl" />
        </div>
        <div className="relative z-10 flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-white text-brand-600 flex items-center justify-center font-bold">K</span>
          <span className="font-semibold text-lg tracking-tight">KasirPOS</span>
        </div>
        <div className="relative z-10 space-y-4 max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight leading-tight">
            Kelola konter & printing-mu dalam satu dashboard.
          </h2>
          <p className="text-white/80 text-sm leading-relaxed">
            Catat penjualan, pantau stok, dan lihat keuntungan harian — semua jadi cepat dan rapi.
          </p>
          <ul className="space-y-2 text-sm">
            {["Input penjualan dalam hitungan detik", "Alert otomatis saat stok menipis", "Rekap harian + margin real-time"].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-white" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-xs text-white/60">© KasirPOS</p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <span className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold">K</span>
            <span className="font-semibold text-lg tracking-tight">KasirPOS</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Selamat datang</h1>
          <p className="text-sm text-text-muted mt-1 mb-7">Masuk untuk lanjut ke dashboard.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              label="Email"
              placeholder="admin@kasirpos.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              type={showPw ? "text" : "password"}
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              trailingIcon={
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="text-text-subtle hover:text-text"
                  aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPw ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              }
            />

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-50 border border-danger-500/20 text-danger-600 text-sm">
                <IconAlert size={18} />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth size="lg">
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <p className="text-xs text-text-subtle text-center mt-6">
            Lupa akses? Hubungi admin sistem.
          </p>
        </div>
      </div>
    </div>
  );
}
