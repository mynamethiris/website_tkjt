import { authConfigured, issueToken } from '../../src/server/auth_token';
import { loadAccountsWithPins, verifyPin } from '../../src/server/picket_store';

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
