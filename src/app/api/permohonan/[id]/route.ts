import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { STATUS_BY_KODE } from "@/lib/constants";

// GET /api/permohonan/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const p = await db.permohonan.findUnique({
    where: { id },
    include: {
      jenisSurat: true,
      creator: { select: { id: true, name: true, position: true } },
      dokumen: { orderBy: { createdAt: "desc" } },
      riwayat: { orderBy: { createdAt: "asc" }, include: { petugas: { select: { id: true, name: true, position: true } } } },
    },
  });
  if (!p) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  return NextResponse.json({
    ...p,
    statusNama: STATUS_BY_KODE[p.statusSaatIni]?.nama || p.statusSaatIni,
    statusWarna: STATUS_BY_KODE[p.statusSaatIni]?.warna || "#d4af37",
    statusKeterangan: STATUS_BY_KODE[p.statusSaatIni]?.keterangan,
  });
}

// PUT /api/permohonan/[id] — update pemohon/tanah data
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["PETUGAS", "ADMIN"].includes(current.user.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const allowed: (keyof typeof db.permohonan.fields)[] = [
    "pemohonNik","pemohonNama","pemohonTempatLahir","pemohonTanggalLahir","pemohonAlamat",
    "pemohonRt","pemohonRw","pemohonHp","lokasiTanah","tanahRt","tanahRw","luasTanah",
    "batasUtara","batasSelatan","batasTimur","batasBarat","statusPenguasaan","keperluan","prioritas","catatan",
  ];
  const data: any = {};
  for (const k of allowed as string[]) {
    if (k in body) data[k] = body[k];
  }
  data.updatedBy = current.user.id;

  const updated = await db.permohonan.update({ where: { id }, data });
  await writeAudit(current.session, {
    aksi: "UPDATE",
    modul: "PERMOHONAN",
    entitasId: id,
    detail: `Memperbarui data permohonan ${updated.nomorRegister}`,
  });
  return NextResponse.json({ permohonan: updated });
}

// DELETE
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (current.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya admin yang dapat menghapus" }, { status: 403 });
  }
  const { id } = await params;
  const p = await db.permohonan.delete({ where: { id }, select: { nomorRegister: true } });
  await writeAudit(current.session, {
    aksi: "DELETE",
    modul: "PERMOHONAN",
    entitasId: id,
    detail: `Menghapus permohonan ${p.nomorRegister}`,
  });
  return NextResponse.json({ ok: true });
}
