import fs from 'fs';
import path from 'path';
import { requireWriteAccess } from '../src/server/auth_token';
import { getSupabase } from '../src/server/supabase';
// Import statis, bukan readFileSync(process.cwd()). Pelacak dependensi Vercel
// tidak mengikuti path yang dibangun saat runtime, jadi file JSON-nya tidak
// akan ikut ter-deploy dan endpoint ini balas students kosong.
import studentsJson from '../data/students.json';

const students = studentsJson as any[];

function getLocalData() {
  try {
    const dbPath = path.join(process.cwd(), 'database.json');
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    }
  } catch {}
  return { galleryItems: [] };
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
  const supabase = getSupabase();

  if (req.method === 'GET') {
    try {
      if (supabase) {
        const { data: galleryItems, error: galleryError } = await supaQuery(
          supabase.from('tkjt_gallery').select('*').order('id', { ascending: false }),
        );
        if (!galleryError && galleryItems) {
          return res.json({ students, galleryItems: stripMeta(galleryItems) });
        }
      }
      const local = getLocalData();
      res.json({ students, galleryItems: local.galleryItems || [] });
    } catch {
      const local = getLocalData();
      res.json({ students, galleryItems: local.galleryItems || [] });
    }
  } else if (req.method === 'POST') {
    if (!requireWriteAccess(req, res, ['admin'])) return;
    try {
      const { galleryItems } = req.body;
      if (!Array.isArray(galleryItems)) {
        return res.status(400).json({ error: 'Data galeri harus berupa array' });
      }
      const local = getLocalData();
      local.galleryItems = galleryItems;
      const savedLocal = saveLocalData(local);

      let savedRemote = false;
      if (supabase) {
        try {
          const { error } = await supaQuery(supabase.from('tkjt_gallery').upsert(galleryItems));
          savedRemote = !error;
          if (error) console.error('Supabase gallery sync error:', error);
        } catch (err) {
          console.error('Supabase gallery sync error:', err);
        }
      }

      // Tanpa satu pun penyimpanan yang berhasil, jangan balas success.
      if (!savedLocal && !savedRemote) {
        return res.status(500).json({ error: 'Gagal menyimpan: penyimpanan tidak tersedia' });
      }
      res.json({ success: true, galleryItems, persisted: { local: savedLocal, remote: savedRemote } });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal menyimpan data' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
