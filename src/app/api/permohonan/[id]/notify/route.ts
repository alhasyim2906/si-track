import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { dispatchPermohonanNotification, type NotifyContext } from "@/lib/notify";
import { resolvePublicBaseUrl } from "@/lib/public-url";

/**
 * POST /api/permohonan/[id]/notify
 * Body: { force?: boolean }
 *
 * Manually re-dispatch email + WhatsApp notifications for a permohonan.
 * Uses the permohonan's current status to pick the right template:
 *   - REVISI → "kelengkapan dokumen" template
 *   - SELESAI → "surat selesai" template
 *   - other   → defaults to SELESAI template (since manual resend is usually
 *               used to remind the applicant the surat is ready)
 *
 * Auth: PETUGAS, ADMIN, or ATASAN (any logged-in staff).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["PETUGAS", "ADMIN", "ATASAN"].includes(current.user.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const force = body.force === true;

  const p = await db.permohonan.findUnique({
    where: { id },
    include: { jenisSurat: true },
  });
  if (!p) return NextResponse.json({ error: "Permohonan tidak ditemukan" }, { status: 404 });

  // Determine trigger template based on current status
  let triggerStatus: "REVISI" | "SELESAI";
  if (p.statusSaatIni === "REVISI") triggerStatus = "REVISI";
  else if (p.statusSaatIni === "SELESAI") triggerStatus = "SELESAI";
  else if (p.statusSaatIni === "DITOLAK") triggerStatus = "REVISI"; // treat DITOLAK as "needs attention" — uses revisi-like template
  else triggerStatus = "SELESAI"; // default fallback

  // Pull kelurahan settings
  const kelSettings = await db.settings.findMany({
    where: { key: { in: ["nama_kelurahan", "alamat_kelurahan", "telepon_kelurahan", "email_kelurahan"] } },
  });
  const kMap: Record<string, string> = {};
  for (const s of kelSettings) kMap[s.key] = s.value || "";

  const ctx: NotifyContext = {
    nomorRegister: p.nomorRegister,
    pemohonNama: p.pemohonNama,
    pemohonHp: p.pemohonHp,
    pemohonEmail: p.pemohonEmail,
    statusNama: p.statusSaatIni,
    catatan: p.catatan,
    alasanDitolak: p.alasanDitolak,
    jenisSuratNama: p.jenisSurat?.nama,
    kelurahanNama: kMap.nama_kelurahan,
    kelurahanAlamat: kMap.alamat_kelurahan,
    kelurahanTelepon: kMap.telepon_kelurahan,
    kelurahanEmail: kMap.email_kelurahan,
    appUrl: await resolvePublicBaseUrl(new URL(req.url).origin),
  };

  const results = await dispatchPermohonanNotification(id, triggerStatus, ctx, current.user.id, {
    force,
  });

  await writeAudit(current.session, {
    aksi: "NOTIFY_RESEND",
    modul: "PERMOHONAN",
    entitasId: id,
    detail: `Kirim ulang notifikasi ${triggerStatus} untuk ${p.nomorRegister} → ${results
      .map((r) => `${r.channel.toUpperCase()}:${r.success ? "OK" : "FAIL"}`)
      .join(" | ")}`,
  });

  return NextResponse.json({
    ok: true,
    triggerStatus,
    results,
  });
}
