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
// kategori: PEMONON | TANAH | BATAS | LAINNYA — drives UI grouping in multi-upload
// multi: true → jenis ini mendukung banyak file (multi-upload)
// accept: atribut accept HTML untuk input file
// icon: nama ikon lucide (opsional, untuk UI)
export const JENIS_DOKUMEN = [
  // Dokumen Pemohon
  { kode: "KTP", nama: "KTP", kategori: "PEMOHON", multi: true, accept: "image/*,application/pdf" },
  { kode: "KK", nama: "Kartu Keluarga", kategori: "PEMOHON", multi: true, accept: "image/*,application/pdf" },
  { kode: "SURAT_PERNYATAAN", nama: "Surat Pernyataan", kategori: "PEMOHON", multi: false, accept: "image/*,application/pdf" },
  // Dokumen Tanah
  { kode: "SPPT_PBB", nama: "SPPT PBB", kategori: "TANAH", multi: false, accept: "image/*,application/pdf" },
  { kode: "BUKTI_PENGUASAAN", nama: "Bukti Penguasaan Tanah", kategori: "TANAH", multi: true, accept: "image/*,application/pdf" },
  { kode: "FOTO_LOKASI", nama: "Foto Lokasi", kategori: "TANAH", multi: true, accept: "image/*" },
  // Foto Batas Tanah (multi-upload per batas)
  { kode: "FOTO_BATAS_UTARA", nama: "Foto Batas Utara", kategori: "BATAS", multi: true, accept: "image/*" },
  { kode: "FOTO_BATAS_SELATAN", nama: "Foto Batas Selatan", kategori: "BATAS", multi: true, accept: "image/*" },
  { kode: "FOTO_BATAS_TIMUR", nama: "Foto Batas Timur", kategori: "BATAS", multi: true, accept: "image/*" },
  { kode: "FOTO_BATAS_BARAT", nama: "Foto Batas Barat", kategori: "BATAS", multi: true, accept: "image/*" },
  // Lainnya
  { kode: "DOKUMEN_PENDUKUNG", nama: "Dokumen Pendukung", kategori: "LAINNYA", multi: true, accept: "image/*,application/pdf" },
] as const;

// Helper: ambil daftar jenis berdasarkan kategori
export const DOKUMEN_BY_KATEGORI: Record<string, typeof JENIS_DOKUMEN[number][]> = JENIS_DOKUMEN.reduce(
  (acc, j) => {
    (acc[j.kategori] ||= []).push(j);
    return acc;
  },
  {} as Record<string, typeof JENIS_DOKUMEN[number][]>
);

// Label & urutan kategori untuk UI
export const KATEGORI_DOKUMEN: { kode: string; label: string; deskripsi: string; warna: string }[] = [
  { kode: "PEMOHON", label: "Dokumen Pemohon", deskripsi: "KTP, Kartu Keluarga, dan dokumen identitas pemohon", warna: "#3b82f6" },
  { kode: "TANAH", label: "Dokumen Tanah", deskripsi: "Bukti penguasaan, SPPT PBB, dan foto lokasi tanah", warna: "#d4af37" },
  { kode: "BATAS", label: "Foto Batas Tanah", deskripsi: "Foto batas utara, selatan, timur, dan barat bidang tanah", warna: "#0891b2" },
  { kode: "LAINNYA", label: "Dokumen Pendukung", deskripsi: "Dokumen tambahan lain yang relevan", warna: "#6b7280" },
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
