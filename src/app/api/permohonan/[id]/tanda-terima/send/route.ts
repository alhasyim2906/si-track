import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { STATUS_BY_KODE } from "@/lib/constants";
import { generateTandaTerimaPdf, generateQrPngBuffer } from "@/lib/tanda-terima-pdf";
import { dispatchTandaTerimaNotification } from "@/lib/notify";
import { buildTrackingUrl, resolvePublicBaseUrl } from "@/lib/public-url";

/**
 * POST /api/permohonan/[id]/tanda-terima/send
 *
 * Manually (re-)send the Tanda Terima Permohonan to the pemohon via Email
 * (with PDF attachment) and WhatsApp (with PDF link or text-only fallback).
 *
 * Auth: PETUGAS / ADMIN. ATASAN is read-only.
 *
 * Request body (all optional):
 *   { force?: boolean } — bypass notify_tanda_terima_auto setting. Default true
 *                          for manual resend (so admins can always force-send).
 *
 * Response:
 *   200 { ok, results: [{ channel, success, error?, recipient? }] }
 *   401 / 403 / 404 on errors.
 *
 * The same logic runs automatically on permohonan creation (POST /api/permohonan).
 * This endpoint exists so the petugas can re-send the receipt if the pemohon
 * lost the original email/WA, or if the auto-send failed (e.g., Fonnte was
 * down at registration time).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["PETUGAS", "ADMIN"].includes(current.user.role)) {
    return NextResponse.json(
      { error: "Akses ditolak — hanya Petugas/Admin yang dapat mengirim tanda terima" },
      { status: 403 }
    );
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

  // Parse body — `force` defaults to true for manual resend.
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine
  }
  const force = body.force !== false; // default true

  // Pre-flight: warn if neither email nor phone is available.
  if (!p.pemohonEmail && !p.pemohonHp) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Pemohon tidak memiliki alamat email maupun nomor HP. Lengkapi data pemohon terlebih dahulu.",
      },
      { status: 400 }
    );
  }

  try {
    // Build QR code PNG (encodes the public tracking URL).
    const requestOrigin = new URL(req.url).origin;
    const baseUrl = await resolvePublicBaseUrl(requestOrigin);
    const trackUrl = `${baseUrl}/?track=${encodeURIComponent(p.nomorRegister)}`;
    const qrPng = await generateQrPngBuffer(trackUrl, 240);

    // Fetch kelurahan settings for letterhead AND notify templates/credentials.
    const settings = await db.settings.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) settingsMap[s.key] = s.value || "";

    // Generate the PDF buffer (kept in memory — never written to disk).
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

    const pdfFilename = `Tanda-Terima-${p.nomorRegister}.pdf`;

    // For WhatsApp: we can only attach a file via Fonnte if there's a public URL
    // where Fonnte's servers can fetch the PDF. We expose the PDF at:
    //   {public_base_url}/api/permohonan/[id]/tanda-terima/pdf
    // BUT this endpoint requires auth (NextAuth session cookie) — Fonnte's
    // servers don't have a session, so they'd get 401.
    //
    // Two options:
    //   A) Generate a one-time signed download URL (e.g., /api/public/tanda-terima/{token})
    //      that doesn't require session auth. Future enhancement.
    //   B) For now, send WhatsApp text-only with a link to the public tracking
    //      page (`{app_url}/?track=...`). Pemohon can click "Unduh Tanda Terima"
    //      on the tracking page to get the PDF.
    //
    // We use option B for now — it's simpler and doesn't require a public
    // PDF endpoint. The email channel carries the actual PDF attachment.
    const pdfPublicUrl: string | undefined = undefined; // see comment above

    // Dispatch — fires email + WhatsApp in parallel, returns per-channel result.
    const results = await dispatchTandaTerimaNotification(
      p.id,
      {
        nomorRegister: p.nomorRegister,
        pemohonNama: p.pemohonNama,
        pemohonHp: p.pemohonHp,
        pemohonEmail: p.pemohonEmail,
        statusNama: STATUS_BY_KODE[p.statusSaatIni]?.nama || p.statusSaatIni,
        jenisSuratNama: p.jenisSurat.nama,
        kelurahanNama: settingsMap.nama_kelurahan,
        kelurahanAlamat: settingsMap.alamat_kelurahan,
        kelurahanTelepon: settingsMap.telepon_kelurahan,
        kelurahanEmail: settingsMap.email_kelurahan,
        appUrl: trackUrl, // tracking URL for the pemohon
        pdfBuffer,
        pdfFilename,
        pdfPublicUrl,
      },
      current.user.id,
      { force }
    );

    // Audit log entry — also recorded inside dispatchTandaTerimaNotification,
    // but we add a higher-level "manual send" entry here for clarity.
    await writeAudit(current.session, {
      aksi: "TANDA_TERIMA_SEND",
      modul: "PERMOHONAN",
      entitasId: p.id,
      detail: `Mengirim ulang tanda terima ${p.nomorRegister} via ${results.length} channel — ${results
        .map((r) => `${r.channel.toUpperCase()}:${r.success ? "OK" : "FAIL"}`)
        .join(", ")}`,
    });

    return NextResponse.json({
      ok: true,
      results,
      permohonanId: p.id,
      nomorRegister: p.nomorRegister,
    });
  } catch (e: any) {
    console.error("[tanda-terima/send] error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: "Gagal mengirim tanda terima",
        detail: e?.message || String(e),
      },
      { status: 500 }
    );
  }
}
