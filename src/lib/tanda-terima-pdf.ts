/**
 * Server-side PDF generator for Tanda Terima Permohonan.
 *
 * Mirrors the visual layout of `src/components/app/shared/TandaTerima.tsx`
 * (the on-screen printable receipt) so the PDF looks consistent with what
 * the petugas sees in the browser when they click "Cetak Tanda Terima".
 *
 * Uses `pdfkit` — a pure-JS PDF library that does NOT spawn a browser.
 * This is critical for our 4GB-RAM sandbox (Puppeteer would OOM the dev
 * server). pdfkit renders ~10× faster and uses ~50MB peak.
 *
 * Output: A4 portrait, 595×842 pt, with the same gold accent color (#d4af37)
 * and the institutional letterhead (PEMERINTAH KABUPATEN SERUYAN /
 * KELURAHAN KUALA PEMBUANG II).
 */

import PDFDocument from "pdfkit";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export interface TandaTerimaPdfData {
  nomorRegister: string;
  statusSaatIni: string;
  statusNama?: string;
  prioritas: string;
  keperluan: string | null;
  catatan: string | null;
  createdAt: string | Date;
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
  pemohonEmail?: string | null;
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

export interface TandaTerimaPdfOptions {
  /** Optional QR code image (PNG buffer or base64 data URL) to embed top-right. */
  qrPngBuffer?: Buffer | null;
  /** Optional kelurahan settings for letterhead (defaults to KPII if omitted). */
  kelurahan?: {
    nama?: string;
    alamat?: string;
    telepon?: string;
    email?: string;
  };
  /** Optional logo PNG buffer (top-left of letterhead). */
  logoPngBuffer?: Buffer | null;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const GOLD = "#d4af37";
const GOLD_DARK = "#b8941f";
const NAVY = "#0b1220";
const NAVY_MUTED = "#475569";
const BORDER = "#cbd5e1";

function fmtDate(d?: string | Date | null): string {
  if (!d) return "-";
  try {
    const dt = typeof d === "string" ? new Date(d) : d;
    return dt.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(d);
  }
}

function fmtToday(): string {
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

function fmtTempatTanggalLahir(
  tempat: string | null,
  tgl: string | null
): string {
  if (!tempat && !tgl) return "-";
  if (!tempat) return fmtDate(tgl);
  if (!tgl) return tempat;
  return `${tempat}, ${fmtDate(tgl)}`;
}

function fmtRtRw(rt: string | null, rw: string | null): string {
  const parts = [rt, rw].filter((v) => v != null && v !== "");
  if (parts.length === 0) return "-";
  return parts.join(" / ");
}

function fmtLuas(v: string | number | null): string {
  if (v == null || v === "") return "-";
  return `${v} m²`;
}

/* ------------------------------------------------------------------ */
/* Main generator                                                      */
/* ------------------------------------------------------------------ */
/**
 * Build a Tanda Terima PDF as a Node Buffer.
 *
 * Usage:
 *   const buf = await generateTandaTerimaPdf(permohonan, { qrPngBuffer });
 *   // buf is a complete PDF file ready to be attached to an email,
 *   // uploaded to a WhatsApp gateway, or returned as a download.
 */
export function generateTandaTerimaPdf(
  data: TandaTerimaPdfData,
  opts: TandaTerimaPdfOptions = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // A4 portrait: 595.28 × 841.89 pt
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Tanda Terima — ${data.nomorRegister}`,
          Author: "SI-TRACK TANAH",
          Subject: "Tanda Terima Permohonan Pendaftaran Surat Tanah",
          Keywords: "tanda terima, permohonan, surat tanah, kelurahan",
          Creator: "SI-TRACK TANAH",
          Producer: "SI-TRACK TANAH (pdfkit)",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (e: any) => reject(e));

      const kel = opts.kelurahan || {};
      const kelNama = kel.nama || "KELURAHAN KUALA PEMBUANG II";
      const kelAlamat =
        kel.alamat ||
        "Jl. Iskandar No. 1, Kuala Pembuang, Seruyan, Kalimantan Tengah 74214";
      const kelTelp = kel.telepon || "(0532) 777-0000";
      const kelEmail = kel.email || "kelurahan.kpii@seruyankab.go.id";

      const pageWidth = doc.page.width;
      const margin = 50;
      const contentWidth = pageWidth - margin * 2;

      /* ===== 1. Letterhead (Kop Surat) ===== */
      const logoSize = 56;
      const logoY = 50;
      if (opts.logoPngBuffer) {
        try {
          doc.image(opts.logoPngBuffer, margin, logoY, {
            fit: [logoSize, logoSize],
          });
        } catch {
          // ignore broken logo
        }
      } else {
        // Draw a placeholder gold square with "K" letter
        doc.save();
        doc.rect(margin, logoY, logoSize, logoSize).lineWidth(1.5).strokeColor(GOLD).fillColor("#fefce8").fillAndStroke();
        doc.fillColor(GOLD_DARK).fontSize(28).font("Helvetica-Bold");
        doc.text("K", margin, logoY + 12, { width: logoSize, align: "center" });
        doc.restore();
      }

      const textX = margin + logoSize + 12;
      const textW = contentWidth - logoSize - 12;

      doc.fontSize(9).fillColor(NAVY).font("Helvetica-Bold");
      doc.text("PEMERINTAH KABUPATEN SERUYAN", textX, logoY + 2, {
        width: textW,
        align: "center",
      });
      doc.fontSize(14).fillColor(GOLD_DARK).font("Helvetica-Bold");
      doc.text(kelNama, textX, logoY + 16, {
        width: textW,
        align: "center",
      });
      doc.fontSize(8).fillColor(NAVY_MUTED).font("Helvetica");
      doc.text(
        `${kelAlamat}\nTelp. ${kelTelp} • Email: ${kelEmail}`,
        textX,
        logoY + 36,
        { width: textW, align: "center", lineGap: 1 }
      );

      /* ===== 2. Gold double rule ===== */
      let y = logoY + logoSize + 8;
      doc.save();
      doc.lineWidth(3).strokeColor(GOLD);
      doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
      doc.lineWidth(0.7).strokeColor(GOLD_DARK);
      doc.moveTo(margin, y + 4).lineTo(pageWidth - margin, y + 4).stroke();
      doc.restore();
      y += 14;

      /* ===== 3. Title ===== */
      doc.fontSize(16).fillColor(NAVY).font("Helvetica-Bold");
      doc.text("TANDA TERIMA PERMOHONAN", margin, y, {
        width: contentWidth,
        align: "center",
      });
      y += 20;
      doc.fontSize(8).fillColor(NAVY_MUTED).font("Helvetica");
      doc.text("Pendaftaran Surat Tanah", margin, y, {
        width: contentWidth,
        align: "center",
      });
      y += 18;

      /* ===== 4. Register box + QR code ===== */
      const boxH = 90;
      const boxW = contentWidth - 110; // leave space for QR on right
      const qrSize = 90;
      const qrX = pageWidth - margin - qrSize;
      const boxX = margin;
      const boxY = y;

      // Box border (gold)
      doc.save();
      doc.lineWidth(1.5).strokeColor(GOLD);
      doc.roundedRect(boxX, boxY, boxW, boxH, 6).stroke();
      // Light gold fill
      doc.fillColor("#fefce8").opacity(0.5);
      doc.roundedRect(boxX, boxY, boxW, boxH, 6).fill();
      doc.opacity(1);
      doc.restore();

      // Register label + value
      doc.fontSize(8).fillColor(NAVY_MUTED).font("Helvetica");
      doc.text("NOMOR REGISTER / TANDA TERIMA", boxX + 12, boxY + 10, {
        width: boxW - 24,
      });
      doc.fontSize(20).fillColor(GOLD_DARK).font("Helvetica-Bold");
      doc.text(data.nomorRegister, boxX + 12, boxY + 22, {
        width: boxW - 24,
      });

      // Two-column metadata inside the box
      const colY = boxY + 56;
      const colW = (boxW - 24) / 2;
      doc.fontSize(7).fillColor(NAVY_MUTED).font("Helvetica");
      doc.text("DITERIMA TANGGAL", boxX + 12, colY, { width: colW });
      doc.text("STATUS SAAT INI", boxX + 12 + colW, colY, { width: colW });
      doc.fontSize(10).fillColor(NAVY).font("Helvetica-Bold");
      doc.text(fmtDate(data.createdAt), boxX + 12, colY + 12, { width: colW });
      doc.text(
        data.statusNama || data.statusSaatIni,
        boxX + 12 + colW,
        colY + 12,
        { width: colW }
      );

      // QR code (if provided)
      if (opts.qrPngBuffer) {
        try {
          doc.image(opts.qrPngBuffer, qrX, boxY, {
            fit: [qrSize, qrSize],
          });
          doc.fontSize(7).fillColor(NAVY_MUTED).font("Helvetica-Oblique");
          doc.text("Scan untuk lacak status", qrX, boxY + qrSize + 2, {
            width: qrSize,
            align: "center",
          });
        } catch {
          // ignore
        }
      }

      y = boxY + boxH + 14;

      /* ===== 5. Section helper ===== */
      const sectionTitle = (title: string) => {
        doc.save();
        doc.lineWidth(1).strokeColor(GOLD);
        doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
        doc.restore();
        y += 5;
        doc.fontSize(9).fillColor(GOLD_DARK).font("Helvetica-Bold");
        doc.text(title.toUpperCase(), margin, y, { width: contentWidth });
        y += 14;
      };

      const rowDef = (label: string, value: string, x: number, w: number) => {
        doc.fontSize(7).fillColor(NAVY_MUTED).font("Helvetica");
        doc.text(label.toUpperCase(), x, y, { width: w });
        doc.fontSize(9).fillColor(NAVY).font("Helvetica-Bold");
        doc.text(value || "-", x, y + 11, { width: w });
      };

      const rowAdvance = (dy = 28) => {
        y += dy;
      };

      /* ===== 6. Data Pemohon ===== */
      sectionTitle("Data Pemohon");
      const col2 = margin + contentWidth / 2;
      const halfW = contentWidth / 2 - 6;
      rowDef("NIK", data.pemohonNik, margin, halfW);
      rowDef("Nama Lengkap", data.pemohonNama, col2, halfW);
      rowAdvance();
      rowDef(
        "Tempat/Tgl Lahir",
        fmtTempatTanggalLahir(
          data.pemohonTempatLahir,
          data.pemohonTanggalLahir
        ),
        margin,
        contentWidth
      );
      rowAdvance();
      rowDef("Alamat", data.pemohonAlamat || "-", margin, contentWidth);
      rowAdvance();
      rowDef("RT/RW", fmtRtRw(data.pemohonRt, data.pemohonRw), margin, halfW);
      rowDef("No. HP", data.pemohonHp || "-", col2, halfW);
      rowAdvance();

      /* ===== 7. Data Tanah ===== */
      sectionTitle("Data Tanah");
      rowDef("Lokasi Tanah", data.lokasiTanah || "-", margin, contentWidth);
      rowAdvance();
      rowDef(
        "RT/RW",
        fmtRtRw(data.tanahRt, data.tanahRw),
        margin,
        halfW
      );
      rowDef("Luas Tanah", fmtLuas(data.luasTanah), col2, halfW);
      rowAdvance();
      rowDef("Batas Utara", data.batasUtara || "-", margin, halfW);
      rowDef("Batas Selatan", data.batasSelatan || "-", col2, halfW);
      rowAdvance();
      rowDef("Batas Timur", data.batasTimur || "-", margin, halfW);
      rowDef("Batas Barat", data.batasBarat || "-", col2, halfW);
      rowAdvance();
      rowDef(
        "Status Penguasaan",
        data.statusPenguasaan || "-",
        margin,
        contentWidth
      );
      rowAdvance();

      /* ===== 8. Keperluan & Jenis Surat ===== */
      sectionTitle("Keperluan & Jenis Surat");
      rowDef("Jenis Surat", data.jenisSurat?.nama || "-", margin, halfW);
      rowDef("Prioritas", data.prioritas || "NORMAL", col2, halfW);
      rowAdvance();
      rowDef("Keperluan", data.keperluan || "-", margin, contentWidth);
      rowAdvance();

      /* ===== 9. Catatan (optional) ===== */
      if (data.catatan) {
        sectionTitle("Catatan");
        doc.fontSize(9).fillColor(NAVY).font("Helvetica");
        const catatanHeight = doc.heightOfString(data.catatan, {
          width: contentWidth,
        });
        doc.text(data.catatan, margin, y, {
          width: contentWidth,
          lineGap: 2,
        });
        y += catatanHeight + 10;
      }

      /* ===== 10. Signature Block ===== */
      y += 14;
      doc.fontSize(9).fillColor(NAVY).font("Helvetica");
      doc.text(`Kuala Pembuang, ${fmtToday()}`, margin, y, {
        width: contentWidth,
        align: "right",
      });
      y += 14;
      doc.fontSize(8).fillColor(NAVY_MUTED).font("Helvetica-Oblique");
      doc.text("Mengetahui,", margin, y, {
        width: contentWidth,
        align: "center",
      });
      y += 11;
      doc.fontSize(9).fillColor(NAVY).font("Helvetica-Bold");
      doc.text("LURAH KUALA PEMBUANG II", margin, y, {
        width: contentWidth,
        align: "center",
      });
      y += 36; // space for wet signature

      // Two-column signatures
      const sigW = contentWidth / 2 - 12;
      const sig2X = margin + contentWidth / 2 + 12;

      // Left: Pemohon
      doc.fontSize(9).fillColor(NAVY).font("Helvetica");
      doc.text("Pemohon,", margin, y, { width: sigW, align: "center" });
      doc.save();
      doc.lineWidth(0.5).strokeColor(NAVY_MUTED);
      doc.moveTo(margin + 20, y + 40).lineTo(margin + sigW - 20, y + 40).stroke();
      doc.restore();
      doc.fontSize(9).fillColor(NAVY).font("Helvetica-Bold");
      doc.text(`( ${data.pemohonNama} )`, margin, y + 42, {
        width: sigW,
        align: "center",
      });

      // Right: Petugas Penerima
      doc.fontSize(9).fillColor(NAVY).font("Helvetica");
      doc.text("Petugas Penerima,", sig2X, y, { width: sigW, align: "center" });
      doc.save();
      doc.lineWidth(0.5).strokeColor(NAVY_MUTED);
      doc.moveTo(sig2X + 20, y + 40).lineTo(sig2X + sigW - 20, y + 40).stroke();
      doc.restore();
      doc.fontSize(9).fillColor(NAVY).font("Helvetica-Bold");
      doc.text(`( ${data.creator?.name || "—"} )`, sig2X, y + 42, {
        width: sigW,
        align: "center",
      });
      if (data.creator?.position) {
        doc
          .fontSize(7)
          .fillColor(NAVY_MUTED)
          .font("Helvetica-Oblique");
        doc.text(data.creator.position, sig2X, y + 56, {
          width: sigW,
          align: "center",
        });
      }
      y += 70;

      /* ===== 11. Bottom note ===== */
      y += 8;
      doc.save();
      doc.lineWidth(0.5).strokeColor(GOLD);
      doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke();
      doc.restore();
      y += 6;
      doc
        .fontSize(7)
        .fillColor(NAVY_MUTED)
        .font("Helvetica-Oblique");
      doc.text(
        "Tanda terima ini diterbitkan secara sah oleh sistem SI-TRACK TANAH. Tanda terima ini bukan bukti kepemilikan tanah. Simpan baik-baik untuk melacak status permohonan Anda melalui Nomor Register atau QR Code di atas.",
        margin,
        y,
        { width: contentWidth, align: "center", lineGap: 1 }
      );

      /* ===== 12. Footer (page numbers / issuance stamp) ===== */
      doc.fontSize(7).fillColor(NAVY_MUTED).font("Helvetica");
      doc.text(
        `Diterbitkan oleh SI-TRACK TANAH pada ${new Date().toLocaleString("id-ID")}`,
        margin,
        doc.page.height - 30,
        { width: contentWidth, align: "center" }
      );

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

/* ------------------------------------------------------------------ */
/* QR code helper — generates a PNG Buffer containing the QR image     */
/* ------------------------------------------------------------------ */
/**
 * Generate a PNG Buffer containing a QR code that encodes the public
 * tracking URL for the given register number.
 *
 * Used as the `qrPngBuffer` parameter of `generateTandaTerimaPdf`.
 * Returns null if QR generation fails (the PDF will still render without
 * the QR image — the rest of the layout is not affected).
 */
export async function generateQrPngBuffer(
  text: string,
  size = 240
): Promise<Buffer | null> {
  try {
    const QRCode = (await import("qrcode")).default;
    const buf: Buffer = await QRCode.toBuffer(text, {
      type: "png",
      margin: 1,
      width: size,
      color: { dark: "#0b1220", light: "#ffffff" },
      errorCorrectionLevel: "M",
    });
    return buf;
  } catch (e) {
    console.error("[tanda-terima-pdf] QR generation failed:", e);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Public URL helper (mirrors src/lib/public-url.ts but standalone)    */
/* ------------------------------------------------------------------ */
export async function resolvePublicBaseUrl(db?: {
  settings?: { findUnique: (args: any) => Promise<{ value: string | null } | null> };
}): Promise<string> {
  // 1. DB setting (if db passed)
  if (db?.settings) {
    try {
      const s = await db.settings.findUnique({ where: { key: "public_base_url" } });
      if (s?.value && s.value.trim()) return s.value.trim().replace(/\/$/, "");
    } catch {
      // ignore
    }
  }
  // 2. Env
  if (process.env.PUBLIC_BASE_URL) {
    return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  }
  // 3. Fallback (localhost — used for dev only, QR won't work on phones)
  return "http://localhost:3000";
}
