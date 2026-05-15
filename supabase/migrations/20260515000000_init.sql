-- Enum untuk kategori
CREATE TYPE kategori_type AS ENUM ('KONTER', 'PRINTING');
CREATE TYPE stok_tipe AS ENUM ('MASUK', 'KELUAR');

-- Tabel produk
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  kategori kategori_type NOT NULL,
  harga_modal INTEGER NOT NULL DEFAULT 0,
  harga_jual INTEGER NOT NULL DEFAULT 0,
  stok INTEGER NOT NULL DEFAULT 0,
  stok_minimum INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel transaksi penjualan
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  jumlah INTEGER NOT NULL,
  harga_modal INTEGER NOT NULL,
  harga_jual INTEGER NOT NULL,
  margin INTEGER GENERATED ALWAYS AS (harga_jual - harga_modal) STORED,
  total_kotor INTEGER GENERATED ALWAYS AS (harga_jual * jumlah) STORED,
  total_bersih INTEGER GENERATED ALWAYS AS ((harga_jual - harga_modal) * jumlah) STORED,
  tanggal TIMESTAMPTZ DEFAULT NOW()
);

-- Riwayat stok
CREATE TABLE stock_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  tipe stok_tipe NOT NULL,
  jumlah INTEGER NOT NULL,
  keterangan TEXT,
  tanggal TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Authenticated access" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated access" ON transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated access" ON stock_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
