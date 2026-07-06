import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { STATUS_BY_KODE } from "@/lib/constants";
import { generateTandaTerimaPdf, generateQrPngBuffer } from "@/lib/tanda-terima-pdf";
import { buildTrackingUrl, resolvePublicBaseUrl } from "@/lib/public-url";

/**
 * GET /api/permohonan/[id]/tanda-terima/pdf
 *
 * Generate and stream the Tanda Terima Permohonan as a PDF file.
 *
 * Auth: any authenticated user (PETUGAS / ADMIN / ATASAN). The PDF contains
 * the pemohon's personal info, so we don't expose it publicly.
 *
 * Response: application/pdf binary stream with Content-Disposition:
 *   inline (so the browser preview opens) and a suggested filename like
 *   "Tanda-Terima-KPII-TNH-2026-XK7M2P9Q.pdf".
 *
 * The PDF is generated on-the-fly from the live permohonan data, so it always
 * reflects the current state (status, jenis surat, etc.). No caching — each
 * request regenerates the PDF (~30-80ms for a typical receipt).
 *
 * Also used by email/WhatsApp dispatch as the source of the PDF buffer.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const p = await db.permohonan.findUnique({
    where: { id },
    include: {
      jenisSurat: { select: { nama: true, kode: true } },
      creator: { select: { name: true, position: true } },
    },
  });
  if (!p) {
    return NextResponse.json({ error: "Permohonan tidak ditemukan" }, { status: 404 });
  }

  // Build QR code PNG (encodes the public tracking URL).
  const requestOrigin = new URL(req.url).origin;
  const baseUrl = await resolvePublicBaseUrl(requestOrigin);
  const trackUrl = `${baseUrl}/?track=${encodeURIComponent(p.nomorRegister)}`;
  const qrPng = await generateQrPngBuffer(trackUrl, 240);

  // Fetch kelurahan settings for letterhead.
  const settings = await db.settings.findMany({
    where: {
      key: {
        in: [
          "nama_kelurahan",
          "alamat_kelurahan",
          "telepon_kelurahan",
          "email_kelurahan",
        ],
      },
    },
  });
  const settingsMap: Record<string, string> = {};
  for (const s of settings) settingsMap[s.key] = s.value || "";

  try {
    const pdfBuffer = await generateTandaTerimaPdf(
      {
        nomorRegister: p.nomorRegister,
        statusSaatIni: p.statusSaatIni,
        statusNama: STATUS_BY_KODE[p.statusSaatIni]?.nama || p.statusSaatIni,
        prioritas: p.prioritas,
        keperluan: p.keperluan,
        catatan: p.catatan,
        createdAt: p.createdAt,
        jenisSurat: {
          nama: p.jenisSurat.nama,
          kode: p.jenisSurat.kode || undefined,
        },
        creator: p.creator
          ? { name: p.creator.name, position: p.creator.position }
          : null,
        pemohonNik: p.pemohonNik,
        pemohonNama: p.pemohonNama,
        pemohonTempatLahir: p.pemohonTempatLahir,
        pemohonTanggalLahir: p.pemohonTanggalLahir,
        pemohonAlamat: p.pemohonAlamat,
        pemohonRt: p.pemohonRt,
        pemohonRw: p.pemohonRw,
        pemohonHp: p.pemohonHp,
        pemohonEmail: p.pemohonEmail,
        lokasiTanah: p.lokasiTanah,
        tanahRt: p.tanahRt,
        tanahRw: p.tanahRw,
        luasTanah: p.luasTanah,
        batasUtara: p.batasUtara,
        batasSelatan: p.batasSelatan,
        batasTimur: p.batasTimur,
        batasBarat: p.batasBarat,
        statusPenguasaan: p.statusPenguasaan,
      },
      {
        qrPngBuffer: qrPng,
        kelurahan: {
          nama: settingsMap.nama_kelurahan || undefined,
          alamat: settingsMap.alamat_kelurahan || undefined,
          telepon: settingsMap.telepon_kelurahan || undefined,
          email: settingsMap.email_kelurahan || undefined,
        },
      }
    );

    const filename = `Tanda-Terima-${p.nomorRegister}.pdf`;
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "no-store, no-cache, must-revalidate",
        // Allow the PDF to be embedded in an <iframe> or <object> for preview.
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e: any) {
    console.error("[tanda-terima/pdf] generation error:", e);
    return NextResponse.json(
      { error: "Gagal membuat PDF tanda terima", detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}
