import fs from 'fs';
import path from 'path';
import { requireWriteAccess } from '../src/server/auth_token';
// Pakai helper bersama, jangan bikin klien sendiri. Versi lokal sebelumnya
// hanya membaca publishable key, sehingga operasi tulis ditolak RLS.
import { getSupabase } from '../src/server/supabase';

function getLocalData() {
  try {
    const dbPath = path.join(process.cwd(), 'database.json');
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    }
  } catch {}
  return { inventory: [] };
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
          supabase.from('tkjt_inventory').select('*').order('id'),
        );
        if (!error && data) {
          return res.json(stripMeta(data));
        }
      }
      const local = getLocalData();
      res.json(local.inventory || []);
    } catch {
      const local = getLocalData();
      res.json(local.inventory || []);
    }
  } else if (req.method === 'POST') {
    if (!requireWriteAccess(req, res, ['admin', 'piket'])) return;
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Data inventaris harus berupa array' });
      }
      const local = getLocalData();
      local.inventory = items;
      const savedLocal = saveLocalData(local);

      let savedRemote = false;
      if (supabase) {
        try {
          const { error } = await supaQuery(supabase.from('tkjt_inventory').upsert(items));
          savedRemote = !error;
          if (error) console.error('Supabase inventory sync error:', error);
        } catch (err) {
          console.error('Supabase inventory sync error:', err);
        }
      }

      if (!savedLocal && !savedRemote) {
        return res.status(500).json({ error: 'Gagal menyimpan: penyimpanan tidak tersedia' });
      }
      res.json({ success: true, inventory: items, persisted: { local: savedLocal, remote: savedRemote } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
