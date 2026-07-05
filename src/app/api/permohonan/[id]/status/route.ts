import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { STATUS_BY_KODE, nextStatus, NOTIF_TEMPLATES } from "@/lib/constants";

// POST /api/permohonan/[id]/status — advance / change status
// body: { statusKode?: string, catatan?: string, alasanDitolak?: string }
// - If statusKode omitted, advance to next stage automatically.
// - "REVISI" and "DITOLAK" are special status moves (any staff for REVISI; admin/petugas for DITOLAK with reason).
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

  const permohonan = await db.permohonan.findUnique({ where: { id }, include: { jenisSurat: true } });
  if (!permohonan) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  // Determine target status
  let targetKode = body.statusKode as string | undefined;
  const catatan = body.catatan as string | undefined;

  // If explicitly approving (TTD_LURAH / TTD_CAMAT) — only ATASAN can sign LURAH; CAMAT also ATASAN role for demo
  if (targetKode === "TTD_CAMAT" && permohonan.statusSaatIni === "TTD_LURAH") {
    // approve lurah -> camat (if needs camat)
    if (current.user.role !== "ATASAN" && current.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Lurah/Atasan yang dapat menandatangani" }, { status: 403 });
    }
  }
  if (targetKode === "SELESAI" && permohonan.statusSaatIni === "TTD_LURAH") {
    // lurah signs -> complete (when no camat needed)
    if (current.user.role !== "ATASAN" && current.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Lurah/Atasan yang dapat menyelesaikan" }, { status: 403 });
    }
  }

  // If no explicit target, advance to next stage
  if (!targetKode) {
    targetKode = nextStatus(permohonan.statusSaatIni, {
      butuhPengukuran: permohonan.jenisSurat.butuhPengukuran,
      butuhTtdCamat: permohonan.jenisSurat.butuhTtdCamat,
    }) || undefined;
  }
  if (!targetKode) {
    return NextResponse.json({ error: "Tidak ada tahap berikutnya" }, { status: 400 });
  }

  const def = STATUS_BY_KODE[targetKode];
  if (!def) return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });

  // Handle DITOLAK
  if (targetKode === "DITOLAK") {
    if (!body.alasanDitolak) {
      return NextResponse.json({ error: "Alasan penolakan wajib diisi" }, { status: 400 });
    }
  }

  const updateData: any = {
    statusSaatIni: targetKode,
    catatan: catatan || null,
    updatedBy: current.user.id,
  };
  if (targetKode === "DITOLAK") updateData.alasanDitolak = body.alasanDitolak;
  if (targetKode === "SELESAI") updateData.tanggalSelesai = new Date();

  const updated = await db.permohonan.update({ where: { id }, data: updateData });

  await db.riwayatProses.create({
    data: {
      permohonanId: id,
      statusKode: targetKode,
      statusNama: def.nama,
      catatan: targetKode === "DITOLAK" ? body.alasanDitolak : catatan || null,
      petugasId: current.user.id,
    },
  });

  // Notifications
  let notif: { judul: string; pesan: string; tipe: string } | null = null;
  if (targetKode === "PENGUKURAN") notif = NOTIF_TEMPLATES.JADWAL_PENGUKURAN(updated.nomorRegister);
  else if (targetKode === "TTD_LURAH") notif = NOTIF_TEMPLATES.TTD_LURAH(updated.nomorRegister);
  else if (targetKode === "TTD_CAMAT") notif = NOTIF_TEMPLATES.TTD_CAMAT(updated.nomorRegister);
  else if (targetKode === "SELESAI") notif = NOTIF_TEMPLATES.SELESAI(updated.nomorRegister, updated.pemohonNama);
  else if (targetKode === "DITOLAK") notif = NOTIF_TEMPLATES.DITOLAK(updated.nomorRegister, body.alasanDitolak);
  else if (targetKode === "REVISI") notif = NOTIF_TEMPLATES.BERKAS_KURANG(updated.nomorRegister, catatan || "Lengkapi dokumen");

  if (notif) {
    await db.notifikasi.create({ data: { permohonanId: id, judul: notif.judul, pesan: notif.pesan, tipe: notif.tipe } });
  }

  await writeAudit(current.session, {
    aksi: targetKode === "DITOLAK" ? "STATUS_CHANGE" : targetKode.startsWith("TTD") || targetKode === "SELESAI" ? "APPROVE" : "STATUS_CHANGE",
    modul: "PERMOHONAN",
    entitasId: id,
    detail: `Ubah status ${updated.nomorRegister}: ${permohonan.statusSaatIni} -> ${targetKode}${catatan ? ` (${catatan})` : ""}`,
  });

  return NextResponse.json({
    ok: true,
    statusSaatIni: targetKode,
    statusNama: def.nama,
    statusWarna: def.warna,
  });
}
