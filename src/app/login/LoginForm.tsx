"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconEye, IconEyeOff, IconAlert } from "@/components/ui/Icon";

interface BrandData {
  brand_name: string;
  tagline: string;
  logo_url: string | null;
}

function brandInitial(name: string) {
  const trimmed = name.trim() || "K";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
}

function LogoBlock({
  brand,
  size,
  rounded = "rounded-xl",
  textBg = "bg-brand-600 text-white",
}: {
  brand: BrandData;
  size: number;
  rounded?: string;
  textBg?: string;
}) {
  if (brand.logo_url) {
    return (
      <span
        className={`inline-block overflow-hidden bg-white ${rounded}`}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={brand.logo_url}
          alt={brand.brand_name}
          width={size}
          height={size}
          className="w-full h-full object-cover"
        />
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center font-bold ${rounded} ${textBg}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {brandInitial(brand.brand_name)}
    </span>
  );
}

export default function LoginForm({ brand }: { brand: BrandData }) {
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
          <LogoBlock brand={brand} size={40} textBg="bg-white text-brand-600" />
          <span className="font-semibold text-lg tracking-tight">{brand.brand_name}</span>
        </div>
        <div className="relative z-10 space-y-4 max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight leading-tight">
            Kelola {brand.tagline.toLowerCase()} dalam satu dashboard.
          </h2>
          <p className="text-white/80 text-sm leading-relaxed">
            Catat penjualan, pantau stok, dan lihat keuntungan harian — semua jadi cepat dan rapi.
          </p>
          <ul className="space-y-2 text-sm">
            {[
              "Input penjualan dalam hitungan detik",
              "Alert otomatis saat stok menipis",
              "Rekap harian + margin real-time",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-white" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-xs text-white/60">© {brand.brand_name}</p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <LogoBlock brand={brand} size={40} />
            <span className="font-semibold text-lg tracking-tight">{brand.brand_name}</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Selamat datang</h1>
          <p className="text-sm text-text-muted mt-1 mb-7">
            Masuk untuk lanjut ke dashboard.
          </p>

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
