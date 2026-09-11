// Helper sesi di sisi klien. Token dikeluarkan server dan hanya disimpan, tidak dibuat di sini.
const TOKEN_KEY = 'tkjt_token';

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || '';
}

/** Header untuk request yang butuh sesi. Kosong kalau belum login. */
export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
}
