"use client";

import { Logo } from "@/components/app/Logo";
import { STATUS_BY_KODE } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";

/**
 * Tanda Terima Permohonan — printable formal receipt.
 *
 * On screen this renders as a glass-card (dark navy + gold accents).
 * In print, the @media print rules in globals.css flip glass-card to
 * white background with gold border + dark text automatically.
 *
 * Layout notes (Task 14):
 *  - Single A4 page optimized via `print:break-inside-avoid` on each section.
 *  - 2-column signature grid (Pemohon + Petugas Penerima) with date above.
 *  - "Mengetahui, LURAH KUALA PEMBUANG II" header above signatures.
 *  - All sections use `print:break-inside-avoid` so they don't split mid-section.
 */

export interface TandaTerimaPermohonan {
  id: string;
  nomorRegister: string;
  statusSaatIni: string;
  statusNama?: string;
  prioritas: string;
  keperluan: string | null;
  catatan: string | null;
  createdAt: string;
  jenisSurat: { nama: string; kode?: string };
  creator?: { name: string; position?: string | null } | null;
  pemohonNik: string;
  pemohonNama: string;
  pemohonTempatLahir: string | null;
  pemohonTanggalLahir: string | null;
  pemohonAlamat: string | null;
  pemohonRt: string | null;
  pemohonRw: string | null;
  pemohonHp: string | null;
  lokasiTanah: string | null;
  tanahRt: string | null;
  tanahRw: string | null;
  luasTanah: string | number | null;
  batasUtara: string | null;
  batasSelatan: string | null;
  batasTimur: string | null;
  batasBarat: string | null;
  statusPenguasaan: string | null;
}

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

function formatTempatTanggalLahir(tempat: string | null, tgl: string | null): string {
  if (!tempat && !tgl) return "-";
  if (!tempat) return formatDate(tgl);
  if (!tgl) return tempat;
  return `${tempat}, ${formatDate(tgl)}`;
}

function formatRtRw(rt: string | null, rw: string | null): string {
  const parts = [rt, rw].filter((v) => v != null && v !== "");
  if (parts.length === 0) return "-";
  return parts.join(" / ");
}

function DLItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-0.5">
      <dt className="w-36 shrink-0 text-muted-foreground text-xs uppercase tracking-wide">{label}</dt>
      <dd className="flex-1 min-w-0 text-sm font-medium break-words">{value || <span className="text-muted-foreground">-</span>}</dd>
    </div>
  );
}

