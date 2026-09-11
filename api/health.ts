// Health check TANPA dependensi apa pun (tanpa supabase/json/fs/crypto).
// Dipakai memastikan runtime serverless Vercel bisa mengeksekusi function.
// Kalau endpoint ini 200 tapi /api/data dkk 500, berarti crash ada di import
// shared; kalau ini pun 500, berarti masalah infra (rewrites/runtime).
export default function handler(_req: any, res: any) {
  res.json({ ok: true, time: new Date().toISOString() });
}
