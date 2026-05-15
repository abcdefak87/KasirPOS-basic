"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Product } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  IconSearch,
  IconBox,
  IconPlus,
  IconMinus,
  IconCart,
  IconCheck,
} from "@/components/ui/Icon";
import { formatRp } from "@/components/ui/format";

export default function PenjualanPage() {
  const supabase = createClient();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    const { data } = await supabase.from("products").select("*").gt("stok", 0).order("nama");
    if (data) setProducts(data);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
  }, [loadProducts]);

  const selected = useMemo(
    () => products.find((p) => p.id === selectedId),
    [products, selectedId]
  );

  const filtered = useMemo(() => {
    return products.filter((p) =>
      p.nama.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  function pick(id: string) {
    setSelectedId(id);
    setJumlah(1);
  }

  function changeQty(delta: number) {
    if (!selected) return;
    const next = jumlah + delta;
    if (next < 1) return;
    if (next > selected.stok) {
      toast.error(`Stok ${selected.nama} hanya ${selected.stok}`);
      return;
    }
    setJumlah(next);
  }

  async function handleJual(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (jumlah > selected.stok) {
      toast.error("Stok tidak cukup");
      return;
    }
    setLoading(true);
    const { error: trxErr } = await supabase.from("transactions").insert({
      product_id: selected.id,
      jumlah,
      harga_modal: selected.harga_modal,
      harga_jual: selected.harga_jual,
    });
    if (trxErr) {
      setLoading(false);
      toast.error("Gagal: " + trxErr.message);
      return;
    }
    await supabase
      .from("products")
      .update({ stok: selected.stok - jumlah })
      .eq("id", selected.id);
    await supabase.from("stock_history").insert({
      product_id: selected.id,
      tipe: "KELUAR",
      jumlah,
      keterangan: "Penjualan",
    });
    toast.success(`Terjual ${jumlah}× ${selected.nama}`);
    setSelectedId("");
    setJumlah(1);
    setLoading(false);
    loadProducts();
  }

  const totalKotor = selected ? selected.harga_jual * jumlah : 0;
  const totalBersih = selected ? (selected.harga_jual - selected.harga_modal) * jumlah : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Penjualan</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Pilih barang lalu konfirmasi untuk mencatat transaksi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Left: product picker */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Pilih Barang</CardTitle>
            <p className="text-xs text-text-subtle mt-0.5">
              {products.length} barang tersedia
            </p>
          </CardHeader>
          <CardBody className="space-y-3">
            <Input
              placeholder="Cari nama barang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leadingIcon={<IconSearch size={18} />}
            />
            {filtered.length === 0 ? (
              <EmptyState
                icon={<IconBox size={22} />}
                title={search ? "Tidak ada hasil" : "Tidak ada barang tersedia"}
                description={
                  search
                    ? `Tidak ditemukan "${search}"`
                    : "Tambah stok atau barang baru di halaman Stok."
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[28rem] overflow-y-auto pr-1 -mr-1">
                {filtered.map((p) => {
                  const active = p.id === selectedId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => pick(p.id)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        active
                          ? "border-brand-500 bg-brand-50/50 shadow-card"
                          : "border-border bg-white hover:border-border-strong hover:bg-surface-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{p.nama}</p>
                          <p className="text-sm num font-semibold mt-0.5">
                            {formatRp(p.harga_jual)}
                          </p>
                        </div>
                        {active && (
                          <span className="shrink-0 w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                            <IconCheck size={12} />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Badge tone={p.kategori === "KONTER" ? "konter" : "printing"}>
                          {p.kategori === "KONTER" ? "Konter" : "Printing"}
                        </Badge>
                        <Badge
                          tone={p.stok <= p.stok_minimum ? "warning" : "neutral"}
                        >
                          Stok {p.stok}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Right: cart / confirm */}
        <Card className="lg:col-span-2 lg:sticky lg:top-6 h-fit">
          <CardHeader>
            <CardTitle>Konfirmasi Transaksi</CardTitle>
          </CardHeader>
          <CardBody>
            {!selected ? (
              <EmptyState
                icon={<IconCart size={22} />}
                title="Belum ada barang dipilih"
                description="Klik salah satu barang di samping untuk memulai transaksi."
              />
            ) : (
              <form onSubmit={handleJual} className="space-y-4">
                <div className="p-3 rounded-xl bg-surface-muted">
                  <p className="text-sm font-medium">{selected.nama}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge tone={selected.kategori === "KONTER" ? "konter" : "printing"}>
                      {selected.kategori === "KONTER" ? "Konter" : "Printing"}
                    </Badge>
                    <span className="text-xs text-text-subtle">
                      Stok: {selected.stok}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div>
                      <p className="text-text-subtle">Modal</p>
                      <p className="num font-medium text-text">{formatRp(selected.harga_modal)}</p>
                    </div>
                    <div>
                      <p className="text-text-subtle">Jual</p>
                      <p className="num font-medium text-text">{formatRp(selected.harga_jual)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Jumlah
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => changeQty(-1)}
                      disabled={jumlah <= 1}
                      className="w-11 h-11 rounded-lg border border-border bg-white hover:bg-surface-muted disabled:opacity-40 flex items-center justify-center"
                      aria-label="Kurangi"
                    >
                      <IconMinus size={18} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={selected.stok}
                      value={jumlah}
                      onChange={(e) =>
                        setJumlah(Math.max(1, Math.min(selected.stok, +e.target.value || 1)))
                      }
                      className="flex-1 h-11 text-center text-lg font-semibold num border border-border rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => changeQty(1)}
                      disabled={jumlah >= selected.stok}
                      className="w-11 h-11 rounded-lg border border-border bg-white hover:bg-surface-muted disabled:opacity-40 flex items-center justify-center"
                      aria-label="Tambah"
                    >
                      <IconPlus size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-brand-600 text-white">
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-80">Total Bayar</span>
                    <span className="num font-semibold text-lg">{formatRp(totalKotor)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1 text-white/80">
                    <span>Laba bersih</span>
                    <span className="num">{formatRp(totalBersih)}</span>
                  </div>
                </div>

                <Button type="submit" loading={loading} fullWidth size="lg" variant="success">
                  {loading ? "Memproses..." : "Catat Penjualan"}
                </Button>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
