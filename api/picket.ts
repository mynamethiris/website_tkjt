// Endpoint data piket — SELF-CONTAINED untuk Vercel ESM.
//
// Jangan import dari ../src/* di file ini: runtime serverless mengeksekusi
// function sebagai ESM murni, sehingga import relatif tanpa ekstensi membuat
// function crash saat boot (FUNCTION_INVOCATION_FAILED). Hanya modul builtin
// (fs/path/crypto) yang boleh di-import statis. Helper lain diduplikasi dari
// src/server/* (sumber kebenaran tetap di sana untuk server Express lokal).
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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
function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function authSecret(): string {
  return (process.env.AUTH_SECRET || '').trim();
}

function authConfigured(): boolean {
  return authSecret().length >= 16;
}

function b64urlSign(payload: string): string {
  return b64url(crypto.createHmac('sha256', authSecret()).update(payload).digest());
}

function sessionFromRequest(req: any): any | null {
  const raw = String(req?.headers?.authorization || '');
  if (!raw.toLowerCase().startsWith('bearer ')) return null;
  const token = raw.slice(7).trim();
  if (!token || !authConfigured()) return null;
  const dot = token.indexOf('.');
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  let got: Buffer;
  let want: Buffer;
  try {
    got = b64urlDecode(token.slice(dot + 1));
    want = b64urlDecode(b64urlSign(payload));
  } catch {
    return null;
  }
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;
  try {
    const session = JSON.parse(b64urlDecode(payload).toString('utf8'));
    if (!session || typeof session.exp !== 'number' || Date.now() > session.exp) return null;
    if (session.role !== 'admin' && session.role !== 'piket' && session.role !== 'tamu') return null;
    return session;
  } catch {
    return null;
  }
}

function requireWriteAccess(req: any, res: any, allowed: string[]): any | null {
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

// ---- PIN piket (duplikat src/server/picket_store.ts) ----
const SCRYPT_PREFIX = 'scrypt$';
const KEY_LEN = 32;

function isHashedPin(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(SCRYPT_PREFIX);
}

function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pin, salt, KEY_LEN);
  return `${SCRYPT_PREFIX}${salt.toString('hex')}$${hash.toString('hex')}`;
}

function stripPins(accounts: any[] | null): any[] {
  if (!accounts) return [];
  return accounts.map(({ pin, ...rest }) => ({
    ...rest,
    hasPin: typeof pin === 'string' && pin.length > 0,
  }));
}

function preserveExistingPins(incoming: any[], existing: any[]): any[] {
  const byId = new Map<string, any>(existing.map((a) => [String(a.id), a]));
  return incoming.map((raw) => {
    // hasPin adalah field turunan yang dikirim ke klien oleh stripPins. Kolomnya
    // tidak ada di tabel, jadi harus dibuang sebelum upsert (kalau tidak,
    // Supabase menolak dengan PGRST204).
    const { hasPin: _hasPin, ...acc } = raw || {};
    const sent = typeof acc.pin === 'string' ? acc.pin.trim() : '';
    if (sent) {
      return { ...acc, pin: isHashedPin(sent) ? sent : hashPin(sent) };
    }
    const old = byId.get(String(acc.id));
    const oldPin = old && typeof old.pin === 'string' ? old.pin : '';
    if (!oldPin) return acc;
    return { ...acc, pin: isHashedPin(oldPin) ? oldPin : hashPin(oldPin) };
  });
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

function getLocalData() {
  try {
    const dbPath = path.join(process.cwd(), 'database.json');
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    }
  } catch {}
  return { picketGroups: [], picketAccounts: [], picketReports: [] };
}

function saveLocalData(data: any): boolean {
  try {
    const dbPath = path.join(process.cwd(), 'database.json');
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    // Filesystem serverless bersifat read-only. Jangan laporkan sukses palsu.
    console.error('Failed to save database:', err);
    return false;
  }
}

function stripMeta(items: any[] | null) {
  if (!items) return [];
  return items.map(({ created_at, updated_at, ...rest }) => rest);
}

async function supaQuery(promise: any, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('supabase timeout')), ms)),
  ]);
}

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    // Pin tidak pernah dikirim ke klien, termasuk admin. Yang tersimpan adalah
    // hash, jadi tidak ada nilai yang berguna untuk ditampilkan.
    const shape = (accounts: any[]) => stripPins(accounts);

    try {
      const supabase = await getSupabaseSafe();
      if (supabase) {
        const { data: groups, error: gErr } = await supaQuery(
          supabase.from('tkjt_picket_groups').select('*').order('id'),
        );
        const { data: accounts, error: aErr } = await supaQuery(
          supabase.from('tkjt_picket_accounts').select('*').order('id'),
        );
        const { data: reports, error: rErr } = await supaQuery(
          supabase.from('tkjt_picket_reports').select('*').order('id'),
        );
        if (!gErr && !aErr && !rErr && groups && accounts && reports) {
          return res.json({
            picketGroups: stripMeta(groups),
            picketAccounts: shape(stripMeta(accounts)),
            picketReports: stripMeta(reports),
          });
        }
      }
      const local = getLocalData();
      res.json({
        picketGroups: local.picketGroups || [],
        picketAccounts: shape(local.picketAccounts || []),
        picketReports: local.picketReports || [],
      });
    } catch {
      const local = getLocalData();
      res.json({
        picketGroups: local.picketGroups || [],
        picketAccounts: shape(local.picketAccounts || []),
        picketReports: local.picketReports || [],
      });
    }
  } else if (req.method === 'POST') {
    const session = requireWriteAccess(req, res, ['admin', 'piket']);
    if (!session) return;
    try {
      const { picketGroups, picketAccounts, picketReports } = req.body || {};

      // Hanya admin boleh mengubah kelompok dan akun (termasuk pin).
      if ((picketGroups || picketAccounts) && session.role !== 'admin') {
        return res.status(403).json({
          error: 'Hanya admin yang boleh mengubah kelompok atau akun piket',
        });
      }

      const local = getLocalData();
      if (picketGroups) local.picketGroups = picketGroups;
      if (picketAccounts) {
        const existing = await loadAccountsWithPins();
        local.picketAccounts = preserveExistingPins(picketAccounts, existing);
      }
      if (picketReports) local.picketReports = picketReports;
      const savedLocal = saveLocalData(local);

      let savedRemote = false;
      const supabase = await getSupabaseSafe();
      if (supabase) {
        try {
          const results: any[] = [];
          if (picketGroups) {
            results.push(await supaQuery(supabase.from('tkjt_picket_groups').upsert(picketGroups)));
          }
          if (picketAccounts) {
            results.push(
              await supaQuery(supabase.from('tkjt_picket_accounts').upsert(local.picketAccounts)),
            );
          }
          if (picketReports) {
            results.push(await supaQuery(supabase.from('tkjt_picket_reports').upsert(picketReports)));
          }
          savedRemote = results.length > 0 && results.every((r) => !r?.error);
          for (const r of results) {
            if (r?.error) console.error('Supabase picket sync error:', r.error);
          }
        } catch (err) {
          console.error('Supabase picket sync error:', err);
        }
      }

      if (!savedLocal && !savedRemote) {
        return res.status(500).json({ error: 'Gagal menyimpan: penyimpanan tidak tersedia' });
      }
      res.json({ success: true, persisted: { local: savedLocal, remote: savedRemote } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
