"use client";

import { Logo } from "@/components/app/Logo";
import { useAppStore } from "@/store/app-store";
import { terbilang, formatRupiah } from "@/lib/terbilang";

/**
 * KwitansiPembayaran — printable official payment receipt for Biaya Operasional.
 *
 * Renders as a glass-card on screen (dark navy + gold accents). In print,
 * the @media print rules in globals.css flip the dialog to white background
 * with gold borders + dark text automatically (same selector as TandaTerima:
 * `[role="dialog"].tanda-terima-printable`).
 *
 * Layout (optimized for a single A4 page):
 *  - Kop Surat (letterhead) — same as Tanda Terima for institutional consistency.
 *  - Title: "KWITANSI PEMBAYARAN" + subtitle "BIAYA OPERASIONAL".
 *  - Nomor Kwitansi + tanggal bayar + QR verification code (top-right).
 *  - "Diterima Dari" block (pemohon name + NIK).
 *  - "Uang Sejumlah" block (nominal in numbers + terbilang in words).
 *  - "Untuk Pembayaran" block (keperluan + jenis surat + register).
 *  - Metode pembayaran + diterima oleh.
 *  - 2-column signature grid (Pemohon + Petugas Penerima) under "Mengetahui, LURAH".
 *  - Bottom legal note (large receipt is valid as proof of payment).
 */

export interface KwitansiData {
  // From BiayaOperasional
  nomorKwitansi: string | null;
  nominal: number;
  keterangan: string | null;
  metodePembayaran: string | null;
  tanggalBayar: string | null;
  tanggalJatuhTempo: string | null;
  diterimaOleh: string | null;
  catatan: string | null;
  // From Permohonan
  nomorRegister: string;
  pemohonNama: string;
  pemohonNik: string;
  pemohonAlamat: string | null;
  pemohonHp: string | null;
  jenisSuratNama: string;
  keperluan: string | null;
  statusSaatIni: string;
  // Petugas penerima (creator of the biaya or the user who marked as LUNAS)
  petugasNama?: string | null;
  petugasJabatan?: string | null;
}

const METODE_LABEL: Record<string, string> = {
  TUNAI: "Tunai",
  TRANSFER: "Transfer Bank",
  QRIS: "QRIS / QR Code",
  LAINNYA: "Lainnya",
};

