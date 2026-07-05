// SI-TRACK TANAH — Constants & domain config

export type Role = "ADMIN" | "PETUGAS" | "ATASAN";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  PETUGAS: "Petugas Kelurahan",
  ATASAN: "Lurah (Atasan)",
};

// ===== Status Proses definitions =====
export interface StatusDef {
  kode: string;
  nama: string;
  urutan: number;
  warna: string; // hex
  icon: string; // lucide icon name
  keterangan?: string;
  isKhusus?: boolean;
  isFinal?: boolean;
}

export const STATUS_DEFINITIONS: StatusDef[] = [
  {
    kode: "PENGAJUAN",
    nama: "Pengajuan Diterima",
    urutan: 1,
    warna: "#3b82f6",
    icon: "FilePlus2",
    keterangan: "Permohonan telah didaftarkan oleh petugas dan memperoleh Nomor Register.",
  },
  {
    kode: "CEK_ADMIN",
    nama: "Cek Administrasi",
    urutan: 2,
    warna: "#0891b2",
    icon: "ClipboardCheck",
    keterangan: "Verifikasi identitas pemohon, kelengkapan dokumen, dan persyaratan.",
  },
  {
    kode: "VERIFIKASI_LAPANGAN",
    nama: "Verifikasi Lapangan",
    urutan: 3,
    warna: "#0d9488",
    icon: "MapPin",
    keterangan: "Pemeriksaan lokasi, validasi data fisik, dan pemeriksaan batas tanah.",
  },
  {
    kode: "PENGUKURAN",
    nama: "Pengukuran Tanah",
    urutan: 4,
    warna: "#ca8a04",
    icon: "Ruler",
    keterangan: "Pengukuran bidang tanah, pembuatan sketsa, dan upload hasil pengukuran.",
  },
  {
    kode: "PEMBUATAN_SURAT",
    nama: "Pembuatan Surat Tanah",
    urutan: 5,
    warna: "#d4af37",
    icon: "FileText",
    keterangan: "Penyusunan draft surat, pemeriksaan administrasi akhir, dan validasi data.",
  },
  {
    kode: "TTD_LURAH",
    nama: "Menunggu Tanda Tangan Lurah",
    urutan: 6,
    warna: "#eab308",
    icon: "PenTool",
    keterangan: "Pemeriksaan akhir, persetujuan, dan tanda tangan Lurah.",
  },
  {
    kode: "TTD_CAMAT",
    nama: "Menunggu Tanda Tangan Camat",
    urutan: 7,
    warna: "#f59e0b",
    icon: "Stamp",
    keterangan: "Pengesahan Camat (hanya untuk jenis surat yang memerlukan).",
  },
  {
    kode: "SELESAI",
    nama: "Surat Selesai",
    urutan: 8,
    warna: "#16a34a",
    icon: "CheckCircle2",
    keterangan: "Surat telah selesai diproses dan siap diambil oleh pemohon.",
    isFinal: true,
  },
  {
    kode: "REVISI",
    nama: "Perbaikan Dokumen",
    urutan: 98,
    warna: "#f97316",
    icon: "AlertTriangle",
    keterangan: "Dokumen belum lengkap, pemohon diminta melengkapi persyaratan.",
    isKhusus: true,
  },
  {
    kode: "DITOLAK",
    nama: "Permohonan Ditolak",
    urutan: 99,
    warna: "#dc2626",
    icon: "XCircle",
    keterangan: "Permohonan ditolak. Alasan penolakan wajib ditampilkan.",
    isKhusus: true,
    isFinal: true,
  },
];

export const STATUS_BY_KODE: Record<string, StatusDef> = Object.fromEntries(
  STATUS_DEFINITIONS.map((s) => [s.kode, s])
);

// ===== Jenis Dokumen =====
export const JENIS_DOKUMEN = [
  { kode: "KTP", nama: "KTP" },
  { kode: "KK", nama: "Kartu Keluarga" },
  { kode: "SPPT_PBB", nama: "SPPT PBB" },
  { kode: "BUKTI_PENGUASAAN", nama: "Bukti Penguasaan Tanah" },
  { kode: "SURAT_PERNYATAAN", nama: "Surat Pernyataan" },
  { kode: "FOTO_LOKASI", nama: "Foto Lokasi" },
  { kode: "DOKUMEN_PENDUKUNG", nama: "Dokumen Pendukung" },
];

