import fs from 'fs';
import path from 'path';
import { requireWriteAccess } from '../src/server/auth_token';
import { getSupabase } from '../src/server/supabase';

function getLocalData() {
  try {
    const dbPath = path.join(process.cwd(), 'database.json');
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    }
  } catch {}
  return { absensi: [] };
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
  // getSupabase() bisa throw kalau SUPABASE_URL tidak valid. Jangan biarkan
  // function crash: Vercel membalas HTML 500 yang merusak res.json() di klien.
  let supabase: any = null;
  try {
    supabase = getSupabase();
  } catch (err) {
    console.error('Supabase init error, fallback ke lokal:', err);
  }

  if (req.method === 'GET') {
    try {
      if (supabase) {
        const { data, error } = await supaQuery(
          supabase.from('tkjt_absensi').select('*').order('createdAt', { ascending: false }),
        );
        if (!error && data) {
          return res.json(stripMeta(data));
        }
      }
      const local = getLocalData();
      res.json(local.absensi || []);
    } catch {
      const local = getLocalData();
      res.json(local.absensi || []);
    }
  } else if (req.method === 'POST') {
    if (!requireWriteAccess(req, res, ['admin', 'piket'])) return;
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Data absensi harus berupa array' });
      }
      const local = getLocalData();
      local.absensi = items;
      const savedLocal = saveLocalData(local);

      let savedRemote = false;
      if (supabase) {
        try {
          const { error } = await supaQuery(supabase.from('tkjt_absensi').upsert(items));
          savedRemote = !error;
          if (error) console.error('Supabase absensi sync error:', error);
        } catch (err) {
          console.error('Supabase absensi sync error:', err);
        }
      }

      // Tanpa satu pun penyimpanan yang berhasil, jangan balas success.
      if (!savedLocal && !savedRemote) {
        return res.status(500).json({ error: 'Gagal menyimpan: penyimpanan tidak tersedia' });
      }
      res.json({ success: true, absensi: items, persisted: { local: savedLocal, remote: savedRemote } });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Gagal menyimpan data' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
