"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Product, Kategori, StockHistory } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  IconPlus,
  IconSearch,
  IconBox,
  IconEdit,
  IconTrash,
  IconArrowDown,
  IconArrowUp,
} from "@/components/ui/Icon";
import { formatRp, formatDateID, formatTimeID } from "@/components/ui/format";

type FilterKey = "ALL" | Kategori;

export default function StokPage() {
  const supabase = createClient();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<StockHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [stokTarget, setStokTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    nama: "",
    kategori: "KONTER" as Kategori,
    harga_modal: 0,
    harga_jual: 0,
    stok: 0,
    stok_minimum: 5,
  });
  const [stokInput, setStokInput] = useState({
    jumlah: 0,
    tipe: "MASUK" as "MASUK" | "KELUAR",
    keterangan: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: hist }] = await Promise.all([
      supabase.from("products").select("*").order("nama"),
      supabase
        .from("stock_history")
        .select("*, products(nama)")
        .order("tanggal", { ascending: false })
        .limit(20),
    ]);
    if (data) setProducts(data);
    if (hist) setHistory(hist);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  function resetForm() {
    setForm({ nama: "", kategori: "KONTER", harga_modal: 0, harga_jual: 0, stok: 0, stok_minimum: 5 });
  }

  function openAdd() {
    resetForm();
    setEditTarget(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setForm({
      nama: p.nama,
      kategori: p.kategori,
      harga_modal: p.harga_modal,
      harga_jual: p.harga_jual,
      stok: p.stok,
      stok_minimum: p.stok_minimum,
    });
    setEditTarget(p);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditTarget(null);
    resetForm();
  }

  async function handleSubmitProduct(e: React.FormEvent) {
    e.preventDefault();
    if (form.harga_jual < form.harga_modal) {
      toast.error("Harga jual tidak boleh lebih kecil dari harga modal");
      return;
    }
    setSubmitting(true);
    if (editTarget) {
      const { error } = await supabase
        .from("products")
        .update({
          nama: form.nama,
          kategori: form.kategori,
          harga_modal: form.harga_modal,
          harga_jual: form.harga_jual,
          stok_minimum: form.stok_minimum,
        })
        .eq("id", editTarget.id);
      setSubmitting(false);
      if (error) {
        toast.error("Gagal menyimpan: " + error.message);
        return;
      }
      toast.success(`"${form.nama}" diperbarui`);
    } else {
      const { error } = await supabase.from("products").insert(form);
      setSubmitting(false);
      if (error) {
        toast.error("Gagal menambah barang: " + error.message);
        return;
      }
      toast.success(`Barang "${form.nama}" ditambahkan`);
    }
    closeForm();
    loadData();
  }

  async function handleStokUpdate() {
    if (!stokTarget) return;
    if (stokInput.jumlah <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }
    setSubmitting(true);
    const newStok =
      stokInput.tipe === "MASUK"
        ? stokTarget.stok + stokInput.jumlah
        : stokTarget.stok - stokInput.jumlah;
    if (newStok < 0) {
      setSubmitting(false);
      toast.error("Stok tidak boleh negatif");
      return;
    }
    await supabase.from("products").update({ stok: newStok }).eq("id", stokTarget.id);
    await supabase.from("stock_history").insert({
      product_id: stokTarget.id,
      tipe: stokInput.tipe,
      jumlah: stokInput.jumlah,
      keterangan: stokInput.keterangan,
    });
    setSubmitting(false);
    toast.success(
      `${stokInput.tipe === "MASUK" ? "+" : "-"}${stokInput.jumlah} stok ${stokTarget.nama}`
    );
    setStokTarget(null);
    setStokInput({ jumlah: 0, tipe: "MASUK", keterangan: "" });
    loadData();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSubmitting(true);
    const { error } = await supabase.from("products").delete().eq("id", deleteTarget.id);
    setSubmitting(false);
    if (error) {
      toast.error("Gagal menghapus: " + error.message);
      return;
    }
    toast.success(`"${deleteTarget.nama}" dihapus`);
    setDeleteTarget(null);
    loadData();
  }

  const filtered = useMemo(() => {
    return products
      .filter((p) => (filter === "ALL" ? true : p.kategori === filter))
      .filter((p) => p.nama.toLowerCase().includes(search.toLowerCase()));
  }, [products, filter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manajemen Stok</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {products.length} barang terdaftar
          </p>
        </div>
        <Button onClick={openAdd}>
          <IconPlus size={18} /> Tambah Barang
        </Button>
      </div>

      {/* Filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Cari nama barang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leadingIcon={<IconSearch size={18} />}
          />
        </div>
        <div className="flex gap-1 p-1 bg-surface-muted rounded-lg w-fit">
          {(["ALL", "KONTER", "PRINTING"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 h-8 rounded-md text-sm font-medium transition-colors ${
                filter === k ? "bg-white text-text shadow-card" : "text-text-muted hover:text-text"
              }`}
            >
              {k === "ALL" ? "Semua" : k === "KONTER" ? "Konter" : "Printing"}
            </button>
          ))}
        </div>
      </div>

      {/* Product list - desktop table */}
      <Card className="overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-muted text-text-muted text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Nama</th>
                <th className="text-left px-3 py-3 font-medium">Kategori</th>
                <th className="text-right px-3 py-3 font-medium">Modal</th>
                <th className="text-right px-3 py-3 font-medium">Jual</th>
                <th className="text-right px-3 py-3 font-medium">Margin</th>
                <th className="text-right px-3 py-3 font-medium">Stok</th>
                <th className="text-right px-5 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td colSpan={7} className="px-5 py-3">
                      <div className="h-6 bg-surface-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<IconBox size={22} />}
                      title={search ? "Tidak ada hasil" : "Belum ada barang"}
                      description={search ? `Tidak ditemukan "${search}"` : "Tambah barang pertama untuk mulai."}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const margin = p.harga_jual - p.harga_modal;
                  const marginPct = p.harga_jual > 0 ? ((margin / p.harga_jual) * 100).toFixed(0) : "0";
                  const stockTone =
                    p.stok === 0 ? "danger" : p.stok <= p.stok_minimum ? "warning" : "neutral";
                  return (
                    <tr
                      key={p.id}
                      className="border-t border-border hover:bg-surface-muted/40 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium">{p.nama}</td>
                      <td className="px-3 py-3">
                        <Badge tone={p.kategori === "KONTER" ? "konter" : "printing"}>
                          {p.kategori === "KONTER" ? "Konter" : "Printing"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-right num text-text-muted">{formatRp(p.harga_modal)}</td>
                      <td className="px-3 py-3 text-right num font-medium">{formatRp(p.harga_jual)}</td>
                      <td className="px-3 py-3 text-right num text-success-700">
                        {formatRp(margin)}
                        <span className="text-text-subtle text-xs ml-1">({marginPct}%)</span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Badge tone={stockTone}>
                          {p.stok === 0 ? "Habis" : `${p.stok}`}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setStokTarget(p)}
                          >
                            Stok
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(p)}
                            aria-label="Edit"
                            className="!px-2"
                          >
                            <IconEdit size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(p)}
                            aria-label="Hapus"
                            className="!px-2 hover:!text-danger-600 hover:!bg-danger-50"
                          >
                            <IconTrash size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="h-14 bg-surface-muted rounded animate-pulse" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<IconBox size={22} />}
              title={search ? "Tidak ada hasil" : "Belum ada barang"}
              description={search ? `Tidak ditemukan "${search}"` : "Tambah barang pertama untuk mulai."}
            />
          ) : (
            filtered.map((p) => {
              const stockTone =
                p.stok === 0 ? "danger" : p.stok <= p.stok_minimum ? "warning" : "neutral";
              return (
                <div key={p.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{p.nama}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge tone={p.kategori === "KONTER" ? "konter" : "printing"}>
                          {p.kategori === "KONTER" ? "Konter" : "Printing"}
                        </Badge>
                        <Badge tone={stockTone}>
                          {p.stok === 0 ? "Habis" : `Stok ${p.stok}`}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-text-subtle">Modal</p>
                      <p className="num">{formatRp(p.harga_modal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-subtle">Jual</p>
                      <p className="num font-medium">{formatRp(p.harga_jual)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" fullWidth onClick={() => setStokTarget(p)}>
                      Update Stok
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(p)}
                      aria-label="Edit"
                    >
                      <IconEdit size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(p)}
                      aria-label="Hapus"
                      className="hover:!text-danger-600 hover:!bg-danger-50"
                    >
                      <IconTrash size={16} />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Stok</CardTitle>
          <p className="text-xs text-text-subtle mt-0.5">20 entri terakhir</p>
        </CardHeader>
        <CardBody className="!p-0">
          {history.length === 0 ? (
            <EmptyState
              icon={<IconBox size={22} />}
              title="Belum ada riwayat"
              description="Riwayat masuk/keluar stok akan muncul di sini."
            />
          ) : (
            <ul className="divide-y divide-border">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="px-5 py-3 flex items-center gap-3 text-sm"
                >
                  <span
                    className={`shrink-0 w-9 h-9 inline-flex items-center justify-center rounded-lg ${
                      h.tipe === "MASUK"
                        ? "bg-success-50 text-success-700"
                        : "bg-danger-50 text-danger-600"
                    }`}
                  >
                    {h.tipe === "MASUK" ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{h.products?.nama}</p>
                    <p className="text-xs text-text-subtle truncate">
                      {h.keterangan || "—"} · {formatDateID(h.tanggal)} {formatTimeID(h.tanggal)}
                    </p>
                  </div>
                  <span
                    className={`num font-semibold text-sm shrink-0 ${
                      h.tipe === "MASUK" ? "text-success-700" : "text-danger-600"
                    }`}
                  >
                    {h.tipe === "MASUK" ? "+" : "-"}
                    {h.jumlah}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Product Modal (add / edit) */}
      <Modal
        open={showForm}
        onClose={closeForm}
        title={editTarget ? "Edit Barang" : "Tambah Barang Baru"}
        description={
          editTarget
            ? "Stok hanya bisa diubah lewat tombol Stok agar tercatat di riwayat."
            : "Catat barang konter atau printing yang dijual."
        }
      >
        <form onSubmit={handleSubmitProduct} className="space-y-3 pt-2">
          <Input
            label="Nama barang"
            placeholder="cth: Pulsa 10K"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            required
          />
          <Select
            label="Kategori"
            value={form.kategori}
            onChange={(e) => setForm({ ...form, kategori: e.target.value as Kategori })}
          >
            <option value="KONTER">Konter</option>
            <option value="PRINTING">Printing</option>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="Harga modal"
              placeholder="0"
              value={form.harga_modal || ""}
              onChange={(e) => setForm({ ...form, harga_modal: +e.target.value })}
              required
            />
            <Input
              type="number"
              label="Harga jual"
              placeholder="0"
              value={form.harga_jual || ""}
              onChange={(e) => setForm({ ...form, harga_jual: +e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {editTarget ? (
              <Input
                type="number"
                label="Stok saat ini"
                value={form.stok}
                disabled
                hint="Ubah lewat menu Stok"
              />
            ) : (
              <Input
                type="number"
                label="Stok awal"
                placeholder="0"
                value={form.stok || ""}
                onChange={(e) => setForm({ ...form, stok: +e.target.value })}
              />
            )}
            <Input
              type="number"
              label="Alert minimum"
              placeholder="5"
              value={form.stok_minimum || ""}
              onChange={(e) => setForm({ ...form, stok_minimum: +e.target.value })}
              hint="Notifikasi saat stok ≤ angka ini"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={closeForm}>
              Batal
            </Button>
            <Button type="submit" fullWidth loading={submitting}>
              {editTarget ? "Simpan Perubahan" : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stok Update Modal */}
      <Modal
        open={!!stokTarget}
        onClose={() => setStokTarget(null)}
        title="Update Stok"
        description={stokTarget ? `${stokTarget.nama} · stok saat ini: ${stokTarget.stok}` : undefined}
      >
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-1 p-1 bg-surface-muted rounded-lg">
            {(["MASUK", "KELUAR"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setStokInput({ ...stokInput, tipe: t })}
                className={`h-9 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  stokInput.tipe === t
                    ? t === "MASUK"
                      ? "bg-white text-success-700 shadow-card"
                      : "bg-white text-danger-600 shadow-card"
                    : "text-text-muted hover:text-text"
                }`}
              >
                {t === "MASUK" ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />}
                Stok {t === "MASUK" ? "Masuk" : "Keluar"}
              </button>
            ))}
          </div>
          <Input
            type="number"
            label="Jumlah"
            placeholder="0"
            value={stokInput.jumlah || ""}
            onChange={(e) => setStokInput({ ...stokInput, jumlah: +e.target.value })}
          />
          <Input
            label="Keterangan (opsional)"
            placeholder="cth: Beli dari supplier"
            value={stokInput.keterangan}
            onChange={(e) => setStokInput({ ...stokInput, keterangan: e.target.value })}
          />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setStokTarget(null)}>
              Batal
            </Button>
            <Button fullWidth onClick={handleStokUpdate} loading={submitting}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus barang?"
        description={
          deleteTarget
            ? `"${deleteTarget.nama}" akan dihapus permanen beserta riwayatnya.`
            : ""
        }
        confirmLabel="Hapus"
        loading={submitting}
      />
    </div>
  );
}
