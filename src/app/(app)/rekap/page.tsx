"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Transaction } from "@/lib/types";

export default function RekapPage() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => { loadRekap(); }, [date]);

  async function loadRekap() {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const { data } = await supabase
      .from("transactions")
      .select("*, products(nama, kategori)")
      .gte("tanggal", date)
      .lt("tanggal", nextDay.toISOString().split("T")[0])
      .order("tanggal", { ascending: false });
    if (data) setTransactions(data);
  }

  const totalKotor = transactions.reduce((s, t) => s + t.total_kotor, 0);
  const totalBersih = transactions.reduce((s, t) => s + t.total_bersih, 0);
  const totalItem = transactions.reduce((s, t) => s + t.jumlah, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Rekap Penjualan</h1>

      <div className="mb-4">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded-lg px-3 py-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Total Item Terjual</p>
          <p className="text-xl font-bold">{totalItem}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Omzet (Kotor)</p>
          <p className="text-xl font-bold text-blue-600">Rp {totalKotor.toLocaleString("id-ID")}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Keuntungan (Bersih)</p>
          <p className="text-xl font-bold text-green-600">Rp {totalBersih.toLocaleString("id-ID")}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">Waktu</th>
              <th className="text-left p-3">Barang</th>
              <th className="text-center p-3">Kategori</th>
              <th className="text-right p-3">Qty</th>
              <th className="text-right p-3">Modal</th>
              <th className="text-right p-3">Jual</th>
              <th className="text-right p-3">Margin</th>
              <th className="text-right p-3">Total Kotor</th>
              <th className="text-right p-3">Total Bersih</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="p-3">{new Date(t.tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td>
                <td className="p-3">{t.products?.nama}</td>
                <td className="p-3 text-center"><span className="px-2 py-0.5 rounded text-xs bg-gray-100">{(t.products as unknown as { kategori: string })?.kategori}</span></td>
                <td className="p-3 text-right">{t.jumlah}</td>
                <td className="p-3 text-right">Rp {t.harga_modal.toLocaleString("id-ID")}</td>
                <td className="p-3 text-right">Rp {t.harga_jual.toLocaleString("id-ID")}</td>
                <td className="p-3 text-right text-green-600">Rp {t.margin.toLocaleString("id-ID")}</td>
                <td className="p-3 text-right">Rp {t.total_kotor.toLocaleString("id-ID")}</td>
                <td className="p-3 text-right font-medium text-green-600">Rp {t.total_bersih.toLocaleString("id-ID")}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr><td colSpan={9} className="p-4 text-center text-gray-400">Tidak ada transaksi pada tanggal ini</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
