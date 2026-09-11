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
- **Absensi & Bengkel**: Pencatatan kehadiran siswa dan penggunaan perangkat bengkel
- **Materi & Pencapaian**: Platform pembelajaran dan portfolio pencapaian siswa TKJT
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
   - Build command: `npm run vercel-build`
   - Output directory: `dist`
   - Install command: `npm install`

    > **Catatan**: Semua variabel dibaca server dan tidak ada yang masuk ke bundle browser (tidak ada variabel berprefix `VITE_*` di proyek ini). Set seluruh variabel dari `.env` di dashboard Vercel sebagai environment variables.

> **Catatan**: Untuk detail konfigurasi database Supabase, lihat bagian Konfigurasi di bawah.

---

## 3. KONFIGURASI

### File `.env`
Buat file `.env` di root direktori dengan isi sebagai berikut (lihat `.env.example` sebagai template):

**Wajib**

| Variabel | Deskripsi | Default |
|----------|-----------|---------|
| `AUTH_SECRET` | Kunci HMAC penanda tangan token sesi, minimal 16 karakter. Tanpa ini login dan semua endpoint tulis balas 503. | - |
| `ADMIN_USER` | Username admin | - |
| `ADMIN_PASS` | Password admin | - |
| `GUEST_USER` | Username tamu | - |
| `GUEST_PASS` | Password tamu | - |

**Supabase** (opsional saat lokal, wajib saat deploy ke Vercel)

| Variabel | Deskripsi | Default |
|----------|-----------|---------|
| `SUPABASE_URL` | URL project Supabase | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key. Wajib untuk operasi tulis, karena RLS hanya mengizinkan tulis lewat peran ini | - |
| `SUPABASE_PUBLISHABLE_KEY` | Anon key. Opsional, hanya fallback baca-saja kalau service role key belum diisi | - |

**Opsional**

| Variabel | Deskripsi | Default |
|----------|-----------|---------|
| `AUTH_RATE_MAX` | Maksimum percobaan login per jendela waktu | 5 |
| `AUTH_RATE_WINDOW_MS` | Panjang jendela rate limit dalam milidetik | 60000 |

Nama lama `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` masih dibaca supaya `.env` lama tetap jalan, tetapi pakailah nama tanpa prefix `VITE_`.

### Penting: Keamanan `.env`
- **JANGAN PERNAH** commit file `.env` ke Git repository
- File sudah tercantum di `.gitignore`
- Setiap developer harus membuat `.env` lokal sendiri
- Untuk deployment, gunakan environment variables melalui dashboard hosting
- Semua variabel di atas dibaca server, tidak ada yang masuk ke bundle browser. Browser tidak pernah memanggil Supabase langsung, semuanya lewat `/api/*`
- Jangan memberi prefix `VITE_` pada variabel baru yang bersifat rahasia. Vite memasukkan setiap variabel berprefix `VITE_` ke bundle browser, jadi nilainya akan terbaca publik

### Konfigurasi Database Supabase (Opsional)
Aplikasi dapat berjalan tanpa Supabase menggunakan database lokal JSON (`database.json`). Untuk sinkronisasi data cloud:
1. Buka Supabase SQL Editor
2. Jalankan script dari `sql/supabase.sql`
3. Isi `SUPABASE_SERVICE_ROLE_KEY` di `.env` atau di dashboard hosting

`sql/supabase.sql` aman dijalankan ulang: tabel dibuat dengan `IF NOT EXISTS` dan policy lama dibersihkan lebih dulu. Untuk mulai dari nol, jalankan `sql/drop_supabase.sql` (menghapus tabel beserta datanya) lalu `sql/supabase.sql`.

> **Catatan**: Data siswa dan guru bersifat read-only dari file JSON, tidak disimpan di Supabase.

### Verifikasi sebelum publish
```bash
npm install              # package-lock.json di-gitignore, jadi pakai install bukan ci
npm run lint             # tsc --noEmit
npm run check            # tsc --noEmit + self-check hash PIN + self-check token sesi
npm run build            # vite build + bundle server
npm audit --omit=dev     # kerentanan dependensi produksi
```

`npm run check` menjalankan `tsc --noEmit`, self-check hash PIN (`scripts/check_pin.ts`), dan self-check token sesi HMAC (`scripts/check_api_handlers.ts`). Semuanya berjalan tanpa server dan tanpa menyentuh Supabase.

---

