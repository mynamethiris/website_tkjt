export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    const allKeys = new Set([...keysA, ...keysB]);
    for (const key of allKeys) {
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
}

// Mapping angkatan internal (8,9) ke tampilan UI (1,2)
const ANGKATAN_MAP: Record<number, number> = { 8: 1, 9: 2 };
const ANGKATAN_REVERSE: Record<number, number> = { 1: 8, 2: 9 };

export const getAngkatanDisplay = (internal: number): number => {
  return ANGKATAN_MAP[internal] ?? internal;
};

export const getAngkatanInternal = (display: number): number => {
  return ANGKATAN_REVERSE[display] ?? display;
};

export const getAngkatanLabel = (internal: number): string => {
  return `Angkatan ${getAngkatanDisplay(internal)}`;
};

export const getAngkatanOptions = () => [
  { value: '1', label: 'Angkatan 1' },
  { value: '2', label: 'Angkatan 2' },
];

export const getKelasOptionsForAngkatan = (angkatanInternal: number) => {
  if (angkatanInternal === 8) {
    return [
      { value: 'TKJT 1', label: 'TKJT 1' },
      { value: 'TKJT 2', label: 'TKJT 2' },
    ];
  }
  return [
    { value: 'TKJT 1', label: 'TKJT 1' },
    { value: 'TKJT 2', label: 'TKJT 2' },
    { value: 'TKJT 3', label: 'TKJT 3' },
  ];
};

const BULAN_INDO = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export const formatTanggalIndo = (dateStr: string): string => {
  if (!dateStr) return '';
  // Support YYYY-MM-DD (DatePicker) -> DD Bulan YYYY
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const monthIdx = parseInt(m, 10) - 1;
    return `${d} ${BULAN_INDO[monthIdx] || m} ${y}`;
  }
  // Support DD-MM-YYYY -> DD Bulan YYYY
  const dmyMatch = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const monthIdx = parseInt(m, 10) - 1;
    return `${d} ${BULAN_INDO[monthIdx] || m} ${y}`;
  }
  // Support YYYY-MM-DDTHH:mm or DD-MM-YYYY HH:mm
  if (dateStr.includes('T')) {
    const datePart = dateStr.split('T')[0];
    const timePart = dateStr.split('T')[1]?.slice(0, 5) || '';
    const formatted = formatTanggalIndo(datePart);
    return timePart ? `${formatted} ${timePart}` : formatted;
  }
  const spaceMatch = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}:\d{2})/);
  if (spaceMatch) {
    const [, d, m, y, t] = spaceMatch;
    const monthIdx = parseInt(m, 10) - 1;
    return `${d} ${BULAN_INDO[monthIdx] || m} ${y} ${t}`;
  }
  return dateStr;
};

export const getTodayISO = (): string => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};
