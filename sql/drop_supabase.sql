-- Hapus semua kebijakan RLS
DROP POLICY IF EXISTS "Public Access" ON tkjt_gallery;
DROP POLICY IF EXISTS "Public Access" ON tkjt_picket_groups;
DROP POLICY IF EXISTS "Public Access" ON tkjt_picket_accounts;
DROP POLICY IF EXISTS "Public Access" ON tkjt_picket_reports;
DROP POLICY IF EXISTS "Public Access" ON tkjt_inventory;

-- Nonaktifkan Row Level Security (RLS)
ALTER TABLE tkjt_gallery DISABLE ROW LEVEL SECURITY;
ALTER TABLE tkjt_picket_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE tkjt_picket_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE tkjt_picket_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE tkjt_inventory DISABLE ROW LEVEL SECURITY;

-- Hapus semua tabel
DROP TABLE IF EXISTS tkjt_gallery;
DROP TABLE IF EXISTS tkjt_picket_groups;
DROP TABLE IF EXISTS tkjt_picket_accounts;
DROP TABLE IF EXISTS tkjt_picket_reports;
DROP TABLE IF EXISTS tkjt_inventory;