## 4. STRUKTUR PROYEK

```
web_jurusan/
├── server.ts                    # Server Express + Vite middleware + API
├── vercel.json                  # Konfigurasi deploy Vercel
├── package.json                 # Dependensi & scripts
├── vite.config.ts               # Konfigurasi Vite build
├── index.html                   # Entry HTML
├── .env.example                 # Template environment variables
├── api/                         # Vercel serverless functions (mirror endpoint server.ts)
│   ├── auth/login.ts            # Endpoint autentikasi admin/tamu
│   ├── auth/picket.ts           # Endpoint login & verifikasi PIN piket
│   ├── data.ts                  # Endpoint data galeri & siswa
│   ├── picket.ts                # Endpoint data piket
│   ├── inventory.ts             # Endpoint data inventaris
│   ├── absensi.ts               # Endpoint data absensi
│   ├── bengkel.ts               # Endpoint data log bengkel
│   ├── materi.ts                # Endpoint data materi
│   └── pencapaian.ts            # Endpoint data pencapaian
├── scripts/                     # Self-check pra-publish (tanpa server/Supabase)
│   ├── check_pin.ts             # Self-check hash & verifikasi PIN scrypt
│   └── check_api_handlers.ts    # Self-check token sesi HMAC
├── sql/
│   ├── supabase.sql             # Script setup database Supabase (9 tabel + RLS)
│   └── drop_supabase.sql        # Script reset/hapus tabel
├── data/
│   ├── students.json            # Data siswa (read-only, disajikan via /api/data)
│   ├── teachers.json            # Data guru (read-only, import statis di profil)
│   └── content.json             # Konten spesialisasi, kontak, FAQ
└── src/
    ├── main.tsx                 # Entry point React
    ├── app.tsx                  # Root komponen, autentikasi, routing
    ├── types.ts                 # Definisi TypeScript interface
    ├── utils.ts                 # deepEqual, format tanggal, mapping angkatan
    ├── auth_client.ts           # Simpan token sesi + header Authorization
    ├── server/
    │   ├── secure_db.ts         # Database lokal JSON + audit log
    │   ├── supabase.ts          # Client Supabase (server, service role)
    │   ├── auth_token.ts        # Terbitkan/verifikasi token HMAC
    │   └── picket_store.ts      # Hash PIN piket, sembunyikan dari klien
    └── components/
        ├── pages/               # Komponen halaman
        │   ├── beranda.tsx
        │   ├── profil_jurusan.tsx
        │   ├── galeri.tsx
        │   ├── laporan_piket.tsx
        │   ├── inventaris_lab.tsx
        │   ├── absensi_tkjt.tsx
        │   ├── bengkel.tsx
        │   ├── materi.tsx
        │   ├── pencapaian.tsx
        │   ├── admin.tsx
        │   └── kontributor.tsx
        └── features/            # Komponen UI reusable
            ├── header.tsx
            ├── footer.tsx
            ├── modal.tsx
            ├── button.tsx
            ├── card.tsx
            ├── dropdown.tsx
            ├── date_picker.tsx
            ├── toast_notification.tsx
            └── lazy_image.tsx
```

---

## 5. ARSITEKTUR SISTEM

### Komponen Utama
- **Frontend**: React 19 SPA dengan Vite, routing via state `activeTab`
- **Backend**: Express.js server (Vite middleware untuk dev, static file server untuk prod)
- **Vercel**: Serverless functions di `api/` + SPA static hosting
- **Database**: Dual-mode -- database lokal JSON (`database.json`) + sinkronisasi cloud ke Supabase
- **Data Siswa**: Read-only dari `data/students.json`, di-load oleh server

### API Endpoints

