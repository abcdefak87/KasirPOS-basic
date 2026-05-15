"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useBrand } from "@/components/BrandProvider";
import { IconPlus, IconTrash, IconAlert } from "@/components/ui/Icon";

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];

export default function PengaturanPage() {
  const supabase = createClient();
  const toast = useToast();
  const { brand, setBrand } = useBrand();

  const [brandName, setBrandName] = useState(brand.brand_name);
  const [tagline, setTagline] = useState(brand.tagline);
  const [logoUrl, setLogoUrl] = useState(brand.logo_url);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const dirty =
    brandName !== brand.brand_name ||
    tagline !== brand.tagline ||
    logoUrl !== brand.logo_url;

  function resetForm() {
    setBrandName(brand.brand_name);
    setTagline(brand.tagline);
    setLogoUrl(brand.logo_url);
  }

  async function handleUpload(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Format harus PNG, JPG, WEBP, atau SVG");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Ukuran maksimal 2 MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `logo-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("brand-assets")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (upErr) {
      setUploading(false);
      toast.error("Upload gagal: " + upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("brand-assets").getPublicUrl(path);
    setLogoUrl(pub.publicUrl);
    setUploading(false);
    toast.success("Logo diunggah. Klik Simpan untuk menerapkan.");
  }

  function handleRemoveLogo() {
    setLogoUrl(null);
  }

  async function handleSave() {
    if (!brandName.trim()) {
      toast.error("Nama brand wajib diisi");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("business_settings")
      .update({
        brand_name: brandName.trim(),
        tagline: tagline.trim(),
        logo_url: logoUrl,
      })
      .eq("id", 1)
      .select()
      .single();
    setSaving(false);
    if (error || !data) {
      toast.error("Gagal menyimpan: " + (error?.message ?? "unknown"));
      return;
    }
    setBrand(data);
    toast.success("Pengaturan disimpan");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Atur identitas toko yang muncul di sidebar dan halaman login.
        </p>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-muted">
            <PreviewLogo url={logoUrl} name={brandName} />
            <div className="min-w-0">
              <p className="font-semibold text-base tracking-tight truncate">
                {brandName || "—"}
              </p>
              <p className="text-xs text-text-subtle truncate">{tagline || "—"}</p>
            </div>
          </div>
          <p className="text-xs text-text-subtle mt-2">
            Live preview — sidebar utama akan ter-update setelah disimpan.
          </p>
        </CardBody>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Logo Toko</CardTitle>
          <p className="text-xs text-text-subtle mt-0.5">
            PNG, JPG, WEBP, atau SVG. Maks 2 MB. Disarankan persegi (1:1).
          </p>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap items-center gap-4">
            <PreviewLogo url={logoUrl} name={brandName} size={72} />
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 cursor-pointer transition-colors">
                {uploading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-r-transparent rounded-full animate-spin" />
                    Mengunggah...
                  </>
                ) : (
                  <>
                    <IconPlus size={16} />
                    {logoUrl ? "Ganti Logo" : "Upload Logo"}
                  </>
                )}
                <input
                  type="file"
                  accept={ALLOWED_TYPES.join(",")}
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {logoUrl && (
                <Button variant="secondary" onClick={handleRemoveLogo} disabled={uploading}>
                  <IconTrash size={16} /> Hapus
                </Button>
              )}
            </div>
          </div>
          {!logoUrl && (
            <p className="text-xs text-text-subtle mt-3 flex items-start gap-2">
              <IconAlert size={14} />
              <span>Belum ada logo — sidebar akan menampilkan inisial dari nama brand.</span>
            </p>
          )}
        </CardBody>
      </Card>

      {/* Identity */}
      <Card>
        <CardHeader>
          <CardTitle>Identitas</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Nama brand"
            placeholder="cth: Konter Mas Joko"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            maxLength={40}
            hint={`${brandName.length}/40 karakter`}
          />
          <Input
            label="Tagline / sub-judul"
            placeholder="cth: Pulsa, Voucher, Print Foto"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            maxLength={60}
            hint={`${tagline.length}/60 karakter`}
          />
        </CardBody>
      </Card>

      {/* Save bar */}
      <div className="sticky bottom-20 md:bottom-4 z-20">
        <div
          className={`flex items-center justify-between gap-3 p-3 rounded-2xl border shadow-pop bg-white transition-opacity ${
            dirty ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <p className="text-sm text-text-muted">
            Ada perubahan yang belum disimpan.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={resetForm} disabled={saving}>
              Reset
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Simpan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewLogo({ url, name, size = 44 }: { url: string | null; name: string; size?: number }) {
  if (url) {
    return (
      <span
        className="inline-block overflow-hidden rounded-xl bg-white shrink-0"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={name}
          width={size}
          height={size}
          className="w-full h-full object-cover"
        />
      </span>
    );
  }
  const trimmed = (name || "K").trim() || "K";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const initial =
    parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : trimmed.slice(0, 2).toUpperCase();
  return (
    <span
      className="inline-flex items-center justify-center rounded-xl bg-brand-600 text-white font-bold shrink-0"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {initial}
    </span>
  );
}
