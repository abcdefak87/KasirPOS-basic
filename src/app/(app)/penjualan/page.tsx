"use client";
import { useCallback, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Product } from "@/lib/types";
import { useCachedQuery, patchCache, invalidate, setCache } from "@/lib/cache";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  IconSearch,
  IconBox,
  IconPlus,
  IconMinus,
  IconCart,
  IconTrash,
} from "@/components/ui/Icon";
import { formatRp } from "@/components/ui/format";

type CartItem = {
  productId: string;
  qty: number;
};

export default function PenjualanPage() {
  const supabase = createClient();
  const toast = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from("products").select("*").order("nama");
    return (data || []) as Product[];
  }, [supabase]);

  const { data: products = [], refresh: refreshProducts } = useCachedQuery<Product[]>(
    "products",
    fetchProducts
  );

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  const filtered = useMemo(
    () =>
      products.filter((p) =>
        p.nama.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  const cartLines = useMemo(
    () =>
      cart
        .map((c) => {
          const p = productMap.get(c.productId);
          if (!p) return null;
          return {
            ...c,
            product: p,
            subtotalKotor: p.harga_jual * c.qty,
            subtotalBersih: (p.harga_jual - p.harga_modal) * c.qty,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    [cart, productMap]
  );

  const totalKotor = cartLines.reduce((s, l) => s + l.subtotalKotor, 0);
  const totalBersih = cartLines.reduce((s, l) => s + l.subtotalBersih, 0);
  const totalItem = cartLines.reduce((s, l) => s + l.qty, 0);

  function addToCart(product: Product) {
    if (product.stok <= 0) {
      toast.error(`${product.nama} stok habis`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stok) {
          toast.error(`Stok ${product.nama} hanya ${product.stok}`);
          return prev;
        }
        return prev.map((c) =>
          c.productId === product.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { productId: product.id, qty: 1 }];
    });
  }

  function changeQty(productId: string, delta: number) {
    const product = productMap.get(productId);
    if (!product) return;
    setCart((prev) => {
      const item = prev.find((c) => c.productId === productId);
      if (!item) return prev;
      const next = item.qty + delta;
      if (next <= 0) return prev.filter((c) => c.productId !== productId);
      if (next > product.stok) {
        toast.error(`Stok ${product.nama} hanya ${product.stok}`);
        return prev;
      }
      return prev.map((c) =>
        c.productId === productId ? { ...c, qty: next } : c
      );
    });
  }

  function setQty(productId: string, qty: number) {
    const product = productMap.get(productId);
    if (!product) return;
    setCart((prev) => {
      if (qty <= 0) return prev.filter((c) => c.productId !== productId);
      const clamped = Math.min(qty, product.stok);
      return prev.map((c) =>
        c.productId === productId ? { ...c, qty: clamped } : c
      );
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }

  function clearCart() {
    setCart([]);
  }

  async function handleCheckout() {
    if (cartLines.length === 0) return;
    setLoading(true);

    const trxRows = cartLines.map((l) => ({
      product_id: l.product.id,
      jumlah: l.qty,
      harga_modal: l.product.harga_modal,
      harga_jual: l.product.harga_jual,
    }));
    const histRows = cartLines.map((l) => ({
      product_id: l.product.id,
      tipe: "KELUAR" as const,
      jumlah: l.qty,
      keterangan: "Penjualan",
    }));

    // Snapshot for rollback
    const prevProducts = products.slice();
    const linesSnapshot = cartLines.slice();
    const totals = { totalItem, totalKotor };

    // Optimistic: decrement stock locally + clear cart
    patchCache<Product[]>("products", (prev) => {
      const map = new Map(linesSnapshot.map((l) => [l.product.id, l.qty]));
      return (prev || []).map((p) =>
        map.has(p.id) ? { ...p, stok: p.stok - (map.get(p.id) || 0) } : p
      );
    });
    clearCart();
    setCartOpen(false);
    toast.success(`Terjual! ${totals.totalItem} item · ${formatRp(totals.totalKotor)}`);

    const { error: trxErr } = await supabase.from("transactions").insert(trxRows);
    if (trxErr) {
      setLoading(false);
      toast.error("Gagal mencatat transaksi, revert: " + trxErr.message);
      setCache("products", prevProducts);
      return;
    }
    await supabase.from("stock_history").insert(histRows);

    await Promise.all(
      linesSnapshot.map((l) =>
        supabase
          .from("products")
          .update({ stok: l.product.stok - l.qty })
          .eq("id", l.product.id)
      )
    );

    invalidate(`transactions:today:${new Date().toISOString().split("T")[0]}`);
    setLoading(false);
    refreshProducts();
  }

  function quantityInCart(productId: string): number {
    return cart.find((c) => c.productId === productId)?.qty || 0;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Penjualan</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Pilih barang lalu checkout untuk mencatat transaksi.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Left: product grid */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daftar Barang</CardTitle>
              <span className="text-xs text-text-subtle">
                {filtered.length} ditampilkan
              </span>
            </div>
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
                title={search ? "Tidak ada hasil" : "Belum ada barang"}
                description={
                  search
                    ? `Tidak ditemukan "${search}"`
                    : "Tambah barang dulu di halaman Stok."
                }
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[32rem] overflow-y-auto pr-1 -mr-1">
                {filtered.map((p) => {
                  const inCart = quantityInCart(p.id);
                  const habis = p.stok <= 0;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={habis}
                      onClick={() => addToCart(p)}
                      className={`relative text-left p-3 rounded-xl border transition-all ${
                        habis
                          ? "border-border bg-surface-muted/40 opacity-60 cursor-not-allowed"
                          : inCart > 0
                          ? "border-brand-500 bg-brand-50/50 shadow-card"
                          : "border-border bg-white hover:border-border-strong hover:shadow-card-lg active:scale-[0.98]"
                      }`}
                    >
                      {inCart > 0 && (
                        <span className="absolute top-2 right-2 min-w-[20px] h-5 px-1.5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center num">
                          {inCart}
                        </span>
                      )}
                      <p className="font-medium text-sm leading-snug line-clamp-2 min-h-[2.5rem]">
                        {p.nama}
                      </p>
                      <p className="text-sm num font-semibold mt-1.5">
                        {formatRp(p.harga_jual)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <Badge tone={p.kategori === "KONTER" ? "konter" : "printing"}>
                          {p.kategori === "KONTER" ? "Konter" : "Printing"}
                        </Badge>
                        <Badge
                          tone={
                            habis
                              ? "danger"
                              : p.stok <= p.stok_minimum
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {habis ? "Habis" : `Stok ${p.stok}`}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Right: cart (desktop) */}
        <div className="hidden lg:block lg:col-span-2">
          <CartPanel
            lines={cartLines}
            totalKotor={totalKotor}
            totalBersih={totalBersih}
            totalItem={totalItem}
            loading={loading}
            onChangeQty={changeQty}
            onSetQty={setQty}
            onRemove={removeFromCart}
            onClear={clearCart}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* Mobile floating cart button */}
      {cartLines.length > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="lg:hidden fixed bottom-20 right-4 z-30 h-14 px-5 rounded-full bg-brand-600 text-white shadow-pop flex items-center gap-3 active:scale-95 transition-transform"
        >
          <span className="relative">
            <IconCart size={22} />
            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-brand-700 text-[10px] font-bold flex items-center justify-center num">
              {totalItem}
            </span>
          </span>
          <span className="font-semibold num">{formatRp(totalKotor)}</span>
        </button>
      )}

      {/* Mobile cart modal */}
      <Modal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title="Keranjang"
        maxWidth="max-w-md"
      >
        <CartPanel
          lines={cartLines}
          totalKotor={totalKotor}
          totalBersih={totalBersih}
          totalItem={totalItem}
          loading={loading}
          onChangeQty={changeQty}
          onSetQty={setQty}
          onRemove={removeFromCart}
          onClear={clearCart}
          onCheckout={handleCheckout}
          embedded
        />
      </Modal>
    </div>
  );
}

type CartLine = {
  productId: string;
  qty: number;
  product: Product;
  subtotalKotor: number;
  subtotalBersih: number;
};

interface CartPanelProps {
  lines: CartLine[];
  totalKotor: number;
  totalBersih: number;
  totalItem: number;
  loading: boolean;
  onChangeQty: (id: string, delta: number) => void;
  onSetQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCheckout: () => void;
  embedded?: boolean;
}

function CartPanel({
  lines,
  totalKotor,
  totalBersih,
  totalItem,
  loading,
  onChangeQty,
  onSetQty,
  onRemove,
  onClear,
  onCheckout,
  embedded,
}: CartPanelProps) {
  const content = (
    <>
      {!embedded && (
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Keranjang</CardTitle>
          {lines.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-text-muted hover:text-danger-600"
            >
              Bersihkan
            </button>
          )}
        </CardHeader>
      )}
      <div className={embedded ? "" : "p-0"}>
        {lines.length === 0 ? (
          <EmptyState
            icon={<IconCart size={22} />}
            title="Keranjang kosong"
            description="Klik barang di samping untuk menambahkannya ke keranjang."
          />
        ) : (
          <>
            <ul className={`divide-y divide-border ${embedded ? "max-h-[50vh] overflow-y-auto -mx-1 px-1" : "max-h-[26rem] overflow-y-auto"}`}>
              {lines.map((l) => (
                <li key={l.productId} className="py-3 px-1 flex items-start gap-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug line-clamp-2">
                        {l.product.nama}
                      </p>
                      <button
                        onClick={() => onRemove(l.productId)}
                        className="shrink-0 w-7 h-7 -mt-1 -mr-1 inline-flex items-center justify-center rounded-md text-text-subtle hover:text-danger-600 hover:bg-danger-50"
                        aria-label="Hapus dari keranjang"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-text-subtle num">
                      {formatRp(l.product.harga_jual)} × {l.qty}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onChangeQty(l.productId, -1)}
                          className="w-8 h-8 rounded-md border border-border bg-white hover:bg-surface-muted flex items-center justify-center active:scale-95"
                          aria-label="Kurangi"
                        >
                          <IconMinus size={14} />
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={l.qty}
                          onChange={(e) =>
                            onSetQty(l.productId, parseInt(e.target.value) || 0)
                          }
                          className="w-12 h-8 text-center num font-semibold text-sm border border-border rounded-md outline-none focus:border-brand-500"
                        />
                        <button
                          onClick={() => onChangeQty(l.productId, +1)}
                          className="w-8 h-8 rounded-md border border-border bg-white hover:bg-surface-muted flex items-center justify-center active:scale-95"
                          aria-label="Tambah"
                        >
                          <IconPlus size={14} />
                        </button>
                      </div>
                      <span className="num text-sm font-semibold">
                        {formatRp(l.subtotalKotor)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className={`${embedded ? "mt-3" : "px-5 pb-5"} space-y-3`}>
              <div className={`${embedded ? "" : ""} p-4 rounded-xl bg-brand-600 text-white`}>
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-80">Total Bayar</span>
                  <span className="num font-semibold text-xl">
                    {formatRp(totalKotor)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1 text-white/80">
                  <span>{totalItem} item · Laba bersih</span>
                  <span className="num">{formatRp(totalBersih)}</span>
                </div>
              </div>
              <Button
                onClick={onCheckout}
                loading={loading}
                fullWidth
                size="lg"
                variant="success"
              >
                {loading ? "Memproses..." : "Catat Penjualan"}
              </Button>
              {embedded && (
                <button
                  onClick={onClear}
                  className="w-full text-center text-xs text-text-muted hover:text-danger-600 py-1"
                >
                  Kosongkan keranjang
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );

  if (embedded) return <div className="pt-2">{content}</div>;

  return <Card className="sticky top-6">{content}</Card>;
}
