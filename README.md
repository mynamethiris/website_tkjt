# Website Jurusan TKJT
Repositori kode sumber website jurusan TKJT SMK Ananda Mitra Industri Deltamas. Platform web full-stack dengan React, Express.js, dan Supabase.

---

## 1. PENDAHULUAN

### Deskripsi Proyek
Website Jurusan TKJT (Teknik Komputer Jaringan dan Telekomunikasi) adalah platform web full-stack modern yang mendukung operasional dan manajemen data di jurusan TKJT. Menggabungkan frontend React SPA dengan backend Express.js dan database cloud Supabase.

### Tujuan Utama
- **Mengelola Data Murid**: Profil dan foto siswa dari data statis
- **Menampilkan Galeri Kegiatan**: Dokumentasi visual kegiatan jurusan
- **Sistem Manajemen Piket**: Jadwal, absensi GPS, laporan, dan rotasi ketua piket otomatis
- **Inventaris Laboratorium**: Pencatatan dan pelacakan pinjaman peralatan
- **Portal Informasi**: Profil jurusan, kurikulum, FAQ, kontak, dan kontributor

### Target Pengguna

#### Tamu (Guest)
- Melihat beranda, profil jurusan, dan galeri

#### Ketua Piket (Piket)
- Login via kredensial (username + PIN 8 digit)
- Akses jadwal piket, absensi GPS, laporan piket, inventaris lab

#### Guru Produktif (Admin)
- Login via akun dari environment variables
- Kelola akun piket, kelompok piket, dan monitor laporan

---

## 2. PANDUAN INSTALASI

### Prasyarat
- **Node.js** versi 18.0 atau lebih tinggi
- **npm** package manager
- **Git** untuk version control
- **Supabase** account (opsional untuk database cloud)

### Langkah Instalasi

1. **Clone Repository**
   - `git clone <repository-url>`
   - `cd web_jurusan`

2. **Install Dependensi**
   - Jalankan `npm install`
   - Dependensi tercantum di `package.json`

3. **Konfigurasi Environment**
   - Buat file `.env` dari `.env.example`
   - Isi variabel yang diperlukan (lihat bagian Konfigurasi)

4. **Jalankan Development Server**
   - `npm run dev`
   - Server berjalan di `http://localhost:3000`

5. **Build untuk Production**
   - `npm run build` untuk build aset frontend
   - `npm start` untuk menjalankan production server

6. **Deploy ke Vercel (Opsional)**
   - Hubungkan repository ke Vercel
   - Vercel akan otomatis mendeteksi Vite project
   - Set environment variables di dashboard Vercel (sama seperti `.env`)
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`

> **Catatan**: Untuk detail konfigurasi database Supabase, lihat bagian Konfigurasi di bawah.

---

## 3. KONFIGURASI

### File `.env`
Buat file `.env` di root direktori dengan isi sebagai berikut (lihat `.env.example` sebagai template):

| Variabel | Deskripsi | Default |
|----------|-----------|---------|
| `SUPABASE_URL` | URL project Supabase | - |
| `SUPABASE_KEY` | Anon key Supabase | - |
| `ADMIN_USER` | Username admin | guru |
| `ADMIN_PASS` | Password admin | tkjt |
| `GUEST_USER` | Username tamu | tamu |
| `GUEST_PASS` | Password tamu | tkjt |

### Penting: Keamanan `.env`
- **JANGAN PERNAH** commit file `.env` ke Git repository
- File sudah tercantum di `.gitignore`
- Setiap developer harus membuat `.env` lokal sendiri
- Untuk deployment, gunakan environment variables melalui dashboard hosting
- Kredensial admin/guest hanya diakses server-side via `/api/auth/login`, tidak di-embed ke bundle klien

### Konfigurasi Database Supabase (Opsional)
Aplikasi dapat berjalan tanpa Supabase menggunakan database lokal JSON (`database.json`). Untuk sinkronisasi data cloud:
1. Buka Supabase SQL Editor
2. Jalankan script dari `sql/supabase.sql`

> **Catatan**: Data siswa dan guru bersifat read-only dari file JSON, tidak disimpan di Supabase.

---

## 4. STRUKTUR PROYEK

```
web_jurusan/
├── server.ts                    # Server Express + Vite middleware + API
├── package.json                 # Dependensi & scripts
├── vite.config.ts               # Konfigurasi Vite build
├── index.html                   # Entry HTML
├── sql/
│   ├── supabase.sql             # Script setup database Supabase
│   └── drop_supabase.sql        # Script reset/hapus tabel
├── data/
│   ├── students.json            # Data siswa (read-only)
│   ├── teachers.json            # Data guru (read-only)
│   └── content.json             # Konten spesialisasi, kontak, FAQ
└── src/
    ├── main.tsx                 # Entry point React
    ├── app.tsx                  # Root komponen, autentikasi, routing
    ├── types.ts                 # Definisi TypeScript interface
    ├── server/
    │   ├── secure_db.ts         # Database lokal JSON + audit log
    │   └── supabase.ts          # Inisialisasi client Supabase
    └── components/
        ├── pages/               # Komponen halaman
        │   ├── beranda.tsx
        │   ├── profil_jurusan.tsx
        │   ├── galeri.tsx
        │   ├── laporan_piket.tsx
        │   ├── inventaris_lab.tsx
        │   ├── admin.tsx
        │   └── kontributor.tsx
        └── features/            # Komponen UI reusable
            ├── header.tsx
            ├── footer.tsx
            ├── modal.tsx
            ├── button.tsx
            ├── card.tsx
            ├── dropdown.tsx
            ├── toast_notification.tsx
            └── lazy_image.tsx
