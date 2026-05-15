"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Product, Kategori, StockHistory } from "@/lib/types";

export default function StokPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<StockHistory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showStokForm, setShowStokForm] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | Kategori>("ALL");
  const [form, setForm] = useState({ nama: "", kategori: "KONTER" as Kategori, harga_modal: 0, harga_jual: 0, stok: 0, stok_minimum: 5 });
  const [stokInput, setStokInput] = useState({ jumlah: 0, tipe: "MASUK" as "MASUK" | "KELUAR", keterangan: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data } = await supabase.from("products").select("*").order("nama");
    if (data) setProducts(data);
    const { data: hist } = await supabase.from("stock_history").select("*, products(nama)").order("tanggal", { ascending: false }).limit(20);
    if (hist) setHistory(hist);
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from("products").insert(form);
    setShowForm(false);
    setForm({ nama: "", kategori: "KONTER", harga_modal: 0, harga_jual: 0, stok: 0, stok_minimum: 5 });
    loadData();
  }

  async function handleStokUpdate(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const newStok = stokInput.tipe === "MASUK" ? product.stok + stokInput.jumlah : product.stok - stokInput.jumlah;
    await supabase.from("products").update({ stok: newStok }).eq("id", productId);
    await supabase.from("stock_history").insert({ product_id: productId, tipe: stokInput.tipe, jumlah: stokInput.jumlah, keterangan: stokInput.keterangan });
    setShowStokForm(null);
    setStokInput({ jumlah: 0, tipe: "MASUK", keterangan: "" });
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus produk ini?")) return;
    await supabase.from("products").delete().eq("id", id);
    loadData();
  }

  const filtered = filter === "ALL" ? products : products.filter((p) => p.kategori === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manajemen Stok</h1>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Tambah Barang</button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(["ALL", "KONTER", "PRINTING"] as const).map((k) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1 rounded-full text-sm ${filter === k ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
            {k === "ALL" ? "Semua" : k}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="bg-white rounded-xl border overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">Nama</th>
              <th className="text-left p-3">Kategori</th>
              <th className="text-right p-3">Modal</th>
              <th className="text-right p-3">Jual</th>
              <th className="text-right p-3">Stok</th>
              <th className="text-center p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{p.nama}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${p.kategori === "KONTER" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"}`}>{p.kategori}</span></td>
                <td className="p-3 text-right">Rp {p.harga_modal.toLocaleString("id-ID")}</td>
                <td className="p-3 text-right">Rp {p.harga_jual.toLocaleString("id-ID")}</td>
                <td className={`p-3 text-right font-medium ${p.stok <= p.stok_minimum ? "text-red-500" : ""}`}>{p.stok}</td>
                <td className="p-3 text-center space-x-2">
                  <button onClick={() => setShowStokForm(p.id)} className="text-blue-600 hover:underline text-xs">Stok</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline text-xs">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stok Update Modal */}
      {showStokForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowStokForm(null)}>
          <div className="bg-white p-6 rounded-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold mb-4">Update Stok</h2>
            <div className="space-y-3">
              <select value={stokInput.tipe} onChange={(e) => setStokInput({ ...stokInput, tipe: e.target.value as "MASUK" | "KELUAR" })} className="w-full border rounded-lg px-3 py-2">
                <option value="MASUK">Stok Masuk</option>
                <option value="KELUAR">Stok Keluar</option>
              </select>
              <input type="number" placeholder="Jumlah" value={stokInput.jumlah || ""} onChange={(e) => setStokInput({ ...stokInput, jumlah: +e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              <input type="text" placeholder="Keterangan (opsional)" value={stokInput.keterangan} onChange={(e) => setStokInput({ ...stokInput, keterangan: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              <button onClick={() => handleStokUpdate(showStokForm)} className="w-full bg-blue-600 text-white py-2 rounded-lg">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <form onSubmit={handleAddProduct} className="bg-white p-6 rounded-xl w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold mb-2">Tambah Barang Baru</h2>
            <input type="text" placeholder="Nama barang" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
            <select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value as Kategori })} className="w-full border rounded-lg px-3 py-2">
              <option value="KONTER">Konter</option>
              <option value="PRINTING">Printing</option>
            </select>
            <input type="number" placeholder="Harga modal" value={form.harga_modal || ""} onChange={(e) => setForm({ ...form, harga_modal: +e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
            <input type="number" placeholder="Harga jual" value={form.harga_jual || ""} onChange={(e) => setForm({ ...form, harga_jual: +e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
            <input type="number" placeholder="Stok awal" value={form.stok || ""} onChange={(e) => setForm({ ...form, stok: +e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            <input type="number" placeholder="Stok minimum (alert)" value={form.stok_minimum || ""} onChange={(e) => setForm({ ...form, stok_minimum: +e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg">Simpan</button>
          </form>
        </div>
      )}

      {/* Riwayat Stok */}
      <h2 className="text-lg font-semibold mb-3">Riwayat Stok</h2>
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">Tanggal</th>
              <th className="text-left p-3">Barang</th>
              <th className="text-center p-3">Tipe</th>
              <th className="text-right p-3">Jumlah</th>
              <th className="text-left p-3">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id} className="border-b">
                <td className="p-3">{new Date(h.tanggal).toLocaleDateString("id-ID")}</td>
                <td className="p-3">{h.products?.nama}</td>
                <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded text-xs ${h.tipe === "MASUK" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{h.tipe}</span></td>
                <td className="p-3 text-right">{h.jumlah}</td>
                <td className="p-3 text-gray-500">{h.keterangan || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
