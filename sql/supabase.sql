-- Buat semua tabel utama
CREATE TABLE tkjt_gallery (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  photo TEXT NOT NULL
);

CREATE TABLE tkjt_picket_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  members TEXT[] NOT NULL,
  day TEXT NOT NULL,
  tkjt TEXT,
  angkatan INT,
  "weekType" TEXT
);

CREATE TABLE tkjt_picket_accounts (
  id TEXT PRIMARY KEY,
  "groupName" TEXT NOT NULL,
  day TEXT NOT NULL,
  username TEXT NOT NULL,
  pin TEXT NOT NULL,
  "ketuaPiket" TEXT NOT NULL,
  "leaderAssignedAt" BIGINT,
  "leaderHistory" TEXT[]
);

CREATE TABLE tkjt_picket_reports (
  id TEXT PRIMARY KEY,
  "groupName" TEXT NOT NULL,
  "absentMembers" TEXT[] NOT NULL,
  reporter TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT,
  "cleanedRooms" TEXT,
  photos TEXT[],
  "arrivalTime" TEXT,
  "departureTime" TEXT,
  "createdAt" BIGINT
);

CREATE TABLE tkjt_inventory (
  id TEXT PRIMARY KEY,
  "itemName" TEXT NOT NULL,
  description TEXT NOT NULL,
  "rentTime" TEXT NOT NULL,
  "returnTime" TEXT NOT NULL,
  "borrowerName" TEXT NOT NULL,
  status TEXT NOT NULL
);

-- Aktifkan Row Level Security (RLS) untuk keamanan akses publik
ALTER TABLE tkjt_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE tkjt_picket_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tkjt_picket_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tkjt_picket_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tkjt_inventory ENABLE ROW LEVEL SECURITY;

-- Buat satu kebijakan umum untuk mengizinkan operasi baca/tulis/ubah bebas
CREATE POLICY "Public Access" ON tkjt_gallery FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON tkjt_picket_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON tkjt_picket_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON tkjt_picket_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON tkjt_inventory FOR ALL USING (true) WITH CHECK (true);
