import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getSupabase } from './supabase';

export interface PicketAccountRow {
  id: string;
  groupName: string;
  day: string;
  username: string;
  pin?: string;
  ketuaPiket: string;
  leaderAssignedAt?: number;
  leaderHistory?: string[];
}

function dbPath(): string {
  return path.join(process.cwd(), 'database.json');
}

export function readLocalDb(): any {
  try {
    if (fs.existsSync(dbPath())) {
      return JSON.parse(fs.readFileSync(dbPath(), 'utf-8'));
    }
  } catch {}
  return {};
}

/** Ambil akun piket lengkap dengan pin. HANYA untuk pemakaian server-side. */
export async function loadAccountsWithPins(): Promise<PicketAccountRow[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('tkjt_picket_accounts').select('*');
      if (!error && Array.isArray(data) && data.length > 0) return data as PicketAccountRow[];
    } catch {}
  }
  const local = readLocalDb();
  return Array.isArray(local.picketAccounts) ? local.picketAccounts : [];
}

// ---------------------------------------------------------------------------
// Hash PIN
//
// PIN 8 digit hanya punya 10^8 kemungkinan, jadi hash cepat seperti SHA-256
// tidak cukup. scrypt dari stdlib node memberi biaya kerja per percobaan.
// Format tersimpan: scrypt$<salt_hex>$<hash_hex>
// ponytail: parameter scrypt bawaan node (N=16384). Naikkan kalau PIN jadi
// lebih panjang atau jumlah akun bertambah banyak.
// ---------------------------------------------------------------------------

const SCRYPT_PREFIX = 'scrypt$';
const KEY_LEN = 32;

export function isHashedPin(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith(SCRYPT_PREFIX);
}

export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pin, salt, KEY_LEN);
  return `${SCRYPT_PREFIX}${salt.toString('hex')}$${hash.toString('hex')}`;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * Verifikasi PIN terhadap nilai tersimpan.
 * Menerima hash scrypt, dan juga PIN plaintext lama supaya data yang sudah
 * ada tidak langsung terkunci. Plaintext akan ter-upgrade ke hash pada
 * penyimpanan berikutnya lewat preserveExistingPins.
 */
export function verifyPin(input: string, stored: unknown): boolean {
  if (typeof stored !== 'string' || !stored) return false;
  if (!isHashedPin(stored)) return timingSafeEqualStr(input, stored);

  const parts = stored.split('$');
  if (parts.length !== 3) return false;
  try {
    // Buffer.from(..., 'hex') membuang karakter non-hex tanpa melempar, jadi
    // hash rusak bisa menghasilkan buffer kosong. Dua buffer kosong lolos
    // timingSafeEqual, yang artinya PIN apa pun akan diterima. Tolak eksplisit.
    if (!/^[0-9a-f]+$/i.test(parts[1]) || !/^[0-9a-f]+$/i.test(parts[2])) return false;
    const salt = Buffer.from(parts[1], 'hex');
    const want = Buffer.from(parts[2], 'hex');
    if (salt.length === 0 || want.length !== KEY_LEN) return false;
    const got = crypto.scryptSync(input, salt, want.length);
    return got.length === want.length && crypto.timingSafeEqual(got, want);
  } catch {
    return false;
  }
}

/** Hapus pin sebelum data dikirim ke klien. Klien tidak pernah butuh nilainya. */
export function stripPins(accounts: any[] | null): any[] {
  if (!accounts) return [];
  return accounts.map(({ pin, ...rest }) => ({
    ...rest,
    hasPin: typeof pin === 'string' && pin.length > 0,
  }));
}

/**
 * Klien menerima akun tanpa pin, jadi POST dari klien tidak boleh menghapus
 * pin yang sudah tersimpan. Aturan per akun:
 * - pin baru dikirim (plaintext)  -> di-hash lalu dipakai
 * - pin sudah berbentuk hash      -> dipakai apa adanya
 * - pin kosong / tidak dikirim    -> pertahankan nilai lama (upgrade ke hash
 *                                    kalau yang lama masih plaintext)
 */
export function preserveExistingPins(incoming: any[], existing: any[]): any[] {
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
