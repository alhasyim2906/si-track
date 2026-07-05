import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

// PUT /api/permohonan/[id]/riwayat-tanah/[entryId] — update a land history entry
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["PETUGAS", "ADMIN"].includes(current.user.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  const { id, entryId } = await params;
  const body = await req.json();

  const existing = await db.riwayatTanah.findUnique({
    where: { id: entryId },
    select: { id: true, permohonanId: true, urutan: true },
  });
  if (!existing || existing.permohonanId !== id) {
    return NextResponse.json({ error: "Riwayat tanah tidak ditemukan" }, { status: 404 });
  }

  const data: any = {};
  if (body.urutan !== undefined) data.urutan = Number(body.urutan) || existing.urutan;
  if (body.tahun !== undefined) data.tahun = body.tahun?.toString().trim() || null;
  if (body.pemilikSebelumnya !== undefined) data.pemilikSebelumnya = body.pemilikSebelumnya?.toString().trim() || null;
  if (body.hubunganPemilik !== undefined) data.hubunganPemilik = body.hubunganPemilik?.toString().trim() || null;
  if (body.caraPerolehan !== undefined) data.caraPerolehan = body.caraPerolehan?.toString().trim() || null;
  if (body.noDokumen !== undefined) data.noDokumen = body.noDokumen?.toString().trim() || null;
  if (body.keterangan !== undefined) data.keterangan = body.keterangan?.toString().trim() || null;

  const updated = await db.riwayatTanah.update({ where: { id: entryId }, data });

  const permohonan = await db.permohonan.findUnique({
    where: { id },
    select: { nomorRegister: true },
  });
  await writeAudit(current.session, {
    aksi: "UPDATE",
    modul: "PERMOHONAN",
    entitasId: id,
    detail: `Memperbarui riwayat tanah #${existing.urutan} untuk permohonan ${permohonan?.nomorRegister || id}`,
  });

  return NextResponse.json({ entry: updated });
}

// DELETE /api/permohonan/[id]/riwayat-tanah/[entryId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["PETUGAS", "ADMIN"].includes(current.user.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  const { id, entryId } = await params;

  const existing = await db.riwayatTanah.findUnique({
    where: { id: entryId },
    select: { id: true, permohonanId: true, urutan: true },
  });
  if (!existing || existing.permohonanId !== id) {
    return NextResponse.json({ error: "Riwayat tanah tidak ditemukan" }, { status: 404 });
  }

  await db.riwayatTanah.delete({ where: { id: entryId } });

  const permohonan = await db.permohonan.findUnique({
    where: { id },
    select: { nomorRegister: true },
  });
  await writeAudit(current.session, {
    aksi: "DELETE",
    modul: "PERMOHONAN",
    entitasId: id,
    detail: `Menghapus riwayat tanah #${existing.urutan} untuk permohonan ${permohonan?.nomorRegister || id}`,
  });

  return NextResponse.json({ ok: true });
}
