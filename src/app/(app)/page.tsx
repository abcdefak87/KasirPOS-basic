"use client";
import { useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { Product, Transaction } from "@/lib/types";
import { useCachedQuery } from "@/lib/cache";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  IconReceipt,
  IconWallet,
  IconTrending,
  IconAlert,
  IconBox,
  IconInbox,
} from "@/components/ui/Icon";
import { formatRp, formatDateID } from "@/components/ui/format";

export default function DashboardPage() {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const fetchTrx = useCallback(async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*, products(nama)")
      .gte("tanggal", today);
    return (data || []) as Transaction[];
  }, [supabase, today]);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from("products").select("*").order("nama");
    return (data || []) as Product[];
  }, [supabase]);

  const { data: transactions = [], loading: loadingTrx } = useCachedQuery<Transaction[]>(
    `transactions:today:${today}`,
    fetchTrx,
    { staleMs: 10_000 }
  );
  const { data: allProducts = [], loading: loadingProducts } = useCachedQuery<Product[]>(
    "products",
    fetchProducts
  );

  const loading = loadingTrx || loadingProducts;

  const stats = useMemo(() => {
    const totalKotor = transactions.reduce((s, t) => s + t.total_kotor, 0);
    const totalBersih = transactions.reduce((s, t) => s + t.total_bersih, 0);
    const totalItem = transactions.reduce((s, t) => s + t.jumlah, 0);
    return { totalKotor, totalBersih, totalTransaksi: transactions.length, totalItem };
  }, [transactions]);

  const topProducts = useMemo(() => {
    const productMap: Record<string, number> = {};
    transactions.forEach((t: Transaction) => {
      const nama = t.products?.nama || "Unknown";
      productMap[nama] = (productMap[nama] || 0) + t.jumlah;
    });
    return Object.entries(productMap)
      .map(([nama, total]) => ({ nama, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [transactions]);

  const lowStock = useMemo(
    () =>
      allProducts
        .filter((p) => p.stok <= p.stok_minimum)
        .sort((a, b) => a.stok - b.stok),
    [allProducts]
  );

  const margin =
    stats.totalKotor > 0 ? ((stats.totalBersih / stats.totalKotor) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Ringkasan hari ini · {formatDateID(new Date())}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Transaksi"
              value={stats.totalTransaksi}
              hint={`${stats.totalItem} item terjual`}
              icon={<IconReceipt size={18} />}
            />
            <StatCard
              label="Omzet"
              value={formatRp(stats.totalKotor)}
              hint="Pendapatan kotor"
              tone="brand"
              icon={<IconWallet size={18} />}
            />
            <StatCard
              label="Laba Bersih"
              value={formatRp(stats.totalBersih)}
              hint={`Margin ${margin}%`}
              tone="success"
              icon={<IconTrending size={18} />}
            />
            <StatCard
              label="Stok Menipis"
              value={lowStock.length}
              hint={lowStock.length > 0 ? "Perlu restock" : "Semua aman"}
              tone={lowStock.length > 0 ? "warning" : "default"}
              icon={<IconAlert size={18} />}
            />
          </>
        )}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        <Card className="lg:col-span-3">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Barang Terlaris Hari Ini</CardTitle>
            <span className="text-xs text-text-subtle">Top 5</span>
          </CardHeader>
          <CardBody className="!p-0">
            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <EmptyState
                icon={<IconInbox size={22} />}
                title="Belum ada penjualan hari ini"
                description="Mulai transaksi dari halaman Penjualan."
              />
            ) : (
              <ul>
                {topProducts.map((p, i) => {
                  const max = topProducts[0]?.total || 1;
                  const pct = (p.total / max) * 100;
                  return (
                    <li
                      key={i}
                      className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-b-0"
                    >
                      <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-semibold">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.nama}</p>
                        <div className="h-1.5 mt-1.5 bg-surface-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-semibold num shrink-0">
                        {p.total}
                        <span className="text-text-subtle text-xs font-normal ml-1">terjual</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Stok Hampir Habis</CardTitle>
            {lowStock.length > 0 && (
              <Badge tone="warning">{lowStock.length}</Badge>
            )}
          </CardHeader>
          <CardBody className="!p-0">
            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : lowStock.length === 0 ? (
              <EmptyState
                icon={<IconBox size={22} />}
                title="Semua stok aman"
                description="Tidak ada produk di bawah ambang minimum."
              />
            ) : (
              <ul className="max-h-[20rem] overflow-y-auto">
                {lowStock.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.nama}</p>
                      <p className="text-xs text-text-subtle">Min {p.stok_minimum}</p>
                    </div>
                    <Badge tone={p.stok === 0 ? "danger" : "warning"}>
                      {p.stok === 0 ? "Habis" : `${p.stok} tersisa`}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
