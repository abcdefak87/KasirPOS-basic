"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Transaction } from "@/lib/types";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  IconReceipt,
  IconWallet,
  IconTrending,
  IconInbox,
  IconArrowDown,
} from "@/components/ui/Icon";
import { formatRp, formatDateID, formatTimeID } from "@/components/ui/format";

function toIso(d: Date) {
  return d.toISOString().split("T")[0];
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

type Preset = "today" | "yesterday" | "7d" | "30d" | "month" | "custom";

const presets: { key: Preset; label: string }[] = [
  { key: "today", label: "Hari ini" },
  { key: "yesterday", label: "Kemarin" },
  { key: "7d", label: "7 hari" },
  { key: "30d", label: "30 hari" },
  { key: "month", label: "Bulan ini" },
];

function presetRange(p: Preset): { from: string; to: string } {
  const today = new Date();
  switch (p) {
    case "today":
      return { from: toIso(today), to: toIso(today) };
    case "yesterday": {
      const y = addDays(today, -1);
      return { from: toIso(y), to: toIso(y) };
    }
    case "7d":
      return { from: toIso(addDays(today, -6)), to: toIso(today) };
    case "30d":
      return { from: toIso(addDays(today, -29)), to: toIso(today) };
    case "month":
      return { from: toIso(startOfMonth(today)), to: toIso(today) };
    default:
      return { from: toIso(today), to: toIso(today) };
  }
}

export default function RekapPage() {
  const supabase = createClient();
  const toast = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const today = toIso(new Date());
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [activePreset, setActivePreset] = useState<Preset>("today");
  const [loading, setLoading] = useState(true);

  const loadRekap = useCallback(async () => {
    setLoading(true);
    // exclusive upper bound: query < (to + 1)
    const upper = toIso(addDays(new Date(to), 1));
    const { data } = await supabase
      .from("transactions")
      .select("*, products(nama, kategori)")
      .gte("tanggal", from)
      .lt("tanggal", upper)
      .order("tanggal", { ascending: false });
    if (data) setTransactions(data);
    setLoading(false);
  }, [supabase, from, to]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRekap();
  }, [loadRekap]);

  function applyPreset(p: Preset) {
    const r = presetRange(p);
    setFrom(r.from);
    setTo(r.to);
    setActivePreset(p);
  }

  function changeFrom(v: string) {
    setFrom(v);
    setActivePreset("custom");
  }
  function changeTo(v: string) {
    setTo(v);
    setActivePreset("custom");
  }

  const totalKotor = transactions.reduce((s, t) => s + t.total_kotor, 0);
  const totalBersih = transactions.reduce((s, t) => s + t.total_bersih, 0);
  const totalItem = transactions.reduce((s, t) => s + t.jumlah, 0);
  const marginPct = totalKotor > 0 ? ((totalBersih / totalKotor) * 100).toFixed(1) : "0";

  const isRange = from !== to;

  // Breakdown per kategori
  const kategoriBreak = useMemo(() => {
    const acc: Record<string, { kotor: number; bersih: number; qty: number }> = {
      KONTER: { kotor: 0, bersih: 0, qty: 0 },
      PRINTING: { kotor: 0, bersih: 0, qty: 0 },
    };
    transactions.forEach((t) => {
      const k = (t.products as unknown as { kategori?: string })?.kategori || "KONTER";
      const slot = acc[k] || (acc[k] = { kotor: 0, bersih: 0, qty: 0 });
      slot.kotor += t.total_kotor;
      slot.bersih += t.total_bersih;
      slot.qty += t.jumlah;
    });
    return acc;
  }, [transactions]);

  // Breakdown per hari (only for range)
  const dailyBreak = useMemo(() => {
    if (!isRange) return [];
    const acc = new Map<string, { tanggal: string; kotor: number; bersih: number; qty: number; trx: number }>();
    transactions.forEach((t) => {
      const d = toIso(new Date(t.tanggal));
      const slot = acc.get(d) || { tanggal: d, kotor: 0, bersih: 0, qty: 0, trx: 0 };
      slot.kotor += t.total_kotor;
      slot.bersih += t.total_bersih;
      slot.qty += t.jumlah;
      slot.trx += 1;
      acc.set(d, slot);
    });
    return Array.from(acc.values()).sort((a, b) => (a.tanggal > b.tanggal ? -1 : 1));
  }, [transactions, isRange]);

  function exportCSV() {
    if (transactions.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const header = [
      "Tanggal",
      "Waktu",
      "Barang",
      "Kategori",
      "Qty",
      "Harga Modal",
      "Harga Jual",
      "Margin/pcs",
      "Total Kotor",
      "Total Bersih",
    ];
    const rows = transactions.map((t) => {
      const d = new Date(t.tanggal);
      const kategori = (t.products as unknown as { kategori?: string })?.kategori || "";
      return [
        d.toLocaleDateString("id-ID"),
        d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        `"${(t.products?.nama || "").replace(/"/g, '""')}"`,
        kategori,
        t.jumlah,
        t.harga_modal,
        t.harga_jual,
        t.margin,
        t.total_kotor,
        t.total_bersih,
      ].join(",");
    });
    const totalsRow = [
      "",
      "",
      "TOTAL",
      "",
      totalItem,
      "",
      "",
      "",
      totalKotor,
      totalBersih,
    ].join(",");
    const csv = [header.join(","), ...rows, totalsRow].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekap-${from}_${to}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV diunduh");
  }

  const rangeLabel = isRange
    ? `${formatDateID(from)} – ${formatDateID(to)}`
    : formatDateID(from);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rekap Penjualan</h1>
          <p className="text-sm text-text-muted mt-0.5">{rangeLabel}</p>
        </div>
        <Button variant="secondary" onClick={exportCSV} disabled={transactions.length === 0}>
          <IconArrowDown size={16} /> Export CSV
        </Button>
      </div>

      {/* Date filters */}
      <Card>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => {
              const active = activePreset === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => applyPreset(p.key)}
                  className={`h-8 px-3 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? "bg-brand-600 text-white"
                      : "bg-surface-muted text-text-muted hover:text-text hover:bg-border"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
            <button
              onClick={() => setActivePreset("custom")}
              className={`h-8 px-3 rounded-full text-xs font-medium transition-colors ${
                activePreset === "custom"
                  ? "bg-brand-600 text-white"
                  : "bg-surface-muted text-text-muted hover:text-text hover:bg-border"
              }`}
            >
              Custom
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="date"
              label="Dari"
              value={from}
              max={to}
              onChange={(e) => changeFrom(e.target.value)}
              className="num"
            />
            <Input
              type="date"
              label="Sampai"
              value={to}
              min={from}
              max={today}
              onChange={(e) => changeTo(e.target.value)}
              className="num"
            />
          </div>
        </CardBody>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))
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

      {/* Category breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {(["KONTER", "PRINTING"] as const).map((k) => {
          const slot = kategoriBreak[k];
          const tone = k === "KONTER" ? "konter" : "printing";
          const pct =
            totalKotor > 0 ? ((slot.kotor / totalKotor) * 100).toFixed(0) : "0";
          return (
            <Card key={k}>
              <CardBody>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge tone={tone}>{k === "KONTER" ? "Konter" : "Printing"}</Badge>
                    <span className="text-xs text-text-subtle">{slot.qty} item</span>
                  </div>
                  <span className="text-xs text-text-subtle num">{pct}%</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-text-subtle">Omzet</p>
                    <p className="num font-semibold">{formatRp(slot.kotor)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-subtle">Laba</p>
                    <p className="num font-semibold text-success-700">
                      {formatRp(slot.bersih)}
                    </p>
                  </div>
                </div>
                <div className="h-1.5 mt-3 bg-surface-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${k === "KONTER" ? "bg-konter-600" : "bg-printing-600"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Daily breakdown - only for range */}
      {isRange && (
        <Card>
          <CardHeader>
            <CardTitle>Breakdown per Hari</CardTitle>
          </CardHeader>
          <CardBody className="!p-0">
            {dailyBreak.length === 0 ? (
              <EmptyState
                icon={<IconInbox size={22} />}
                title="Tidak ada data"
                description="Tidak ada transaksi pada rentang ini."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-muted text-text-muted text-xs uppercase tracking-wide">
                      <th className="text-left px-5 py-3 font-medium">Tanggal</th>
                      <th className="text-right px-3 py-3 font-medium">Trx</th>
                      <th className="text-right px-3 py-3 font-medium">Item</th>
                      <th className="text-right px-3 py-3 font-medium">Omzet</th>
                      <th className="text-right px-5 py-3 font-medium">Laba</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyBreak.map((d) => (
                      <tr key={d.tanggal} className="border-t border-border hover:bg-surface-muted/40">
                        <td className="px-5 py-3 font-medium">{formatDateID(d.tanggal)}</td>
                        <td className="px-3 py-3 text-right num">{d.trx}</td>
                        <td className="px-3 py-3 text-right num">{d.qty}</td>
                        <td className="px-3 py-3 text-right num font-medium">{formatRp(d.kotor)}</td>
                        <td className="px-5 py-3 text-right num font-semibold text-success-700">
                          {formatRp(d.bersih)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Transaction list */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Detail Transaksi</CardTitle>
          <span className="text-xs text-text-subtle">{transactions.length} transaksi</span>
        </CardHeader>
        <CardBody className="!p-0">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-muted text-text-muted text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Waktu</th>
                  <th className="text-left px-3 py-3 font-medium">Barang</th>
                  <th className="text-left px-3 py-3 font-medium">Kategori</th>
                  <th className="text-right px-3 py-3 font-medium">Qty</th>
                  <th className="text-right px-3 py-3 font-medium">Modal</th>
                  <th className="text-right px-3 py-3 font-medium">Jual</th>
                  <th className="text-right px-3 py-3 font-medium">Total Kotor</th>
                  <th className="text-right px-5 py-3 font-medium">Total Bersih</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-border">
                      <td colSpan={8} className="px-5 py-3">
                        <div className="h-6 bg-surface-muted rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        icon={<IconInbox size={22} />}
                        title="Belum ada transaksi"
                        description={`Tidak ada transaksi pada ${rangeLabel}.`}
                      />
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => {
                    const kategori = (t.products as unknown as { kategori: string })?.kategori;
                    return (
                      <tr key={t.id} className="border-t border-border hover:bg-surface-muted/40">
                        <td className="px-5 py-3 num text-text-muted whitespace-nowrap">
                          {isRange ? (
                            <>
                              <span className="block">{formatDateID(t.tanggal)}</span>
                              <span className="text-xs text-text-subtle">{formatTimeID(t.tanggal)}</span>
                            </>
                          ) : (
                            formatTimeID(t.tanggal)
                          )}
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
                    <td colSpan={2}></td>
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
                description={`Tidak ada transaksi pada ${rangeLabel}.`}
              />
            ) : (
              transactions.map((t) => {
                const kategori = (t.products as unknown as { kategori: string })?.kategori;
                return (
                  <div key={t.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{t.products?.nama}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge tone={kategori === "KONTER" ? "konter" : "printing"}>
                            {kategori === "KONTER" ? "Konter" : "Printing"}
                          </Badge>
                          <span className="text-xs text-text-subtle num">
                            {isRange
                              ? `${formatDateID(t.tanggal)} ${formatTimeID(t.tanggal)}`
                              : formatTimeID(t.tanggal)}
                            {" · "}{t.jumlah} pcs
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