```

---

## 5. ARSITEKTUR SISTEM

### Komponen Utama
- **Frontend**: React 19 SPA dengan Vite, routing via state `activeTab`
- **Backend**: Express.js server (Vite middleware untuk dev, static file server untuk prod)
- **Database**: Dual-mode — database lokal JSON (`database.json`) + sinkronisasi cloud ke Supabase
- **Data Siswa**: Read-only dari `data/students.json`, di-load oleh server

### API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/supabase-status` | Status koneksi Supabase |
| `GET` | `/api/data` | Ambil data siswa & galeri |
| `POST` | `/api/data` | Simpan data galeri (sinkron ke Supabase) |
| `GET` | `/api/picket` | Ambil data kelompok, akun, & laporan piket |
| `POST` | `/api/picket` | Simpan data piket (sinkron ke Supabase) |
| `GET` | `/api/inventory` | Ambil data inventaris |
| `POST` | `/api/inventory` | Simpan data inventaris (sinkron ke Supabase) |

> **Implementasi**: Lihat `server.ts` untuk detail endpoint dan handler.

### Mekanisme Sinkronisasi
Server melakukan sinkronisasi dua arah antara database lokal JSON dan Supabase:
- **Startup sync**: Saat server dimuat, data lokal di-upsert ke Supabase
- **Runtime sync**: Setiap POST endpoint melakukan sync secara dua arah
- **Client polling**: Klien melakukan polling `/api/data` setiap 5 detik untuk sinkronisasi real-time

> **Implementasi**: Lihat `server.ts` (bagian startup & runtime sync) dan `src/app.tsx` (bagian polling).

### Data Storage

| Data | Storage | Editable |
|------|---------|----------|
| Siswa | `data/students.json` (server-side) | Read-only |
| Guru | `data/teachers.json` (client-side import) | Read-only |
| Konten | `data/content.json` (client-side import) | Read-only |
| Galeri | `database.json` + Supabase `tkjt_gallery` | Ya (admin) |
| Kelompok Piket | `database.json` + Supabase `tkjt_picket_groups` | Ya (admin) |
| Akun Piket | `database.json` + Supabase `tkjt_picket_accounts` | Ya (admin) |
| Laporan Piket | `database.json` + Supabase `tkjt_picket_reports` | Ya (ketua piket + admin) |
| Inventaris | `database.json` + Supabase `tkjt_inventory` | Ya (ketua piket + admin) |

---

## 6. AUTENTIKASI & ROLE

### Tiga Level Peran

| Role | Login | Akses |
|------|-------|-------|
| **Admin** | Username & password dari `.env` | Semua halaman + Panel Admin |
| **Piket** | Username otomatis + PIN 8 digit | Jadwal piket, laporan, inventaris |
| **Tamu** | Username & password dari `.env` | Beranda, profil jurusan, galeri |

### Flow Login
1. Klik tombol "Login Guru / Piket" di header
2. Modal login muncul dengan form username + password
3. Sistem memvalidasi terhadap tiga sumber kredensial:
   - `ADMIN_USER` / `ADMIN_PASS` → role `admin` (server-side via `/api/auth/login`)
   - `GUEST_USER` / `GUEST_PASS` → role `tamu` (server-side via `/api/auth/login`)
   - Akun dari `picketAccounts` (username + PIN 8 digit) → role `piket` (client-side)
