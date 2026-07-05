import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

// GET /api/permohonan/[id]/riwayat-tanah — list land history entries (auth: staff)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const permohonan = await db.permohonan.findUnique({
    where: { id },
    select: { id: true, nomorRegister: true },
  });
  if (!permohonan) return NextResponse.json({ error: "Permohonan tidak ditemukan" }, { status: 404 });

  const items = await db.riwayatTanah.findMany({
    where: { permohonanId: id },
    orderBy: [{ urutan: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ items });
}

// POST /api/permohonan/[id]/riwayat-tanah — add a new land history entry
// Body: { tahun?, pemilikSebelumnya?, hubunganPemilik?, caraPerolehan?, noDokumen?, keterangan?, urutan? }
export async function POST(
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

  const permohonan = await db.permohonan.findUnique({
    where: { id },
    select: { id: true, nomorRegister: true },
  });
  if (!permohonan) return NextResponse.json({ error: "Permohonan tidak ditemukan" }, { status: 404 });

  // Determine urutan: if not provided, append to end (max + 1)
  let urutan = typeof body.urutan === "number" ? body.urutan : 1;
  if (typeof body.urutan !== "number") {
    const max = await db.riwayatTanah.aggregate({
      where: { permohonanId: id },
      _max: { urutan: true },
    });
    urutan = (max._max.urutan || 0) + 1;
  }

  const entry = await db.riwayatTanah.create({
    data: {
      permohonanId: id,
      urutan,
      tahun: body.tahun?.toString().trim() || null,
      pemilikSebelumnya: body.pemilikSebelumnya?.toString().trim() || null,
      hubunganPemilik: body.hubunganPemilik?.toString().trim() || null,
      caraPerolehan: body.caraPerolehan?.toString().trim() || null,
      noDokumen: body.noDokumen?.toString().trim() || null,
      keterangan: body.keterangan?.toString().trim() || null,
    },
  });

  await writeAudit(current.session, {
    aksi: "CREATE",
    modul: "PERMOHONAN",
    entitasId: id,
    detail: `Menambahkan riwayat tanah #${urutan} untuk permohonan ${permohonan.nomorRegister}`,
  });

  return NextResponse.json({ entry }, { status: 201 });
}