| Method | Endpoint | Deskripsi | Tulis oleh |
|--------|----------|-----------|------------|
| `GET` | `/api/supabase-status` | Status koneksi Supabase | Publik |
| `POST` | `/api/auth/login` | Login admin/tamu, balas token sesi | Publik (rate-limited) |
| `POST` | `/api/auth/picket` | Login akun piket / verifikasi PIN kelompok | Publik (rate-limited) |
| `GET` | `/api/data` | Ambil data siswa & galeri | Publik |
| `POST` | `/api/data` | Simpan data galeri (sinkron ke Supabase) | Admin |
| `GET` | `/api/picket` | Ambil data kelompok, akun (tanpa PIN), & laporan piket | Publik |
| `POST` | `/api/picket` | Simpan data piket (sinkron ke Supabase) | Admin + piket (kelompok/akun: admin saja) |
| `GET` | `/api/inventory` | Ambil data inventaris | Publik |
| `POST` | `/api/inventory` | Simpan data inventaris (sinkron ke Supabase) | Admin + piket |
| `GET` | `/api/absensi` | Ambil data absensi | Publik |
| `POST` | `/api/absensi` | Simpan data absensi (sinkron ke Supabase) | Admin + piket |
| `GET` | `/api/bengkel` | Ambil data log bengkel | Publik |
| `POST` | `/api/bengkel` | Simpan data log bengkel (sinkron ke Supabase) | Admin + piket |
| `GET` | `/api/materi` | Ambil data materi | Publik |
| `POST` | `/api/materi` | Simpan data materi (sinkron ke Supabase) | Admin |
| `GET` | `/api/pencapaian` | Ambil data pencapaian | Publik |
| `POST` | `/api/pencapaian` | Simpan data pencapaian (sinkron ke Supabase) | Admin |

> **Implementasi**: Endpoint yang sama tersedia di `server.ts` (mode dev/lokal) dan `api/` (serverless Vercel). Semua endpoint tulis menolak peran `tamu` dan membalas 503 kalau `AUTH_SECRET` belum diset.

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
| Absensi TKJT | `database.json` + Supabase `tkjt_absensi` | Ya (ketua piket + admin) |
| Bengkel Logs | `database.json` + Supabase `tkjt_bengkel_logs` | Ya (ketua piket + admin) |
| Materi TKJT | `database.json` + Supabase `tkjt_materi` | Ya (admin) |
| Pencapaian TKJT | `database.json` + Supabase `tkjt_pencapaian` | Ya (admin) |

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
   - Akun piket (username + PIN 8 digit) → role `piket` (server-side via `/api/auth/picket`)
4. Jika valid, token sesi dan info peran disimpan di `localStorage`
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
| Absensi TKJT | Login required | Ya | Ya |
| Bengkel | Login required | Ya | Ya |
| Materi TKJT | Ya | Ya | Ya |
| Pencapaian TKJT | Ya | Ya | Ya |
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
- Kelola Akun Piket: CRUD akun kredensial dengan username otomatis dan PIN 8 digit (PIN tersimpan sebagai hash, tak bisa dilihat ulang)
- Kelompok Piket: Buat dan kelola kelompok per hari, per kelas, per angkatan, per minggu
- Rotasi Ketua Piket: Sistem rotasi otomatis setiap 2 minggu dengan history tracking

#### Absensi TKJT (`src/components/pages/absensi_tkjt.tsx`)
- Pencatatan Kehadiran: Sistem absensi harian siswa TKJT dengan filter tanggal/kelas
- Export CSV: Ekspor data absensi ke format comma-separated CSV
- Import CSV: Import data absensi dari CSV yang di-paste
- CRUD Absensi: Tambah, edit, hapus catatan absensi (admin: semua, piket: hari ini saja)

#### Bengkel (`src/components/pages/bengkel.tsx`)
- Pencatatan Penggunaan: Log penggunaan perangkat bengkel untuk praktikum
- Check-in/Check-out: Sistem peminjaman dan pengembalian perangkat bengkel
- Integrasi Inventaris: Pilih barang langsung dari database inventaris lab
- Riwayat Penggunaan: Daftar log dengan status sedang dipinjam atau sudah dikembalikan

#### Materi TKJT (`src/components/pages/materi.tsx`)
- Katalog Materi: Daftar materi pembelajaran dengan filter kategori
- Tampilan Grid/List: Toggle antara tampilan grid kartu dan daftar
- Video Embed: Putar video YouTube langsung di modal
- CRUD Materi (Admin): Tambah, edit, hapus materi dengan tipe konten (HTML, PDF, Video, Tautan)

#### Pencapaian TKJT (`src/components/pages/pencapaian.tsx`)
- Portfolio Siswa: Daftar pencapaian siswa berupa sertifikasi, kompetensi, dan proyek
- Stats Dashboard: Ringkasan jumlah pencapaian per kategori dengan progress bars
- Filter: Filter pencapaian berdasarkan kategori
- CRUD Pencapaian (Admin): Tambah, edit, hapus pencapaian dengan progress tracking

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
- **@supabase/supabase-js**: Klien Supabase server-side (service role)
- **helmet / cors / dotenv**: Header keamanan, CORS, dan environment variables

