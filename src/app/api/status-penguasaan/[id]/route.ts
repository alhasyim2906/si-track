import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

/**
 * PUT /api/status-penguasaan/[id] — edit status penguasaan
 *  - Admin only
 *  - Cannot change `kode` (immutable business key)
 *  - Updatable: nama, deskripsi, urutan, warna, isDefault, isActive
 *  - If isDefault=true, any existing default row is cleared first (only one default)
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

  const existing = await db.statusPenguasaan.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Status penguasaan tidak ditemukan" }, { status: 404 });
  }

  // Reject kode change (immutable business key)
  if (typeof body.kode === "string" && body.kode.toUpperCase() !== existing.kode) {
    return NextResponse.json(
      { error: "Kode status penguasaan tidak dapat diubah setelah dibuat (kunci unik)." },
      { status: 400 }
    );
  }

  const data: any = {};
  if (typeof body.nama === "string" && body.nama.trim()) data.nama = body.nama.trim();
  if (typeof body.deskripsi === "string") data.deskripsi = body.deskripsi.trim() || null;
  if (body.urutan !== undefined && Number.isFinite(Number(body.urutan))) data.urutan = Number(body.urutan);
  if (typeof body.warna === "string") data.warna = body.warna || null;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  // Handle isDefault: if setting to true, clear other defaults first
  if (typeof body.isDefault === "boolean") {
    if (body.isDefault && !existing.isDefault) {
      await db.statusPenguasaan.updateMany({
        where: { isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }
    data.isDefault = body.isDefault;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ item: existing });
  }

  const item = await db.statusPenguasaan.update({ where: { id }, data });

  await writeAudit(current.session, {
    aksi: "UPDATE",
    modul: "STATUS_PENGUASAAN",
    entitasId: item.id,
    detail: `Ubah status penguasaan ${item.kode} — ${Object.keys(data).join(", ")}`,
  });

  return NextResponse.json({ item });
}

/**
 * DELETE /api/status-penguasaan/[id] — delete status penguasaan
 *  - Admin only
 *  - Referential check: count Permohonan whose statusPenguasaan === this row's nama.
 *    Since Permohonan.statusPenguasaan is a denormalized string, we cannot use
 *    Prisma relational integrity. We do a manual count instead.
 *  - If used by any permohonan → HTTP 409 with helpful message; suggest deactivate.
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
  const existing = await db.statusPenguasaan.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Status penguasaan tidak ditemukan" }, { status: 404 });
  }

  // Manual referential integrity check on the denormalized string field
  const permohonanCount = await db.permohonan.count({
    where: { statusPenguasaan: existing.nama },
  });

  if (permohonanCount > 0) {
    return NextResponse.json(
      {
        error: `Tidak dapat menghapus status penguasaan "${existing.nama}" karena masih digunakan oleh ${permohonanCount} permohonan. Nonaktifkan (set isActive=false) sebagai gantinya.`,
        permohonanCount,
      },
      { status: 409 }
    );
  }

  await db.statusPenguasaan.delete({ where: { id } });

  await writeAudit(current.session, {
    aksi: "DELETE",
    modul: "STATUS_PENGUASAAN",
    entitasId: id,
    detail: `Hapus status penguasaan ${existing.kode} — ${existing.nama}`,
  });

  return NextResponse.json({ ok: true });
}
