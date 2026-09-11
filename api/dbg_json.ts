// Probe diagnosis: uji static import JSON di luar folder api/.
import studentsJson from '../data/students.json';

export default function handler(_req: any, res: any) {
  try {
    const list = studentsJson as any[];
    res.json({ ok: true, probe: 'json', count: list.length });
  } catch (e: any) {
    res.status(500).json({ ok: false, probe: 'json', error: String(e?.message || e) });
  }
}
