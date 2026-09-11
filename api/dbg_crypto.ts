// Probe diagnosis: uji import builtin crypto saja.
export default function handler(_req: any, res: any) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto');
    const h = crypto.createHash('sha256').update('x').digest('hex');
    res.json({ ok: true, probe: 'crypto', h });
  } catch (e: any) {
    res.status(500).json({ ok: false, probe: 'crypto', error: String(e?.message || e) });
  }
}
