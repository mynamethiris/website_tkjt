import crypto from 'crypto';

// Token sesi bertanda tangan HMAC. Payload dapat dibaca klien (bukan rahasia),
// tapi tidak dapat dipalsukan tanpa AUTH_SECRET yang hanya ada di server.
// ponytail: stateless, tanpa daftar revokasi. Logout hanya menghapus token di klien.
// Kalau butuh pencabutan segera, tambahkan tabel sesi di Supabase dan cek di verifySession.

export type Role = 'admin' | 'piket' | 'tamu';

export interface Session {
  username: string;
  role: Role;
  kelas?: string;
  angkatan?: number;
  exp: number;
}

const TTL_MS = 12 * 60 * 60 * 1000;

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function secret(): string {
  return (process.env.AUTH_SECRET || '').trim();
}

/** True kalau AUTH_SECRET belum diset. Endpoint tulis harus fail-closed saat ini. */
export function authConfigured(): boolean {
  return secret().length >= 16;
}

function sign(payload: string): string {
  return b64url(crypto.createHmac('sha256', secret()).update(payload).digest());
}

export function issueToken(session: Omit<Session, 'exp'>): string {
  const body = { ...session, exp: Date.now() + TTL_MS };
  const payload = b64url(Buffer.from(JSON.stringify(body), 'utf8'));
  return `${payload}.${sign(payload)}`;
}

/** Verifikasi tanda tangan dan masa berlaku. Mengembalikan null kalau tidak sah. */
export function verifyToken(token: string | undefined | null): Session | null {
  if (!token || !authConfigured()) return null;
  const dot = token.indexOf('.');
  if (dot < 1) return null;

  const payload = token.slice(0, dot);
  const got = fromB64url(token.slice(dot + 1));
  const want = fromB64url(sign(payload));
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;

  try {
    const session = JSON.parse(fromB64url(payload).toString('utf8')) as Session;
    if (!session || typeof session.exp !== 'number' || Date.now() > session.exp) return null;
    if (session.role !== 'admin' && session.role !== 'piket' && session.role !== 'tamu') return null;
    return session;
  } catch {
    return null;
  }
}

/** Ambil token dari header Authorization: Bearer <token>. */
export function sessionFromRequest(req: any): Session | null {
  const raw = String(req?.headers?.authorization || '');
  if (!raw.toLowerCase().startsWith('bearer ')) return null;
  return verifyToken(raw.slice(7).trim());
}

/**
 * Guard untuk endpoint tulis. Menulis respons error dan mengembalikan null kalau ditolak.
 * Peran 'tamu' tidak pernah boleh menulis.
 */
export function requireWriteAccess(req: any, res: any, allowed: Role[]): Session | null {
  if (!authConfigured()) {
    res.status(503).json({ error: 'Server belum dikonfigurasi: AUTH_SECRET tidak diset' });
    return null;
  }
  const session = sessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Sesi tidak valid atau kedaluwarsa. Silakan login ulang.' });
    return null;
  }
  if (!allowed.includes(session.role)) {
    res.status(403).json({ error: 'Peran Anda tidak berwenang melakukan aksi ini' });
    return null;
  }
  return session;
}
