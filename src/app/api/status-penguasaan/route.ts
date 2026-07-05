import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

/**
 * GET /api/status-penguasaan
 *  - Public (no auth) — needed so the public tracking + create form can
 *    render the dropdown. Returns only active rows by default.
 *  - Query: ?includeInactive=true to include inactive rows (admin only).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const includeInactive = url.searchParams.get("includeInactive") === "true";

  // If includeInactive requested, require ADMIN
  if (includeInactive) {
    const current = await getCurrentUser();
    if (!current || current.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }
  }

  const items = await db.statusPenguasaan.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ urutan: "asc" }, { nama: "asc" }],
  });
  return NextResponse.json({ items });
}

/**
 * POST /api/status-penguasaan — create new status penguasaan
 *  - Admin only
 *  - Body: { kode, nama, deskripsi?, urutan?, warna?, isDefault?, isActive? }
 *  - kode is normalized to UPPERCASE_WITH_UNDERSCORES
 *  - If isDefault=true, any existing default row is cleared first (only one default)
 */
export async function POST(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (current.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Akses ditolak. Hanya ADMIN." }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const kode = (body.kode || "").toString().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
  if (!kode) {
    return NextResponse.json({ error: "Kode wajib diisi" }, { status: 400 });
  }
  const nama = (body.nama || "").toString().trim();
  if (!nama) {
    return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
  }

  const exists = await db.statusPenguasaan.findUnique({ where: { kode } });
  if (exists) {
    return NextResponse.json({ error: `Kode "${kode}" sudah digunakan` }, { status: 400 });
  }

  // Enforce single default
  const isDefault = !!body.isDefault;
  if (isDefault) {
    await db.statusPenguasaan.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
  }

  const item = await db.statusPenguasaan.create({
    data: {
      kode,
      nama,
      deskripsi: body.deskripsi ? body.deskripsi.toString().trim() : null,
      urutan: Number.isFinite(Number(body.urutan)) ? Number(body.urutan) : 0,
      warna: body.warna ? body.warna.toString() : null,
      isDefault,
      isActive: body.isActive === false ? false : true,
    },
  });

  await writeAudit(current.session, {
    aksi: "CREATE",
    modul: "STATUS_PENGUASAAN",
    entitasId: item.id,
    detail: `Tambah status penguasaan ${item.kode} — ${item.nama}`,
  });

  return NextResponse.json({ item }, { status: 201 });
}
