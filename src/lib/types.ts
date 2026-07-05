// SI-TRACK TANAH — shared client types
import type { Role } from "@/lib/constants";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  position?: string | null;
  phone?: string | null;
  nip?: string | null;
  avatar?: string | null;
}

export interface PermohonanListItem {
  id: string;
  nomorRegister: string;
  pemohonNama: string;
  pemohonNik: string;
  statusSaatIni: string;
  statusNama: string;
  statusWarna: string;
  prioritas: string;
  createdAt: string;
  updatedAt: string;
  tanggalSelesai: string | null;
  jenisSurat: { nama: string; kode: string; butuhPengukuran: boolean; butuhTtdCamat: boolean };
  creator: { name: string } | null;
  _count: { dokumen: number; riwayat: number };
  keperluan?: string | null;
  alasanDitolak?: string | null;
  catatan?: string | null;
}

export interface RiwayatItem {
  id: string;
  statusKode: string;
  statusNama: string;
  catatan: string | null;
  petugas: string;
  petugasJabatan?: string | null;
  tanggal: string;
}

export interface TrackingResult {
  nomorRegister: string;
  pemohonNama: string;
  pemohonNik: string;
  jenisSurat: string;
  keperluan: string | null;
  statusSaatIni: string;
  statusNama: string;
  statusWarna: string;
  statusKeterangan?: string;
  isFinal?: boolean;
  isKhusus?: boolean;
  alasanDitolak: string | null;
  catatan: string | null;
  prioritas: string;
  createdAt: string;
  updatedAt: string;
  tanggalSelesai: string | null;
  lokasiTanah: string | null;
  luasTanah: string | null;
  stages: string[];
  currentIndex: number;
  riwayat: RiwayatItem[];
  dokumenCount: number;
  dokumen: { id: string; jenisDokumen: string; namaFile: string; createdAt: string }[];
}

export interface DashboardStats {
  role: string;
  stats: {
    total: number;
    diproses: number;
    menungguPengukuran: number;
    menungguLurah: number;
    menungguCamat: number;
    selesai: number;
    ditolak: number;
    revisi: number;
    avgDays: number;
  };
  counts: Record<string, number>;
  monthly: { month: number; label: string; total: number; selesai: number; ditolak: number }[];
  statusDist: { kode: string; nama: string; value: number }[];
  perPetugas: { id: string; name: string; total: number; selesai: number }[];
  recent: PermohonanListItem[];
  pendingApprovals: any[];
}

export type AppView =
  | "public"
  | "dashboard"
  | "permohonan"
  | "permohonan-baru"
  | "permohonan-detail"
  | "laporan"
  | "audit-log"
  | "users"
  | "jenis-surat"
  | "notifikasi"
  | "profil";
