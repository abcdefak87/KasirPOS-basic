"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Transaction } from "@/lib/types";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import {
  IconReceipt,
  IconWallet,
  IconTrending,
  IconCalendar,
  IconInbox,
} from "@/components/ui/Icon";
import { formatRp, formatDateID, formatTimeID } from "@/components/ui/format";

export default function RekapPage() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);

  const loadRekap = useCallback(async () => {
    setLoading(true);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const { data } = await supabase
      .from("transactions")
      .select("*, products(nama, kategori)")
      .gte("tanggal", date)
      .lt("tanggal", nextDay.toISOString().split("T")[0])
      .order("tanggal", { ascending: false });
    if (data) setTransactions(data);
    setLoading(false);
  }, [date, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRekap();
  }, [loadRekap]);

  const totalKotor = transactions.reduce((s, t) => s + t.total_kotor, 0);
  const totalBersih = transactions.reduce((s, t) => s + t.total_bersih, 0);
  const totalItem = transactions.reduce((s, t) => s + t.jumlah, 0);
  const marginPct = totalKotor > 0 ? ((totalBersih / totalKotor) * 100).toFixed(1) : "0";

  const isToday = date === new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rekap Penjualan</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {formatDateID(date)} {isToday && <span className="text-brand-700">· hari ini</span>}
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            leadingIcon={<IconCalendar size={18} />}
            className="num"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              label="Transaksi"
              value={transactions.length}
              hint={`${totalItem} item`}
              icon={<IconReceipt size={18} />}
            />
            <StatCard
              label="Omzet"
              value={formatRp(totalKotor)}
              hint="Pendapatan kotor"
              tone="brand"
              icon={<IconWallet size={18} />}
            />
            <StatCard
              label="Laba"
              value={formatRp(totalBersih)}
              hint="Pendapatan bersih"
              tone="success"
              icon={<IconTrending size={18} />}
            />
            <StatCard label="Margin" value={`${marginPct}%`} hint="Laba / Omzet" />
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Detail Transaksi</CardTitle>
          <span className="text-xs text-text-subtle">{transactions.length} transaksi</span>
        </CardHeader>
        <CardBody className="!p-0">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr className="bg-surface-muted text-text-muted text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Waktu</th>
                  <th className="text-left px-3 py-3 font-medium">Barang</th>
                  <th className="text-left px-3 py-3 font-medium">Kategori</th>
                  <th className="text-right px-3 py-3 font-medium">Qty</th>
                  <th className="text-right px-3 py-3 font-medium">Modal</th>
                  <th className="text-right px-3 py-3 font-medium">Jual</th>
                  <th className="text-right px-3 py-3 font-medium">Margin/pcs</th>
                  <th className="text-right px-3 py-3 font-medium">Total Kotor</th>
                  <th className="text-right px-5 py-3 font-medium">Total Bersih</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-border">
                      <td colSpan={9} className="px-5 py-3">
                        <div className="h-6 bg-surface-muted rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState
                        icon={<IconInbox size={22} />}
                        title="Belum ada transaksi"
                        description={`Tidak ada transaksi pada ${formatDateID(date)}.`}
                      />
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => {
                    const kategori = (t.products as unknown as { kategori: string })?.kategori;
                    return (
                      <tr key={t.id} className="border-t border-border hover:bg-surface-muted/40">
                        <td className="px-5 py-3 num text-text-muted">
                          {formatTimeID(t.tanggal)}
                        </td>
                        <td className="px-3 py-3 font-medium">{t.products?.nama}</td>
                        <td className="px-3 py-3">
                          <Badge tone={kategori === "KONTER" ? "konter" : "printing"}>
                            {kategori === "KONTER" ? "Konter" : "Printing"}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-right num">{t.jumlah}</td>
                        <td className="px-3 py-3 text-right num text-text-muted">
                          {formatRp(t.harga_modal)}
                        </td>
                        <td className="px-3 py-3 text-right num">{formatRp(t.harga_jual)}</td>
                        <td className="px-3 py-3 text-right num text-success-700">
                          {formatRp(t.margin)}
                        </td>
                        <td className="px-3 py-3 text-right num font-medium">
                          {formatRp(t.total_kotor)}
                        </td>
                        <td className="px-5 py-3 text-right num font-semibold text-success-700">
                          {formatRp(t.total_bersih)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {!loading && transactions.length > 0 && (
                <tfoot>
                  <tr className="bg-surface-muted/60 border-t border-border">
                    <td colSpan={3} className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                      Total
                    </td>
                    <td className="px-3 py-3 text-right num font-semibold">{totalItem}</td>
                    <td colSpan={3}></td>
                    <td className="px-3 py-3 text-right num font-semibold">{formatRp(totalKotor)}</td>
                    <td className="px-5 py-3 text-right num font-semibold text-success-700">
                      {formatRp(totalBersih)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-14" />
                </div>
              ))
            ) : transactions.length === 0 ? (
              <EmptyState
                icon={<IconInbox size={22} />}
                title="Belum ada transaksi"
                description={`Tidak ada transaksi pada ${formatDateID(date)}.`}
              />
            ) : (
              transactions.map((t) => {
                const kategori = (t.products as unknown as { kategori: string })?.kategori;
                return (
                  <div key={t.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{t.products?.nama}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge tone={kategori === "KONTER" ? "konter" : "printing"}>
                            {kategori === "KONTER" ? "Konter" : "Printing"}
                          </Badge>
                          <span className="text-xs text-text-subtle num">
                            {formatTimeID(t.tanggal)} · {t.jumlah} pcs
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="num font-semibold">{formatRp(t.total_kotor)}</p>
                        <p className="num text-xs text-success-700">+{formatRp(t.total_bersih)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