4. Jika valid, session disimpan di `localStorage`
5. UI berubah menampilkan menu yang sesuai peran

> **Implementasi**: Lihat `src/app.tsx` untuk flow autentikasi.

### Akses Halaman per Role

| Halaman | Tamu | Piket | Admin |
|---------|------|-------|-------|
| Beranda | Ya | Ya | Ya |
| Profil Jurusan | Ya | Ya | Ya |
| Galeri | Ya | Ya | Ya |
| Laporan Piket | Login required | Ya | Ya |
| Inventaris Lab | Login required | Ya | Ya |
| Panel Admin | Login required | Login required | Ya |

---

## 7. FITUR APLIKASI

### Fitur per Halaman

#### Beranda (`src/components/pages/beranda.tsx`)
- Hero Section dengan banner animasi ketik "Merajut Jaringan Menyatukan Peradaban"
- Spesialisasi Jurusan: Software Engineering (SE) dan Network Engineering (NE)
- Diagnostic Quiz tautan ke Google Forms
- Kontak dengan kartu informasi alamat, Instagram, dan email
- FAQ dengan accordion interaktif

#### Profil Jurusan (`src/components/pages/profil_jurusan.tsx`)
- Profil Guru: Carousel slide foto dan nama guru/pimpinan jurusan
- Daftar Murid: Grid kartu siswa dengan filter angkatan dan kelas

#### Galeri (`src/components/pages/galeri.tsx`)
- Video Profil: Embed YouTube video dokumentasi jurusan
- Grid Galeri: Tampilan responsif dengan infinite scroll (6 item per load)
- Image Preview: Klik foto untuk melihat full-size dalam modal
- CRUD Galeri (Admin): Tambah, edit, hapus foto via input URL gambar

#### Laporan Piket (`src/components/pages/laporan_piket.tsx`)
- Jadwal Piket: Tabel jadwal pekanan dengan filter Minggu 1/Minggu 2
- Absensi Pagi (GPS): Check-in via Geolocation, radius 500m, jam operasional 05:30-07:30 WIB
- Laporan Sore: Form dengan PIN otorisasi, upload foto, input anggota tidak hadir
- Riwayat Laporan: Daftar laporan yang bisa di-edit/dihapus (admin: tanpa batas, piket: 3 jam)
- Manajemen Kelompok & Akun: Inline editing (admin only)

#### Inventaris Lab (`src/components/pages/inventaris_lab.tsx`)
- Daftar Inventaris: Kartu dengan status "Dipinjam" atau "Kembali"
- Pencatatan Peminjaman: Form dengan pilihan peminjam dari daftar siswa atau input manual
- Toggle Status: Tandai barang dikembalikan atau dipinjam kembali
- Edit Inline: Edit langsung di kartu tanpa modal
- SOP Peminjaman: Setiap transaksi wajib dicatat dengan identitas peminjam dan durasi

#### Admin (`src/components/pages/admin.tsx`)
- Kelola Akun Piket: CRUD akun kredensial dengan username otomatis dan PIN 8 digit
- Kelompok Piket: Buat dan kelola kelompok per hari, per kelas, per angkatan
- Rotasi Ketua Piket: Sistem rotasi otomatis setiap 2 minggu dengan history tracking

#### Kontributor (`src/components/pages/kontributor.tsx`)
- Akses: Tekan dan tahan logo TKJT di header selama 3 detik (easter egg)
- Tim Developer: Daftar nama pengembang website

### Fitur UI/UX

| Fitur | Deskripsi | Lokasi |
|-------|-----------|--------|
| **Dark Mode** | Toggle mode terang/gelap di header, tersimpan di `localStorage` | `header.tsx` |
| **Responsive Design** | Tampilan adaptif desktop dan mobile dengan menu collapsible | Semua komponen |
| **Easter Egg** | Tekan tahan logo TKJT 3 detik untuk halaman Kontributor | `header.tsx` |
| **Infinite Scroll** | Galeri dimuat bertahap (6 item per batch) via Intersection Observer | `galeri.tsx` |
| **Lazy Loading Gambar** | Semua gambar menggunakan komponen `LazyImage` dengan skeleton loading | `lazy_image.tsx` |
| **Smooth Page Transitions** | Animasi transisi antar halaman menggunakan Framer Motion | `app.tsx` |
| **Polling Real-time** | Data di-polling setiap 5 detik untuk sinkronisasi antar device/tab | `app.tsx` |

