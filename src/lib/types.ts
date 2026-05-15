export type Kategori = "KONTER" | "PRINTING";
export type StokTipe = "MASUK" | "KELUAR";

export interface Product {
  id: string;
  nama: string;
  kategori: Kategori;
  harga_modal: number;
  harga_jual: number;
  stok: number;
  stok_minimum: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  product_id: string;
  jumlah: number;
  harga_modal: number;
  harga_jual: number;
  margin: number;
  total_kotor: number;
  total_bersih: number;
  tanggal: string;
  products?: Product;
}

export interface BusinessSettings {
  id: number;
  brand_name: string;
  tagline: string;
  logo_url: string | null;
  updated_at: string;
}

export interface StockHistory {
  id: string;
  product_id: string;
  tipe: StokTipe;
  jumlah: number;
  keterangan: string | null;
  tanggal: string;
  products?: Product;
}
