-- Skema Supabase untuk Website TKJT.
-- Jalankan di Supabase SQL Editor. Aman diulang: tabel dan policy dibuat
-- dengan IF NOT EXISTS / DROP IF EXISTS, jadi tidak error kalau sudah ada.
-- Untuk mulai dari nol, jalankan sql/drop_supabase.sql lebih dulu.

-- ============================================================
-- 1. TABEL
-- ============================================================

CREATE TABLE IF NOT EXISTS tkjt_gallery (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  photo TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tkjt_picket_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  members TEXT[] NOT NULL,
  day TEXT NOT NULL,
  tkjt TEXT,
  angkatan INT,
  "weekType" TEXT
);

CREATE TABLE IF NOT EXISTS tkjt_picket_accounts (
  id TEXT PRIMARY KEY,
  "groupName" TEXT NOT NULL,
  day TEXT NOT NULL,
  username TEXT NOT NULL,
  -- Hash scrypt, bukan PIN mentah. Format: scrypt$<salt_hex>$<hash_hex>
  -- Panjangnya sekitar 97 karakter, jauh lebih dari 8 digit PIN lama.
  pin TEXT NOT NULL,
  "ketuaPiket" TEXT NOT NULL,
  "leaderAssignedAt" BIGINT,
  "leaderHistory" TEXT[]
);

CREATE TABLE IF NOT EXISTS tkjt_picket_reports (
  id TEXT PRIMARY KEY,
  "groupName" TEXT NOT NULL,
  "absentMembers" TEXT[] NOT NULL,
  reporter TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT,
  "cleanedRooms" TEXT,
  "cleanlinessStatus" TEXT,
  "itemCondition" TEXT,
  "itemConditionNotes" TEXT,
  photos TEXT[],
  "arrivalTime" TEXT,
  "departureTime" TEXT,
  "createdAt" BIGINT
);

CREATE TABLE IF NOT EXISTS tkjt_inventory (
  id TEXT PRIMARY KEY,
  "itemName" TEXT NOT NULL,
  description TEXT NOT NULL,
  "rentTime" TEXT NOT NULL,
  "returnTime" TEXT NOT NULL,
  "borrowerName" TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tkjt_bengkel_logs (
  id TEXT PRIMARY KEY,
  "itemId" TEXT,
  "itemName" TEXT NOT NULL,
  "checkInTime" TEXT,
  "checkOutTime" TEXT,
  "statusBefore" TEXT,
  "statusAfter" TEXT,
  "conditionNotes" TEXT,
  "damageReported" TEXT,
  "reporterName" TEXT,
  "reportDate" TEXT,
  "createdAt" BIGINT
);

CREATE TABLE IF NOT EXISTS tkjt_absensi (
  id TEXT PRIMARY KEY,
  "studentName" TEXT NOT NULL,
  "studentId" BIGINT,
  kelas TEXT NOT NULL,
  angkatan INT,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  "createdAt" BIGINT
);

CREATE TABLE IF NOT EXISTS tkjt_pencapaian (
  id TEXT PRIMARY KEY,
  "studentName" TEXT NOT NULL,
  "studentId" BIGINT,
  kelas TEXT NOT NULL,
  angkatan INT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT,
  date TEXT NOT NULL,
  "progressValue" INT,
  "progressMax" INT,
  "createdAt" BIGINT
);

-- Kolom yang ditambahkan belakangan (aman diulang: IF NOT EXISTS).
-- Diperlukan karena tabel bisa sudah dibuat oleh versi lama skrip ini.
ALTER TABLE tkjt_bengkel_logs ADD COLUMN IF NOT EXISTS "checkOutTime" TEXT;
ALTER TABLE tkjt_bengkel_logs ADD COLUMN IF NOT EXISTS "statusAfter" TEXT;
ALTER TABLE tkjt_bengkel_logs ADD COLUMN IF NOT EXISTS "reporterName" TEXT;

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE tkjt_gallery        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tkjt_picket_groups  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tkjt_picket_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tkjt_picket_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tkjt_inventory      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tkjt_bengkel_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tkjt_absensi        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tkjt_pencapaian     ENABLE ROW LEVEL SECURITY;

-- Prinsip kebijakan:
--   anon (publishable key, dipakai browser)  -> hanya SELECT tabel publik
--   service_role (server: api/ dan server.ts) -> boleh semua operasi
--
-- tkjt_picket_accounts SENGAJA tidak punya policy untuk anon karena berisi
-- hash PIN. Klien mengambil daftar akun lewat GET /api/picket, yang membuang
-- field pin di server sebelum dikirim.
--
-- service_role memang melewati RLS secara bawaan, tetapi policy-nya ditulis
-- eksplisit supaya niatnya terbaca dan tidak ada tabel tanpa policy.

-- Bersihkan policy lama (termasuk nama dari versi sebelumnya) supaya skrip
-- ini bisa dijalankan ulang tanpa error "policy already exists".
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public' AND tablename LIKE 'tkjt_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

-- Baca publik
CREATE POLICY "anon_read" ON tkjt_gallery        FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_read" ON tkjt_picket_groups  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_read" ON tkjt_picket_reports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_read" ON tkjt_inventory      FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_read" ON tkjt_bengkel_logs   FOR SELECT TO anon, authenticated USING (true);

-- Tulis hanya lewat server
CREATE POLICY "service_write" ON tkjt_gallery        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_write" ON tkjt_picket_groups  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_write" ON tkjt_picket_accounts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_write" ON tkjt_picket_reports FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_write" ON tkjt_inventory      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_write" ON tkjt_bengkel_logs   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_read" ON tkjt_absensi        FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "service_write" ON tkjt_absensi        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_read" ON tkjt_pencapaian     FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "service_write" ON tkjt_pencapaian     FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 3. VERIFIKASI
-- ============================================================
-- Harapan: setiap tabel punya service_write; semua kecuali
-- tkjt_picket_accounts juga punya anon_read.

SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'tkjt_%'
ORDER BY tablename, policyname;

-- Harapan: rowsecurity = true untuk kedelapan tabel.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'tkjt_%'
ORDER BY tablename;
