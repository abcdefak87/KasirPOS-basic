-- Pengaturan bisnis (singleton)
CREATE TABLE IF NOT EXISTS business_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  brand_name TEXT NOT NULL DEFAULT 'KasirPOS',
  tagline TEXT NOT NULL DEFAULT 'Konter & Printing',
  logo_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT business_settings_singleton CHECK (id = 1)
);

-- Seed baris pertama
INSERT INTO business_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Public read agar sidebar/login bisa render brand sebelum login
CREATE POLICY "Public read business settings"
  ON business_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Hanya authenticated yang bisa update
CREATE POLICY "Authenticated update business settings"
  ON business_settings FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION touch_business_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS business_settings_touch ON business_settings;
CREATE TRIGGER business_settings_touch
  BEFORE UPDATE ON business_settings
  FOR EACH ROW EXECUTE FUNCTION touch_business_settings_updated_at();

-- Storage bucket untuk logo brand
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (idempotent)
DROP POLICY IF EXISTS "Public read brand-assets" ON storage.objects;
CREATE POLICY "Public read brand-assets"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'brand-assets');

DROP POLICY IF EXISTS "Authenticated upload brand-assets" ON storage.objects;
CREATE POLICY "Authenticated upload brand-assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'brand-assets');

DROP POLICY IF EXISTS "Authenticated update brand-assets" ON storage.objects;
CREATE POLICY "Authenticated update brand-assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'brand-assets')
  WITH CHECK (bucket_id = 'brand-assets');

DROP POLICY IF EXISTS "Authenticated delete brand-assets" ON storage.objects;
CREATE POLICY "Authenticated delete brand-assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'brand-assets');
