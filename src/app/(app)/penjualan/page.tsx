"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Product } from "@/lib/types";

export default function PenjualanPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    const { data } = await supabase.from("products").select("*").gt("stok", 0).order("nama");
    if (data) setProducts(data);
  }

  async function handleJual(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const product = products.find((p) => p.id === selectedId);
    if (!product) return;
    if (jumlah > product.stok) { setMessage("Stok tidak cukup!"); setLoading(false); return; }

    // Insert transaction
    await supabase.from("transactions").insert({
      product_id: product.id,
      jumlah,
      harga_modal: product.harga_modal,
      harga_jual: product.harga_jual,
    });

    // Update stok
    await supabase.from("products").update({ stok: product.stok - jumlah }).eq("id", product.id);

    // Record stock history
    await supabase.from("stock_history").insert({
      product_id: product.id,
      tipe: "KELUAR",
      jumlah,
      keterangan: "Penjualan",
    });

    setMessage(`✅ Berhasil jual ${jumlah}x ${product.nama}`);
    setSelectedId("");
    setJumlah(1);
    setLoading(false);
    loadProducts();
  }

  const selected = products.find((p) => p.id === selectedId);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Penjualan</h1>

      <div className="bg-white p-6 rounded-xl border max-w-lg mb-8">
        <form onSubmit={handleJual} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Pilih Barang</label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full border rounded-lg px-3 py-2" required>
              <option value="">-- Pilih barang --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.nama} (stok: {p.stok})</option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
              <p>Kategori: <span className="font-medium">{selected.kategori}</span></p>
              <p>Harga Modal: <span className="font-medium">Rp {selected.harga_modal.toLocaleString("id-ID")}</span></p>
              <p>Harga Jual: <span className="font-medium">Rp {selected.harga_jual.toLocaleString("id-ID")}</span></p>
              <p>Margin: <span className="font-medium text-green-600">Rp {(selected.harga_jual - selected.harga_modal).toLocaleString("id-ID")}</span></p>
            </div>
          )}

          <div>
            <label className="text-sm text-gray-600 block mb-1">Jumlah</label>
            <input type="number" min={1} value={jumlah} onChange={(e) => setJumlah(+e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
          </div>

          {selected && jumlah > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg text-sm space-y-1">
              <p>Total Kotor: <span className="font-bold">Rp {(selected.harga_jual * jumlah).toLocaleString("id-ID")}</span></p>
              <p>Total Bersih: <span className="font-bold text-green-600">Rp {((selected.harga_jual - selected.harga_modal) * jumlah).toLocaleString("id-ID")}</span></p>
            </div>
          )}

          {message && <p className={`text-sm ${message.includes("✅") ? "text-green-600" : "text-red-500"}`}>{message}</p>}

          <button type="submit" disabled={loading || !selectedId} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
            {loading ? "Memproses..." : "Jual"}
          </button>
        </form>
      </div>
    </div>
  );
}