export function TandaTerima({
  permohonan,
  qrDataUrl,
}: {
  permohonan: TandaTerimaPermohonan;
  qrDataUrl?: string | null;
}) {
  const p = permohonan;
  const statusDef = STATUS_BY_KODE[p.statusSaatIni];
  const statusName = p.statusNama || statusDef?.nama || p.statusSaatIni;
  // Use admin-uploaded custom logo if available (Task 13 branding feature)
  const branding = useAppStore((s) => s.branding);
  const logoUrl = branding?.branding_logo_url;

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

      {/* Gold horizontal rule (double-line for formality) */}
      <div className="space-y-0.5 print:break-inside-avoid">
        <div className="h-[3px] rounded-full bg-gradient-to-r from-[#b8941f] via-[#f5d77a] to-[#b8941f]" />
        <div className="h-px rounded-full bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
      </div>

      {/* ===== Title ===== */}
      <div className="text-center space-y-1 pt-1 print:break-inside-avoid">
        <h2 className="text-lg sm:text-2xl font-extrabold tracking-wide uppercase underline decoration-[#d4af37] decoration-2 underline-offset-4">
          Tanda Terima Permohonan
        </h2>
        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-[0.25em]">
          Pendaftaran Surat Tanah
        </p>
      </div>

      {/* ===== Nomor Register + QR Code ===== */}
      <section className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4 print:break-inside-avoid">
        <div className="flex-1 rounded-lg border-2 border-primary/50 bg-primary/5 p-3 sm:p-4 space-y-2.5">
          <div>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
              Nomor Register / Tanda Terima
            </p>
            <p className="font-mono text-lg sm:text-2xl font-bold gold-gradient-text break-all leading-tight">
              {p.nomorRegister}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
                Diterima Tanggal
              </p>
              <p className="text-xs sm:text-sm font-semibold">{formatDate(p.createdAt)}</p>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
                Status Saat Ini
              </p>
              <p className="text-xs sm:text-sm font-semibold">{statusName}</p>
            </div>
          </div>
        </div>
        {qrDataUrl && (
          <div className="flex flex-row sm:flex-col items-center gap-2 sm:gap-1 shrink-0 self-center">
            <div className="p-1.5 rounded-lg bg-white border-2 border-primary/50 shadow-sm">
              <img
                src={qrDataUrl}
                alt={`QR Code ${p.nomorRegister}`}
                className="w-[88px] h-[88px] sm:w-[96px] sm:h-[96px]"
              />
            </div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground text-center max-w-[120px] leading-tight">
              Scan untuk lacak status
            </p>
          </div>
        )}
      </section>

      {/* ===== Data Pemohon ===== */}
      <section className="print:break-inside-avoid">
        <h3 className="text-xs font-bold uppercase tracking-wider border-b-2 border-primary/40 pb-1 mb-2 gold-text">
          Data Pemohon
        </h3>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-0">
          <DLItem label="NIK" value={<span className="font-mono">{p.pemohonNik}</span>} />
          <DLItem label="Nama Lengkap" value={p.pemohonNama} />
          <div className="sm:col-span-2">
            <DLItem
              label="Tempat/Tgl Lahir"
              value={formatTempatTanggalLahir(p.pemohonTempatLahir, p.pemohonTanggalLahir)}
            />
          </div>
          <div className="sm:col-span-2">
            <DLItem label="Alamat" value={p.pemohonAlamat} />
          </div>
          <DLItem label="RT/RW" value={formatRtRw(p.pemohonRt, p.pemohonRw)} />
          <DLItem label="No. HP" value={p.pemohonHp} />
        </dl>
      </section>

      {/* ===== Data Tanah ===== */}
      <section className="print:break-inside-avoid">
        <h3 className="text-xs font-bold uppercase tracking-wider border-b-2 border-primary/40 pb-1 mb-2 gold-text">
          Data Tanah
        </h3>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-0">
          <div className="sm:col-span-2">
            <DLItem label="Lokasi Tanah" value={p.lokasiTanah} />
          </div>
          <DLItem label="RT/RW" value={formatRtRw(p.tanahRt, p.tanahRw)} />
          <DLItem
            label="Luas Tanah"
            value={p.luasTanah != null && p.luasTanah !== "" ? `${p.luasTanah} m²` : null}
          />
          <DLItem label="Batas Utara" value={p.batasUtara} />
          <DLItem label="Batas Selatan" value={p.batasSelatan} />
          <DLItem label="Batas Timur" value={p.batasTimur} />
          <DLItem label="Batas Barat" value={p.batasBarat} />
          <div className="sm:col-span-2">
            <DLItem label="Status Penguasaan" value={p.statusPenguasaan} />
          </div>
        </dl>
      </section>

      {/* ===== Keperluan & Jenis Surat ===== */}
      <section className="print:break-inside-avoid">
        <h3 className="text-xs font-bold uppercase tracking-wider border-b-2 border-primary/40 pb-1 mb-2 gold-text">
          Keperluan &amp; Jenis Surat
        </h3>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-0">
          <DLItem label="Jenis Surat" value={p.jenisSurat?.nama} />
          <DLItem label="Prioritas" value={p.prioritas || "NORMAL"} />
          <div className="sm:col-span-2">
            <DLItem label="Keperluan" value={p.keperluan} />
          </div>
        </dl>
      </section>

      {/* ===== Catatan ===== */}
      {p.catatan && (
        <section className="print:break-inside-avoid">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b-2 border-primary/40 pb-1 mb-2 gold-text">
            Catatan
          </h3>
          <p className="text-sm leading-relaxed">{p.catatan}</p>
        </section>
      )}

      {/* ===== Signature Block ===== */}
      <section className="signature-block pt-4 sm:pt-6 print:break-inside-avoid">
        {/* Place + date line at top, right-aligned */}
        <div className="text-right text-sm mb-4 sm:mb-6">
          <p className="font-medium leading-tight">Kuala Pembuang, {todayDate()}</p>
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
                ( {p.pemohonNama} )
              </p>
            </div>
          </div>

          {/* Right: Petugas Penerima */}
          <div className="text-center text-sm">
            <p className="font-medium mb-0 leading-tight">Petugas Penerima,</p>
            <div className="border-t border-foreground/70 pt-1 mt-12 sm:mt-14">
              <p className="font-semibold text-xs sm:text-sm leading-tight">
                ( {p.creator?.name || "—"} )
              </p>
              {p.creator?.position && (
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  {p.creator.position}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Bottom note ===== */}
      <p className="text-[10px] sm:text-[11px] italic text-muted-foreground text-center pt-3 border-t border-primary/20 leading-relaxed print:break-inside-avoid">
        Tanda terima ini bukan bukti kepemilikan tanah. Simpan baik-baik untuk
        melacak status permohonan Anda melalui Nomor Register atau QR Code di atas.
      </p>
    </div>
  );
}

export default TandaTerima;
