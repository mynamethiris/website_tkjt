import fs from 'fs';
import path from 'path';
import { requireWriteAccess } from '../src/server/auth_token';
import { loadAccountsWithPins, preserveExistingPins, stripPins } from '../src/server/picket_store';
import { getSupabase } from '../src/server/supabase';

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
  const supabase = getSupabase();

  if (req.method === 'GET') {
    // Pin tidak pernah dikirim ke klien, termasuk admin. Yang tersimpan adalah
    // hash, jadi tidak ada nilai yang berguna untuk ditampilkan.
    const shape = (accounts: any[]) => stripPins(accounts);

    try {
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
