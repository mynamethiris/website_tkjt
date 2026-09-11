import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Klien Supabase khusus server. Memakai service role key kalau ada supaya
// operasi tulis lolos RLS. Browser tidak pernah memanggil Supabase langsung,
// semuanya lewat /api/*).
//
// SEMUA variabel di sini bernama SUPABASE_* (tanpa prefix VITE_) agar Vite
// tidak mengekspornya ke bundle browser. Jika pakai VITE_SUPABASE_*, maka semua
// key (termasuk publishable) akan bocor ke klien.
//
// Publishable key (SUPABASE_PUBLISHABLE_KEY) dipakai sebagai fallback
// baca-saja untuk pengembangan lokal tanpa service role key. Operasi tulis
// akan ditolak RLS dalam mode ini.

let _client: SupabaseClient | null | undefined = undefined;

function env(...names: string[]): string {
  for (const n of names) {
    const v = (process.env[n] || '').trim();
    if (v) return v;
  }
  return '';
}

export function getSupabase(): SupabaseClient | null {
  if (_client !== undefined) return _client;

  const url = env('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const key = env(
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
  );

  _client =
    url && key && !url.includes('dummy')
      ? createClient(url, key, { auth: { persistSession: false } })
      : null;
  return _client;
}

/** True kalau server memakai service role key (operasi tulis akan lolos RLS). */
export function hasServiceRole(): boolean {
  return Boolean(env('SUPABASE_SERVICE_ROLE_KEY'));
}

/** True kalau URL Supabase diset (dipakai endpoint status). */
export function supabaseConfigured(): boolean {
  return Boolean(env('SUPABASE_URL'));
}