// ===== Jenis Surat (seed) =====
export const JENIS_SURAT_SEED = [
  {
    kode: "SURAT_KETERANGAN_TANAH",
    nama: "Surat Keterangan Tanah",
    deskripsi: "Surat keterangan penguasaan/pemilikan tanah untuk keperluan administrasi.",
    butuhPengukuran: true,
    butuhTtdCamat: false,
  },
  {
    kode: "SURAT_PENGUKURAN_TANAH",
    nama: "Surat Pengukuran Tanah",
    deskripsi: "Surat hasil pengukuran bidang tanah.",
    butuhPengukuran: true,
    butuhTtdCamat: true,
  },
  {
    kode: "SURAT_PERMOHONAN_SERTIFIKAT",
    nama: "Surat Permohonan Sertifikat Tanah",
    deskripsi: "Pendampingan permohonan sertifikat tanah ke BPN.",
    butuhPengukuran: true,
    butuhTtdCamat: true,
  },
  {
    kode: "SURAT_KETERANGAN_WARIS",
    nama: "Surat Keterangan Waris Tanah",
    deskripsi: "Keterangan waris atas tanah.",
    butuhPengukuran: false,
    butuhTtdCamat: false,
  },
  {
    kode: "SURAT_BEBAS_SENGKETA",
    nama: "Surat Bebas Sengketa Tanah",
    deskripsi: "Keterangan tanah bebas sengketa.",
    butuhPengukuran: false,
    butuhTtdCamat: true,
  },
];

// ===== Register format =====
export const REGISTER_PREFIX = "KPII-TNH";

// ===== Notifikasi templates =====
export const NOTIF_TEMPLATES = {
  BERKAS_DITERIMA: (reg: string, nama: string) => ({
    judul: "Berkas Diterima",
    pesan: `Permohonan atas nama ${nama} (${reg}) telah diterima dan didaftarkan.`,
    tipe: "SUCCESS" as const,
  }),
  BERKAS_KURANG: (reg: string, catatan: string) => ({
    judul: "Berkas Kurang Lengkap",
    pesan: `Permohonan ${reg} memerlukan perbaikan: ${catatan}`,
    tipe: "WARNING" as const,
  }),
  JADWAL_PENGUKURAN: (reg: string) => ({
    judul: "Jadwal Pengukuran",
    pesan: `Permohonan ${reg} masuk tahap pengukuran tanah.`,
    tipe: "INFO" as const,
  }),
  TTD_LURAH: (reg: string) => ({
    judul: "Menunggu Tanda Tangan Lurah",
    pesan: `Permohonan ${reg} menunggu persetujuan Lurah.`,
    tipe: "INFO" as const,
  }),
  TTD_CAMAT: (reg: string) => ({
    judul: "Menunggu Tanda Tangan Camat",
    pesan: `Permohonan ${reg} menunggu pengesahan Camat.`,
    tipe: "INFO" as const,
  }),
  SELESAI: (reg: string, nama: string) => ({
    judul: "Surat Selesai",
    pesan: `Surat untuk ${nama} (${reg}) telah selesai dan siap diambil.`,
    tipe: "SUCCESS" as const,
  }),
  DITOLAK: (reg: string, alasan: string) => ({
    judul: "Permohonan Ditolak",
    pesan: `Permohonan ${reg} ditolak. Alasan: ${alasan}`,
    tipe: "DANGER" as const,
  }),
};

// ===== Workflow helpers =====
// Given a permohonan's jenisSurat flags + current status, return the next "normal" status.
export function nextStatus(
  currentKode: string,
  opts: { butuhPengukuran: boolean; butuhTtdCamat: boolean }
): string | null {
  const order = [
    "PENGAJUAN",
    "CEK_ADMIN",
    "VERIFIKASI_LAPANGAN",
    ...(opts.butuhPengukuran ? ["PENGUKURAN"] : []),
    "PEMBUATAN_SURAT",
    "TTD_LURAH",
    ...(opts.butuhTtdCamat ? ["TTD_CAMAT"] : []),
    "SELESAI",
  ];
  const idx = order.indexOf(currentKode);
  if (idx < 0 || idx >= order.length - 1) return null;
  return order[idx + 1];
}

// Build the linear stage list for a given jenis surat (used by timeline UI).
export function buildStages(opts: { butuhPengukuran: boolean; butuhTtdCamat: boolean }): string[] {
  return [
    "PENGAJUAN",
    "CEK_ADMIN",
    "VERIFIKASI_LAPANGAN",
    ...(opts.butuhPengukuran ? ["PENGUKURAN"] : []),
    "PEMBUATAN_SURAT",
    "TTD_LURAH",
    ...(opts.butuhTtdCamat ? ["TTD_CAMAT"] : []),
    "SELESAI",
  ];
}
