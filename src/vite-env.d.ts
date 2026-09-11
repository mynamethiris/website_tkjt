/// <reference types="vite/client" />

// Proyek ini TIDAK memakai import.meta.env di kode klien. Supabase hanya
// diakses dari server (src/server/supabase.ts) lewat process.env, dan browser
// bicara ke /api/*. Jadi tidak ada variabel VITE_ yang perlu dideklarasikan di
// sini. Kalau nanti ada nilai yang memang harus dibaca browser, tambahkan ke
// ImportMetaEnv di bawah, dan ingat: apa pun berprefix VITE_ ikut masuk ke
// bundle publik.

interface ImportMetaEnv {
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