### Database
- **Supabase**: PostgreSQL managed database (opsional)
- **SecureDatabase** (`src/server/secure_db.ts`): Database lokal JSON-backed dengan audit logging

### Build Pipeline
- **Vite Build**: Optimasi aset frontend ke `dist/`
- **esbuild**: Bundling `server.ts` ke `dist/server.cjs` (CJS format, external packages)

---

## 10. KEAMANAN

- **Autentikasi Tiga Level**: Admin, Piket, dan Tamu dengan kredensial terpisah
- **PIN Otorisasi**: Laporan piket sore memerlukan PIN 8 digit ketua piket yang aktif. PIN disimpan sebagai hash scrypt bersalt, tidak pernah dalam bentuk plaintext, dan tidak pernah dikirim ke klien
- **Token sesi HMAC**: Login menerbitkan token bertanda tangan (`AUTH_SECRET`, masa berlaku 12 jam). Semua endpoint tulis memverifikasinya dan menolak peran `tamu`
- **Rate limit login**: 5 percobaan per menit per IP untuk `/api/auth/login` dan `/api/auth/picket`
- **GPS Geolocation Verification**: Absensi pagi diverifikasi terhadap koordinat sekolah (radius 500m)
- **Environment Variables**: Kredensial disimpan di `.env`, tidak di-hardcode di source code
- **Image Protection**: Klik kanan dan drag-and-drop pada gambar dinonaktifkan di klien
- **Row Level Security (RLS)**: RLS aktif di semua tabel. Publishable key (anon) hanya boleh `SELECT` pada tabel publik, semua operasi tulis melalui `service_role` di server
- **Data siswa tidak di-bundle**: Daftar siswa diambil saat runtime lewat `GET /api/data`, tidak lagi di-import statis ke bundle klien
- **Audit Logging**: Log sistem pada database lokal untuk inisialisasi dan query

> **Implementasi**: Lihat `src/app.tsx` (image protection), `server.ts` (autentikasi), `src/server/secure_db.ts` (audit logging).

> **Catatan keamanan**: Autentikasi admin, tamu, dan piket dilakukan server-side (`/api/auth/login`, `/api/auth/picket`). Kredensial tidak di-embed ke bundle klien.
>
> Batas yang masih ada:
> - Rate limit dan token bersifat in-memory dan stateless. Pada beberapa instance serverless, hitungan percobaan tidak dibagi antar instance, dan logout hanya menghapus token di klien (tidak ada daftar revokasi).
> - `database.json` tidak dapat ditulis di filesystem serverless. Di Vercel, Supabase wajib dipakai sebagai penyimpanan; tanpanya endpoint tulis balas 500.
> - PIN 8 digit angka punya ruang kunci kecil. Hash scrypt dan rate limit memperlambat brute force, tetapi PIN yang lebih panjang akan lebih baik.

---

## 11. TROUBLESHOOTING

### Port Conflict
Port 3000 di-hardcode di `server.ts`. Untuk mengubahnya, edit variabel `PORT` di file tersebut.

### Supabase Connection Error
- Pastikan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` valid di file `.env`
- Aplikasi tetap berjalan tanpa Supabase menggunakan database lokal JSON

### Database Setup Issues
- Pastikan Anda punya akses admin di Supabase
- Jalankan `sql/supabase.sql` untuk membuat tabel
- Jalankan `sql/drop_supabase.sql` untuk mereset semua tabel. **Perhatian**: ini menghapus tabel beserta seluruh datanya dan tidak bisa dibatalkan
- Lihat error message di Supabase SQL Editor

### Login gagal atau semua endpoint tulis balas 503
`AUTH_SECRET` belum diset atau kurang dari 16 karakter. Isi di `.env` (lokal) dan di dashboard hosting (produksi).

### Endpoint tulis balas 500 "penyimpanan tidak tersedia" di Vercel
Filesystem serverless read-only, jadi `database.json` tidak bisa ditulis. Set `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` supaya data tersimpan di Supabase.

### PIN piket tidak bisa dilihat lagi di halaman Admin
Memang begitu. PIN kini tersimpan sebagai hash scrypt dan tidak dapat dibaca balik. Kalau lupa, buat PIN baru lewat Edit pada akun tersebut. Mengosongkan field PIN saat mengedit berarti PIN lama dipertahankan.
