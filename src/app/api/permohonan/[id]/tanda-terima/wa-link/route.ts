import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { STATUS_BY_KODE } from "@/lib/constants";
import {
  renderTemplate,
  buildWhatsAppDeepLink,
} from "@/lib/notify";
import { resolvePublicBaseUrl } from "@/lib/public-url";

/**
 * GET /api/permohonan/[id]/tanda-terima/wa-link
 *
 * Returns a `https://wa.me/{phone}?text={message}` deep link that opens
 * WhatsApp Web/App with the tanda terima message pre-filled. The petugas
 * can click this link on their phone/desktop to manually send the message
 * (and forward the PDF file separately) — useful when:
 *
 *   1. Fonnte API token is not configured (no paid WA gateway).
 *   2. The pemohon's phone is not registered with Fonnte (sandbox mode).
 *   3. The petugas wants to personalize the message before sending.
 *
 * Auth: PETUGAS / ADMIN. The link contains the pemohon's personal info.
 *
 * Response:
 *   200 { ok, link, phone, message } — link is "" if phone is invalid.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["PETUGAS", "ADMIN"].includes(current.user.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;
  const p = await db.permohonan.findUnique({
    where: { id },
    include: { jenisSurat: { select: { nama: true } } },
  });
  if (!p) {
    return NextResponse.json({ error: "Permohonan tidak ditemukan" }, { status: 404 });
  }

  // Build the WhatsApp message from the tanda-terima template (or default).
  // We load ALL settings (not just notify_*) because the templates reference
  // {kelurahan_nama}, {kelurahan_alamat}, etc. which live under the
  // `nama_kelurahan`, `alamat_kelurahan` keys (no notify_ prefix).
  const settingsRows = await db.settings.findMany();
  const settings: Record<string, string> = {};
  for (const s of settingsRows) settings[s.key] = s.value || "";

  const requestOrigin = new URL(req.url).origin;
  const baseUrl = await resolvePublicBaseUrl(requestOrigin);
  const trackUrl = `${baseUrl}/?track=${encodeURIComponent(p.nomorRegister)}`;

  const DEFAULT_WA = `*{kelurahan_nama}*\n\nYth. {pemohon_nama},\n\nPermohonan surat tanah Anda telah kami terima & daftarkan.\n\n*Nomor Register:* {nomor_register}\n*Jenis Surat:* {jenis_surat}\n*Tanggal:* {tanggal}\n\n📄 Tanda terima resmi terlampir (PDF).\n\nLacak status: {app_url}\n\nSimpan nomor register untuk referensi. Terima kasih. 🙏`;

  const waTemplate = settings.notify_tpl_tanda_terima_wa || DEFAULT_WA;
  const waBody = renderTemplate(waTemplate, {
    nomorRegister: p.nomorRegister,
    pemohonNama: p.pemohonNama,
    pemohonHp: p.pemohonHp,
    pemohonEmail: p.pemohonEmail,
    statusNama: STATUS_BY_KODE[p.statusSaatIni]?.nama || p.statusSaatIni,
    jenisSuratNama: p.jenisSurat.nama,
    kelurahanNama: settings.nama_kelurahan,
    kelurahanAlamat: settings.alamat_kelurahan,
    kelurahanTelepon: settings.telepon_kelurahan,
    kelurahanEmail: settings.email_kelurahan,
    appUrl: trackUrl,
  });

  const link = p.pemohonHp
    ? buildWhatsAppDeepLink(p.pemohonHp, waBody)
    : "";

  return NextResponse.json({
    ok: true,
    link,
    phone: p.pemohonHp,
    message: waBody,
    trackUrl,
    pdfHint:
      "Setelah WhatsApp terbuka, lampirkan file PDF tanda terima secara manual (gunakan tombol 'Unduh PDF' di halaman detail untuk mengunduh file).",
  });
}
