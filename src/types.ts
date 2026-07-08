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
  pin: string;
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
