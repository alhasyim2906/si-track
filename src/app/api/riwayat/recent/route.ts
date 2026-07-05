import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/riwayat/recent?limit=5
// Returns the latest RiwayatProses entries joined with User (name, role)
// and Permohonan (nomorRegister, currentTahap, pemohonNama). Sort by createdAt DESC.
export async function GET(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limitParam = parseInt(searchParams.get("limit") || "5", 10);
  const limit = Math.max(1, Math.min(50, Number.isNaN(limitParam) ? 5 : limitParam));

  const items = await db.riwayatProses.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      petugas: { select: { id: true, name: true, role: true } },
      permohonan: {
        select: {
          id: true,
          nomorRegister: true,
          statusSaatIni: true,
          pemohonNama: true,
          jenisSurat: { select: { nama: true } },
        },
      },
    },
  });

  return NextResponse.json({
    items: items.map((it) => ({
      id: it.id,
      permohonanId: it.permohonanId,
      nomorRegister: it.permohonan.nomorRegister,
      pemohonNama: it.permohonan.pemohonNama,
      jenisSurat: it.permohonan.jenisSurat?.nama || "-",
      currentTahap: it.permohonan.statusSaatIni,
      statusKode: it.statusKode,
      statusNama: it.statusNama,
      catatan: it.catatan,
      createdAt: it.createdAt,
      user: {
        id: it.petugas.id,
        name: it.petugas.name,
        role: it.petugas.role,
      },
    })),
  });
}
