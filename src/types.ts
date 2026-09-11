export interface Student {
  id: number;
  name: string;
  photo: string;
  role: string;
  angkatan: number;
  kelas: string;
}

export interface GalleryItem {
  id: number;
  title: string;
  photo: string;
}

export interface PicketGroup {
  id: string;
  name: string;
  members: string[];
  day: string;
  tkjt?: string;
  angkatan?: number;
  weekType?: "Minggu 1" | "Minggu 2";
}

export interface PicketReport {
  id: string;
  groupName: string;
  absentMembers: string[];
  reporter: string;
  date: string;
  description: string;
  type?: "Datang" | "Pulang";
  cleanedRooms?: string;
  cleanlinessStatus?: "Bersih" | "Kotor" | "Sedang";
  itemCondition?: "Kondisi Baik" | "Ada Kerusakan Ringan" | "Perlu Perbaikan";
  itemConditionNotes?: string;
  photos?: string[];
  arrivalTime?: string;
  departureTime?: string;
  createdAt?: number;
}

export interface PicketAccount {
  id: string;
  groupName: string;
  day: string;
  username: string;
  /**
   * Hanya diisi klien saat menetapkan PIN baru. Server menyimpan hash dan
   * tidak pernah mengirim nilainya kembali, jadi field ini kosong pada data
   * yang dibaca dari API.
   */
  pin?: string;
  /** Dikirim server: true kalau akun ini sudah punya PIN tersimpan. */
  hasPin?: boolean;
  ketuaPiket: string;
  leaderAssignedAt?: number;
  leaderHistory?: string[];
}

export interface InventoryItem {
  id: string;
  itemName: string;
  description: string;
  rentTime: string;
  returnTime: string;
  borrowerName: string;
  status: "Dipinjam" | "Kembali";
}

export interface AbsensiTKJT {
  id: string;
  studentName: string;
  studentId: number;
  kelas: string;
  angkatan: number;
  date: string;
  status: "Hadir" | "Izin" | "Sakit" | "Alfa";
  notes?: string;
  createdAt?: number;
}

export interface BengkelLog {
  id: string;
  itemId: string;
  itemName: string;
  checkInTime: string;
  checkOutTime?: string;
  statusBefore: string;
  statusAfter?: string;
  conditionNotes: string;
  damageReported?: string;
  reporterName?: string;
  reportDate: string;
}

export type ContentType = "html" | "pdf" | "video" | "link";

export interface TKJTMateri {
  id: string;
  title: string;
  category: string;
  description?: string;
  contentType: ContentType;
  content?: string;
  fileUrl?: string;
  videoEmbedUrl?: string;
  order: number;
  createdAt?: number;
}

export interface PencapaianTKJT {
  id: string;
  studentName: string;
  studentId?: number;
  kelas: string;
  angkatan: number;
  title: string;
  description: string;
  category: "sertifikasi" | "kompetensi" | "proyek";
  icon?: string;
  date: string;
  progressValue?: number;
  progressMax?: number;
  createdAt?: number;
}
