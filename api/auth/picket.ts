// Login akun piket & verifikasi PIN — SELF-CONTAINED untuk Vercel ESM.
//
// Jangan import dari ../../src/* di file ini: runtime serverless mengeksekusi
// function sebagai ESM murni, sehingga import relatif tanpa ekstensi membuat
// function crash saat boot (FUNCTION_INVOCATION_FAILED). Hanya modul builtin
// (fs/path/crypto) yang boleh di-import statis. Helper lain diduplikasi dari
// src/server/* (sumber kebenaran tetap di sana untuk server Express lokal).
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ponytail: rate limit in-memory per instance warm. Cukup memperlambat brute force PIN 8 digit.
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now >= entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

function readEnv(...names: string[]): string {
  for (const n of names) {
    const v = (process.env[n] || '').trim();
    if (v) return v;
  }
  return '';
}

let _supa: any = undefined;
async function getSupabaseSafe(): Promise<any | null> {
  if (_supa !== undefined) return _supa;
  const url = readEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const key = readEnv(
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
  );
  if (!url || !key || url.includes('dummy')) {
    _supa = null;
    return _supa;
  }
  try {
    const mod: any = await import('@supabase/supabase-js');
    _supa = mod.createClient(url, key, { auth: { persistSession: false } });
  } catch (err) {
    console.error('Supabase client init failed, fallback ke lokal:', err);
    _supa = null;
  }
  return _supa;
}

// ---- Token sesi HMAC (duplikat src/server/auth_token.ts) ----
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function authSecret(): string {
  return (process.env.AUTH_SECRET || '').trim();
}

function authConfigured(): boolean {
  return authSecret().length >= 16;
}

function issueToken(session: { username: string; role: string; kelas?: string; angkatan?: number }): string {
  const body = { ...session, exp: Date.now() + TOKEN_TTL_MS };
  const payload = b64url(Buffer.from(JSON.stringify(body), 'utf8'));
  const sig = b64url(crypto.createHmac('sha256', authSecret()).update(payload).digest());
  return `${payload}.${sig}`;
}

// ---- PIN piket (duplikat src/server/picket_store.ts) ----
const SCRYPT_PREFIX = 'scrypt$';
const KEY_LEN = 32;

function isHashedPin(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(SCRYPT_PREFIX);
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function verifyPin(input: string, stored: unknown): boolean {
  if (typeof stored !== 'string' || !stored) return false;
  if (!isHashedPin(stored)) return timingSafeEqualStr(input, stored);

  const parts = stored.split('$');
  if (parts.length !== 3) return false;
  try {
    // Buffer.from(..., 'hex') membuang karakter non-hex tanpa melempar, jadi
    // hash rusak bisa menghasilkan buffer kosong. Dua buffer kosong lolos
    // timingSafeEqual, yang artinya PIN apa pun akan diterima. Tolak eksplisit.
    if (!/^[0-9a-f]+$/i.test(parts[1]) || !/^[0-9a-f]+$/i.test(parts[2])) return false;
    const salt = Buffer.from(parts[1], 'hex');
    const want = Buffer.from(parts[2], 'hex');
    if (salt.length === 0 || want.length !== KEY_LEN) return false;
    const got = crypto.scryptSync(input, salt, want.length);
    return got.length === want.length && crypto.timingSafeEqual(got, want);
  } catch {
    return false;
  }
}

async function loadAccountsWithPins(): Promise<any[]> {
  try {
    const supabase = await getSupabaseSafe();
    if (supabase) {
      const { data, error } = await supabase.from('tkjt_picket_accounts').select('*');
      if (!error && Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}
  try {
    const dbPath = path.join(process.cwd(), 'database.json');
    if (fs.existsSync(dbPath)) {
      const local = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      if (Array.isArray(local.picketAccounts)) return local.picketAccounts;
    }
  } catch {}
  return [];
}

function classFromGroupName(name: string): { kelas: string; angkatan: number } {
  let kelas = 'TKJT 1';
  if (name.includes('TKJT 2')) kelas = 'TKJT 2';
  else if (name.includes('TKJT 3')) kelas = 'TKJT 3';
  const angkatan = name.includes('Angkatan 9') || name.includes('9') ? 9 : 8;
  return { kelas, angkatan };
}

/**
 * Login akun piket dan verifikasi PIN, keduanya server-side.
 * body: { username, pin }                  -> login, balas token
 * body: { action: 'verify', groupName, pin } -> cek PIN ketua kelompok, balas { valid }
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!authConfigured()) {
    return res.status(503).json({ error: 'Server belum dikonfigurasi: AUTH_SECRET tidak diset' });
  }

  const ip =
    String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  if (rateLimited(ip)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' });
  }

  const { action, username, pin, groupName } = req.body || {};
  const pinRaw = String(pin || '').trim();
  if (!pinRaw) {
    return res.status(400).json({ error: 'PIN harus diisi' });
  }

  const accounts = await loadAccountsWithPins();

  if (action === 'verify') {
    const group = String(groupName || '').trim();
    if (!group) {
      return res.status(400).json({ error: 'Kelompok piket harus disebutkan' });
    }
    const account = accounts.find((a) => a.groupName === group);
    if (!account || typeof account.pin !== 'string' || !account.pin) {
      return res.status(404).json({ error: 'Akun piket kelompok ini belum dikonfigurasi' });
    }
    if (!verifyPin(pinRaw, account.pin)) {
      return res.status(401).json({ valid: false, error: 'PIN Otorisasi salah' });
    }
    return res.json({ valid: true, ketuaPiket: account.ketuaPiket });
  }

  const userLower = String(username || '').trim().toLowerCase();
  if (!userLower) {
    return res.status(400).json({ error: 'Username harus diisi' });
  }

  const account = accounts.find(
    (a) => String(a.username || '').toLowerCase() === userLower && typeof a.pin === 'string' && a.pin,
  );
  if (!account || !verifyPin(pinRaw, account.pin)) {
    return res.status(401).json({ error: 'Kombinasi nama pengguna atau kata sandi tidak valid' });
  }

  const { kelas, angkatan } = classFromGroupName(account.groupName || '');
  return res.json({
    success: true,
    role: 'piket',
    username: account.username,
    kelas,
    angkatan,
    token: issueToken({ username: account.username, role: 'piket', kelas, angkatan }),
  });
}
