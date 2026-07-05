import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/* ============================================================
   Arsip Surat Tanah — global list/search API
   Returns all archived surat tanah (where ArsipSuratTanah exists)
   joined with permohonan + jenis surat. Supports search by
   nomor register, nomor surat, pemohon nama, pejabat penerbit,
   and date range filter on tanggalTerbit.

   Query params:
     q        — free-text search (register, nomor surat, pemohon, pejabat)
     from     — YYYY-MM-DD (tanggalTerbit >=)
     to       — YYYY-MM-DD (tanggalTerbit <=)
     page     — default 1
     limit    — default 20, max 100
   ============================================================ */

export async function GET(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["PETUGAS", "ADMIN", "ATASAN"].includes(current.user.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

  const where: any = {};

  // Text search across multiple related fields
  if (q) {
    where.OR = [
      { nomorSurat: { contains: q } },
      { pejabatPenerbit: { contains: q } },
      { nomorLembar: { contains: q } },
      { lokasiArsip: { contains: q } },
      { permohonan: { nomorRegister: { contains: q } } },
      { permohonan: { pemohonNama: { contains: q } } },
      { permohonan: { pemohonNik: { contains: q } } },
    ];
  }

  // Date range on tanggalTerbit
  if (from || to) {
    where.tanggalTerbit = {};
    if (from) where.tanggalTerbit.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.tanggalTerbit.lte = toDate;
    }
  }

  const [total, items] = await Promise.all([
    db.arsipSuratTanah.count({ where }),
    db.arsipSuratTanah.findMany({
      where,
      include: {
        permohonan: {
          select: {
            id: true,
            nomorRegister: true,
            pemohonNama: true,
            pemohonNik: true,
            statusSaatIni: true,
            tanggalSelesai: true,
            jenisSurat: { select: { nama: true } },
          },
        },
      },
      orderBy: { uploadedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    items,
  });
}