---

## 8. USER JOURNEY

### Flow Pengguna Tamu
1. Buka `http://localhost:3000`
2. Lihat beranda dengan spesialisasi jurusan, FAQ, dan kontak
3. Login sebagai tamu untuk mengakses lebih banyak halaman
4. Navigasi ke **Profil Jurusan** untuk melihat daftar guru dan siswa
5. Navigasi ke **Galeri** untuk melihat dokumentasi kegiatan

### Flow Ketua Piket
1. Login menggunakan kredensial piket (username + PIN 8 digit)
2. Akses **Laporan Piket** → tab Jadwal untuk melihat jadwal bertugas
3. Pada hari bertugas, buka **Laporan Piket** → tab Laporan
4. Klik **Absensi Pagi** → izinkan akses GPS → sistem memverifikasi lokasi
5. Setelah jam kerja selesai, kirim **Laporan Sore** dengan mengisi deskripsi, foto, dan anggota tidak hadir
6. Akses **Inventaris Lab** untuk mencatat peminjaman/pengembalian alat

### Flow Admin/Guru
1. Login sebagai admin (kredensial dari `.env`)
2. Akses **Panel Admin** untuk mengelola:
   - **Tab Kredensial**: Buat akun piket baru dengan PIN acak, tentukan ketua piket
   - **Tab Kelompok**: Buat kelompok piket per hari, pilih anggota dari daftar siswa
3. Monitor laporan piket dari semua kelompok di halaman **Laporan Piket**
4. Edit atau hapus laporan jika diperlukan

---

## 9. TECH STACK

### Frontend
- **React 19.0.1**: Library UI dengan functional components & hooks
- **Vite 6.2.3**: Build tool dan dev server
- **TailwindCSS 4.1.14**: Utility CSS framework
- **Motion/Framer Motion ^12.23.24**: Library animasi (page transitions, scroll reveal)
- **Lucide React ^0.546.0**: Icon library

### Backend
- **Express 4.21.2**: Framework Node.js untuk API server
- **TypeScript ~5.8.2**: Type safety
- **tsx ^4.21.0**: TypeScript execution untuk development server
- **esbuild ^0.25.0**: Bundling server untuk production

### Database
- **Supabase**: PostgreSQL managed database (opsional)
- **SecureDatabase** (`src/server/secure_db.ts`): Database lokal JSON-backed dengan audit logging

### Build Pipeline
- **Vite Build**: Optimasi aset frontend ke `dist/`
- **esbuild**: Bundling `server.ts` ke `dist/server.cjs` (CJS format, external packages)

---

## 10. KEAMANAN

- **Autentikasi Tiga Level**: Admin, Piket, dan Tamu dengan kredensial terpisah
- **PIN Otorisasi**: Laporan piket sore memerlukan PIN 8 digit ketua piket yang aktif
- **GPS Geolocation Verification**: Absensi pagi diverifikasi terhadap koordinat sekolah (radius 500m)
- **Environment Variables**: Kredensial disimpan di `.env`, tidak di-hardcode di source code
- **Image Protection**: Klik kanan dan drag-and-drop pada gambar dinonaktifkan di klien
- **Row Level Security (RLS)**: Supabase RLS diaktifkan pada semua tabel
- **Audit Logging**: Log sistem pada database lokal untuk inisialisasi dan query

> **Implementasi**: Lihat `src/app.tsx` (image protection), `server.ts` (autentikasi), `src/server/secure_db.ts` (audit logging).

> **Catatan keamanan**: Autentikasi admin/guest dilakukan server-side via `/api/auth/login`. Kredensial tidak di-embed ke bundle klien. RLS Supabase saat ini mengizinkan akses penuh (`USING (true) WITH CHECK (true)`). Untuk produksi, pertimbangkan implementasi autentikasi yang lebih robust.

---

## 11. TROUBLESHOOTING

### Port Conflict
Port 3000 di-hardcode di `server.ts`. Untuk mengubahnya, edit variabel `PORT` di file tersebut.

### Supabase Connection Error
- Pastikan `SUPABASE_URL` dan `SUPABASE_KEY` valid di file `.env`
- Aplikasi tetap berjalan tanpa Supabase menggunakan database lokal JSON

### Database Setup Issues
- Pastikan Anda punya akses admin di Supabase
- Jalankan `sql/supabase.sql` untuk membuat tabel
- Jalankan `sql/drop_supabase.sql` untuk mereset semua tabel
- Lihat error message di Supabase SQL Editor
