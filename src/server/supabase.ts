import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = undefined as any;

function getClient(): SupabaseClient | null {
  if (_client !== undefined) return _client;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY || '';

  _client = (url && key && !url.includes('dummy'))
    ? createClient(url, key)
    : null;
  return _client;
}

export function getSupabase(): SupabaseClient | null {
  return getClient();
}
