-- Performance: indexes untuk query yang sering dipakai
-- Rekap & Dashboard sering filter+order by tanggal
CREATE INDEX IF NOT EXISTS idx_transactions_tanggal_desc
  ON transactions (tanggal DESC);

-- Join transactions -> products (lookup by FK)
CREATE INDEX IF NOT EXISTS idx_transactions_product_id
  ON transactions (product_id);

-- Riwayat stok: order by tanggal DESC limit 20
CREATE INDEX IF NOT EXISTS idx_stock_history_tanggal_desc
  ON stock_history (tanggal DESC);

CREATE INDEX IF NOT EXISTS idx_stock_history_product_id
  ON stock_history (product_id);

-- Stok page filter per kategori
CREATE INDEX IF NOT EXISTS idx_products_kategori
  ON products (kategori);

-- Order produk berdasar nama (default sort di Stok & Penjualan)
CREATE INDEX IF NOT EXISTS idx_products_nama
  ON products (nama);