function formatDate(d?: string | null): string {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function formatDateTime(d?: string | null): string {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}

function todayDate(): string {
  try {
    return new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function DLItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-0.5">
      <dt className="w-40 shrink-0 text-muted-foreground text-xs uppercase tracking-wide">{label}</dt>
      <dd className="flex-1 min-w-0 text-sm font-medium break-words">{value || <span className="text-muted-foreground">-</span>}</dd>
    </div>
  );
}

export function KwitansiPembayaran({
  data,
  qrDataUrl,
}: {
  data: KwitansiData;
  qrDataUrl?: string | null;
}) {
  const branding = useAppStore((s) => s.branding);
  const logoUrl = branding?.branding_logo_url;

  const terbilangStr = terbilang(data.nominal);
  const metodeLabel = data.metodePembayaran ? METODE_LABEL[data.metodePembayaran] || data.metodePembayaran : "-";
  const keperluanText = data.keperluan || data.jenisSuratNama || "Pembayaran biaya operasional pendaftaran surat tanah";

  return (
    <div className="tanda-terima-inner mx-auto w-full max-w-[800px] glass-card border-primary/30 rounded-lg p-5 sm:p-7 space-y-4 sm:space-y-5">
      {/* ===== Kop Surat (letterhead) ===== */}
      <header className="flex items-start gap-3 sm:gap-4 print:break-inside-avoid">
        <Logo size={56} src={logoUrl} className="shrink-0" />
        <div className="flex-1 text-center min-w-0">
          <h1 className="text-xs sm:text-sm font-bold uppercase tracking-wide">
            PEMERINTAH KABUPATEN SERUYAN
          </h1>
          <h2 className="text-base sm:text-xl font-extrabold uppercase tracking-wide gold-gradient-text leading-tight">
            KELURAHAN KUALA PEMBUANG II
          </h2>
          <p className="text-[9px] sm:text-[11px] text-muted-foreground mt-0.5 leading-tight">
            Jl. Iskandar No. 1, Kuala Pembuang, Seruyan, Kalimantan Tengah 74214
            <br className="hidden sm:block" />
            <span className="sm:hidden"> • </span>
            Telp. (0532) 777-0000 • Email: kelurahan.kpii@seruyankab.go.id
          </p>
        </div>
      </header>

      {/* Gold horizontal rule */}
      <div className="space-y-0.5 print:break-inside-avoid">
        <div className="h-[3px] rounded-full bg-gradient-to-r from-[#b8941f] via-[#f5d77a] to-[#b8941f]" />
        <div className="h-px rounded-full bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
      </div>

      {/* ===== Title ===== */}
      <div className="text-center space-y-1 pt-1 print:break-inside-avoid">
        <h2 className="text-lg sm:text-2xl font-extrabold tracking-wide uppercase underline decoration-[#d4af37] decoration-2 underline-offset-4">
          Kwitansi Pembayaran
        </h2>
        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-[0.25em]">
          Biaya Operasional Pendaftaran Surat Tanah
        </p>
      </div>

      {/* ===== Nomor Kwitansi + Tanggal + QR ===== */}
      <section className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4 print:break-inside-avoid">
        <div className="flex-1 rounded-lg border-2 border-primary/50 bg-primary/5 p-3 sm:p-4 space-y-2.5">
          <div>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
              Nomor Kwitansi
            </p>
            <p className="font-mono text-lg sm:text-2xl font-bold gold-gradient-text break-all leading-tight">
              {data.nomorKwitansi || "(Belum diterbitkan)"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
                Tanggal Pembayaran
              </p>
              <p className="text-xs sm:text-sm font-semibold">{formatDate(data.tanggalBayar)}</p>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
                Metode Pembayaran
              </p>
              <p className="text-xs sm:text-sm font-semibold">{metodeLabel}</p>
            </div>
          </div>
        </div>
        {qrDataUrl && (
          <div className="flex flex-row sm:flex-col items-center gap-2 sm:gap-1 shrink-0 self-center">
            <div className="p-1.5 rounded-lg bg-white border-2 border-primary/50 shadow-sm">
              <img
                src={qrDataUrl}
                alt={`QR Code Kwitansi ${data.nomorKwitansi || ""}`}
                className="w-[88px] h-[88px] sm:w-[96px] sm:h-[96px]"
              />
            </div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground text-center max-w-[120px] leading-tight">
              Scan untuk verifikasi
            </p>
          </div>
        )}
      </section>

      {/* ===== Diterima Dari ===== */}
      <section className="print:break-inside-avoid">
        <h3 className="text-xs font-bold uppercase tracking-wider border-b-2 border-primary/40 pb-1 mb-2 gold-text">
          Diterima Dari
        </h3>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-0">
          <DLItem label="Nama Pemohon" value={data.pemohonNama} />
          <DLItem label="NIK" value={<span className="font-mono">{data.pemohonNik}</span>} />
          {data.pemohonAlamat && (
            <div className="sm:col-span-2">
              <DLItem label="Alamat" value={data.pemohonAlamat} />
            </div>
          )}
          {data.pemohonHp && <DLItem label="No. HP" value={data.pemohonHp} />}
        </dl>
      </section>

      {/* ===== Uang Sejumlah (nominal + terbilang) ===== */}
      <section className="print:break-inside-avoid">
        <h3 className="text-xs font-bold uppercase tracking-wider border-b-2 border-primary/40 pb-1 mb-2 gold-text">
          Uang Sejumlah
        </h3>
        <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3 sm:p-4 space-y-2">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <span className="text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground">Nominal (Angka)</span>
            <span className="font-mono text-xl sm:text-2xl font-extrabold gold-gradient-text">
              {formatRupiah(data.nominal)}
            </span>
          </div>
          <div className="border-t border-primary/20 pt-2">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-muted-foreground">Terbilang</p>
            <p className="text-sm sm:text-base font-semibold italic leading-snug">
              &ldquo;{terbilangStr}&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ===== Untuk Pembayaran ===== */}
      <section className="print:break-inside-avoid">
        <h3 className="text-xs font-bold uppercase tracking-wider border-b-2 border-primary/40 pb-1 mb-2 gold-text">
          Untuk Pembayaran
        </h3>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-0">
          <DLItem label="Jenis Surat" value={data.jenisSuratNama} />
          <DLItem label="Nomor Register" value={<span className="font-mono">{data.nomorRegister}</span>} />
          <div className="sm:col-span-2">
            <DLItem label="Keperluan" value={keperluanText} />
          </div>
          {data.keterangan && (
            <div className="sm:col-span-2">
              <DLItem label="Keterangan Biaya" value={data.keterangan} />
            </div>
          )}
          {data.catatan && (
            <div className="sm:col-span-2">
              <DLItem label="Catatan" value={data.catatan} />
            </div>
          )}
        </dl>
      </section>

      {/* ===== Signature Block ===== */}
      <section className="signature-block pt-4 sm:pt-6 print:break-inside-avoid">
        {/* Place + date line at top, right-aligned */}
        <div className="text-right text-sm mb-4 sm:mb-6">
          <p className="font-medium leading-tight">
            Kuala Pembuang, {data.tanggalBayar ? formatDate(data.tanggalBayar) : todayDate()}
          </p>
        </div>

        {/* Mengetahui line (Lurah acknowledgment) */}
        <p className="text-center text-[11px] text-muted-foreground mb-1">Mengetahui,</p>
        <p className="text-center text-xs font-semibold mb-1">LURAH KUALA PEMBUANG II</p>

        {/* 2-column signatures: Pemohon (left) + Petugas Penerima (right) */}
        <div className="grid grid-cols-2 gap-6 sm:gap-16 mt-12 sm:mt-16">
          {/* Left: Pemohon */}
          <div className="text-center text-sm">
            <p className="font-medium mb-0 leading-tight">Pemohon,</p>
            <div className="border-t border-foreground/70 pt-1 mt-12 sm:mt-14">
              <p className="font-semibold text-xs sm:text-sm leading-tight">
                ( {data.pemohonNama} )
              </p>
            </div>
          </div>

          {/* Right: Petugas Penerima */}
          <div className="text-center text-sm">
            <p className="font-medium mb-0 leading-tight">Petugas Penerima,</p>
            <div className="border-t border-foreground/70 pt-1 mt-12 sm:mt-14">
              <p className="font-semibold text-xs sm:text-sm leading-tight">
                ( {data.diterimaOleh || data.petugasNama || "—"} )
              </p>
              {data.petugasJabatan && (
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  {data.petugasJabatan}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Bottom legal note ===== */}
      <p className="text-[10px] sm:text-[11px] italic text-muted-foreground text-center pt-3 border-t border-primary/20 leading-relaxed print:break-inside-avoid">
        Kwitansi ini diterbitkan secara sah oleh sistem {`SI-TRACK TANAH`} Kelurahan Kuala
        Pembuang II dan berlaku sebagai bukti pembayaran biaya operasional. Nomor kwitansi
        {data.nomorKwitansi ? ` ${data.nomorKwitansi}` : ""} bersifat unik dan dapat
        diverifikasi melalui kode QR di atas. Simpan baik-baik.
      </p>
    </div>
  );
}

export default KwitansiPembayaran;
