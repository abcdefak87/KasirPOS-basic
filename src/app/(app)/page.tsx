"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Product, Transaction } from "@/lib/types";

export default function DashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState({ totalKotor: 0, totalBersih: 0, totalTransaksi: 0 });
  const [topProducts, setTopProducts] = useState<{ nama: string; total: number }[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const today = new Date().toISOString().split("T")[0];

    // Transaksi hari ini
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*, products(nama)")
      .gte("tanggal", today);

    if (transactions) {
      const totalKotor = transactions.reduce((s, t) => s + t.total_kotor, 0);
      const totalBersih = transactions.reduce((s, t) => s + t.total_bersih, 0);
      setStats({ totalKotor, totalBersih, totalTransaksi: transactions.length });

      // Top products
      const productMap: Record<string, number> = {};
      transactions.forEach((t: Transaction) => {
        const nama = t.products?.nama || "Unknown";
        productMap[nama] = (productMap[nama] || 0) + t.jumlah;
      });
      const sorted = Object.entries(productMap)
        .map(([nama, total]) => ({ nama, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      setTopProducts(sorted);
    }

    // Stok hampir habis
    const { data: products } = await supabase
      .from("products")
      .select("*")
      .filter("stok", "lte", "stok_minimum" as unknown as number);

    // Manual filter since we can't compare columns directly
    const { data: allProducts } = await supabase.from("products").select("*");
    if (allProducts) {
      setLowStock(allProducts.filter((p: Product) => p.stok <= p.stok_minimum));
    }
  }

  const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Hari Ini</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total Transaksi</p>
          <p className="text-2xl font-bold">{stats.totalTransaksi}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Pendapatan Kotor</p>
          <p className="text-2xl font-bold text-blue-600">{formatRp(stats.totalKotor)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Pendapatan Bersih</p>
          <p className="text-2xl font-bold text-green-600">{formatRp(stats.totalBersih)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <h2 className="font-semibold mb-3">🏆 Barang Terlaris</h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm">Belum ada transaksi hari ini</p>
          ) : (
            <ul className="space-y-2">
              {topProducts.map((p, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span>{p.nama}</span>
                  <span className="font-medium">{p.total} terjual</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <h2 className="font-semibold mb-3">⚠️ Stok Hampir Habis</h2>
          {lowStock.length === 0 ? (
            <p className="text-gray-400 text-sm">Semua stok aman</p>
          ) : (
            <ul className="space-y-2">
              {lowStock.map((p) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span>{p.nama}</span>
                  <span className={`font-medium ${p.stok === 0 ? "text-red-500" : "text-yellow-500"}`}>
                    {p.stok} tersisa
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
