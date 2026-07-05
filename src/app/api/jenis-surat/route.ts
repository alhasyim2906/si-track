import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function GET() {
  const items = await db.jenisSurat.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { permohonan: true } } },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (current.user.role !== "ADMIN") return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const body = await req.json();
  const kode = body.kode?.toUpperCase().replace(/\s+/g, "_");
  const exists = await db.jenisSurat.findUnique({ where: { kode } });
  if (exists) return NextResponse.json({ error: "Kode jenis surat sudah ada" }, { status: 400 });
  const item = await db.jenisSurat.create({
    data: {
      kode,
      nama: body.nama,
      deskripsi: body.deskripsi || null,
      butuhPengukuran: !!body.butuhPengukuran,
      butuhTtdCamat: !!body.butuhTtdCamat,
    },
  });
  await writeAudit(current.session, { aksi: "CREATE", modul: "JENIS_SURAT", entitasId: item.id, detail: `Tambah jenis surat ${item.kode}` });
  return NextResponse.json({ item }, { status: 201 });
}
