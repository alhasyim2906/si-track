import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

/**
 * PUT /api/jenis-surat/[id] — edit jenis surat
 *  - Admin only
 *  - Cannot change `kode` (it is the unique business key referenced by Permohonan)
 *  - Fields updatable: nama, deskripsi, butuhPengukuran, butuhTtdCamat, isActive
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (current.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Akses ditolak. Hanya ADMIN." }, { status: 403 });
  }

  const { id } = await params;
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const existing = await db.jenisSurat.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Jenis surat tidak ditemukan" }, { status: 404 });

  const data: any = {};
  if (typeof body.nama === "string" && body.nama.trim()) data.nama = body.nama.trim();
  if (typeof body.deskripsi === "string") data.deskripsi = body.deskripsi.trim() || null;
  if (typeof body.butuhPengukuran === "boolean") data.butuhPengukuran = body.butuhPengukuran;
  if (typeof body.butuhTtdCamat === "boolean") data.butuhTtdCamat = body.butuhTtdCamat;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  // Reject kode change (immutable business key)
  if (typeof body.kode === "string" && body.kode.toUpperCase() !== existing.kode) {
    return NextResponse.json(
      { error: "Kode jenis surat tidak dapat diubah setelah dibuat (kunci unik)." },
      { status: 400 }
    );
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ item: existing });
  }

  const item = await db.jenisSurat.update({ where: { id }, data });

  await writeAudit(current.session, {
    aksi: "UPDATE",
    modul: "JENIS_SURAT",
    entitasId: item.id,
    detail: `Ubah jenis surat ${item.kode} — ${Object.keys(data).join(", ")}`,
  });

  return NextResponse.json({ item });
}

/**
 * DELETE /api/jenis-surat/[id] — delete jenis surat
 *  - Admin only
 *  - HARD BLOCK if any Permohonan references this jenis surat (referential integrity).
 *    Admin should set isActive=false instead (soft deactivate).
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (current.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Akses ditolak. Hanya ADMIN." }, { status: 403 });
  }

  const { id } = await params;
  const existing = await db.jenisSurat.findUnique({
    where: { id },
    include: { _count: { select: { permohonan: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Jenis surat tidak ditemukan" }, { status: 404 });

  if (existing._count.permohonan > 0) {
    return NextResponse.json(
      {
        error: `Tidak dapat menghapus jenis surat "${existing.kode}" karena masih digunakan oleh ${existing._count.permohonan} permohonan. Nonaktifkan (set isActive=false) sebagai gantinya.`,
        permohonanCount: existing._count.permohonan,
      },
      { status: 409 }
    );
  }

  await db.jenisSurat.delete({ where: { id } });

  await writeAudit(current.session, {
    aksi: "DELETE",
    modul: "JENIS_SURAT",
    entitasId: id,
    detail: `Hapus jenis surat ${existing.kode} — ${existing.nama}`,
  });

  return NextResponse.json({ ok: true });
}
