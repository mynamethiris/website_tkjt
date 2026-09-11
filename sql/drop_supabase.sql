-- Reset total skema Supabase Website TKJT.
--
-- PERINGATAN: skrip ini MENGHAPUS TABEL BESERTA SELURUH DATANYA.
-- Tidak bisa dibatalkan. Pastikan sudah punya backup kalau datanya masih perlu.
-- Setelah ini, jalankan sql/supabase.sql untuk membuat ulang skema.
--
-- Aman diulang: semua perintah memakai IF EXISTS.

-- 1. Hapus semua policy di tabel tkjt_ (nama apa pun, termasuk "Public Access"
--    dari versi lama serta anon_read / service_write dari versi sekarang).
--    Dilakukan lewat loop supaya tidak perlu tahu nama policy-nya lebih dulu.
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

-- 2. Hapus tabel. DROP TABLE otomatis membuang RLS dan policy yang tersisa,
--    jadi tidak perlu DISABLE ROW LEVEL SECURITY lebih dulu.
DROP TABLE IF EXISTS tkjt_gallery;
DROP TABLE IF EXISTS tkjt_picket_groups;
DROP TABLE IF EXISTS tkjt_picket_accounts;
DROP TABLE IF EXISTS tkjt_picket_reports;
DROP TABLE IF EXISTS tkjt_inventory;
DROP TABLE IF EXISTS tkjt_absensi;
DROP TABLE IF EXISTS tkjt_bengkel_logs;
DROP TABLE IF EXISTS tkjt_materi;
DROP TABLE IF EXISTS tkjt_pencapaian;

-- 3. Verifikasi: kedua query di bawah harus mengembalikan 0 baris.
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'tkjt_%';

SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'tkjt_%';
