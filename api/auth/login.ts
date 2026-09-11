// Login admin/tamu — SELF-CONTAINED untuk Vercel ESM.
//
// Jangan import dari ../../src/* di file ini: runtime serverless mengeksekusi
// function sebagai ESM murni, sehingga import relatif tanpa ekstensi membuat
// function crash saat boot (FUNCTION_INVOCATION_FAILED). Hanya modul builtin
// yang boleh di-import statis.
import crypto from 'crypto';

// ponytail: rate limit in-memory, hanya berlaku per instance serverless yang warm.
// Cukup untuk memperlambat brute force; ganti ke Upstash/Redis kalau butuh limit global.
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

// Perbandingan waktu-konstan supaya isi kredensial tidak bocor lewat timing.
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
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

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip =
    String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  if (rateLimited(ip)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password harus diisi' });
  }

  const userLower = String(username).trim().toLowerCase();
  const passRaw = String(password).trim();

  const adminUser = (process.env.ADMIN_USER || '').trim().toLowerCase();
  const adminPass = (process.env.ADMIN_PASS || '').trim();
  const guestUser = (process.env.GUEST_USER || '').trim().toLowerCase();
  const guestPass = (process.env.GUEST_PASS || '').trim();

  if (!adminUser || !adminPass) {
    return res.status(500).json({ error: 'Admin credentials not configured on server' });
  }
  if (!authConfigured()) {
    return res.status(503).json({ error: 'Server belum dikonfigurasi: AUTH_SECRET tidak diset' });
  }

  if (safeEqual(userLower, adminUser) && safeEqual(passRaw, adminPass)) {
    const username = adminUser;
    return res.json({
      success: true,
      role: 'admin',
      username,
      token: issueToken({ username, role: 'admin' }),
    });
  }
  if (
    guestUser &&
    guestPass &&
    safeEqual(userLower, guestUser) &&
    safeEqual(passRaw, guestPass)
  ) {
    const username = guestUser;
    return res.json({
      success: true,
      role: 'tamu',
      username,
      token: issueToken({ username, role: 'tamu' }),
    });
  }

  return res.status(401).json({ error: 'Kombinasi nama pengguna atau kata sandi tidak valid' });
}
