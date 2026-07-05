import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/dashboard — role-aware stats
export async function GET(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = current.user.role;
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  // overall counts
  const all = await db.permohonan.findMany({
    select: { id: true, statusSaatIni: true, createdAt: true, tanggalSelesai: true, createdBy: true, prioritas: true, jenisSuratId: true, nomorRegister: true, pemohonNama: true, jenisSurat: { select: { nama: true } } },
  });

  const counts = {
    total: all.length,
    PENGAJUAN: 0, CEK_ADMIN: 0, VERIFIKASI_LAPANGAN: 0, PENGUKURAN: 0,
    PEMBUATAN_SURAT: 0, TTD_LURAH: 0, TTD_CAMAT: 0, SELESAI: 0, REVISI: 0, DITOLAK: 0,
  } as Record<string, number>;
  for (const p of all) counts[p.statusSaatIni] = (counts[p.statusSaatIni] || 0) + 1;

  const diproses = counts.PENGAJUAN + counts.CEK_ADMIN + counts.VERIFIKASI_LAPANGAN + counts.PENGUKURAN + counts.PEMBUATAN_SURAT + counts.REVISI;
  const menungguPengukuran = counts.PENGUKURAN;
  const menungguLurah = counts.TTD_LURAH;
  const menungguCamat = counts.TTD_CAMAT;
  const selesai = counts.SELESAI;
  const ditolak = counts.DITOLAK;
  const revisi = counts.REVISI;

  // monthly chart (current year)
  const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, label: ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][i], total: 0, selesai: 0, ditolak: 0 }));
  for (const p of all) {
    if (new Date(p.createdAt).getFullYear() === year) {
      const m = new Date(p.createdAt).getMonth();
      monthly[m].total++;
      if (p.statusSaatIni === "SELESAI") monthly[m].selesai++;
      if (p.statusSaatIni === "DITOLAK") monthly[m].ditolak++;
    }
  }

  // status distribution
  const statusDist = Object.entries(counts).filter(([k]) => k !== "total").map(([k, v]) => ({ kode: k, nama: k, value: v }));

  // avg completion time (days) for completed
  const completed = all.filter((p) => p.tanggalSelesai);
  let avgDays = 0;
  if (completed.length) {
    const totalDays = completed.reduce((s, p) => s + (new Date(p.tanggalSelesai!).getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24), 0);
    avgDays = Math.round((totalDays / completed.length) * 10) / 10;
  }

  // per petugas (admin only)
  let perPetugas: any[] = [];
  if (role === "ADMIN") {
    const users = await db.user.findMany({ where: { role: "PETUGAS" }, select: { id: true, name: true } });
    perPetugas = users.map((u) => ({
      id: u.id,
      name: u.name,
      total: all.filter((p) => p.createdBy === u.id).length,
      selesai: all.filter((p) => p.createdBy === u.id && p.statusSaatIni === "SELESAI").length,
    }));
  }

  // recent items (last 6)
  const recent = await db.permohonan.findMany({
    orderBy: { updatedAt: "desc" },
    take: 6,
    include: { jenisSurat: { select: { nama: true } } },
  });

  // pending approvals for ATASAN
  let pendingApprovals: any[] = [];
  if (role === "ATASAN") {
    pendingApprovals = await db.permohonan.findMany({
      where: { OR: [{ statusSaatIni: "TTD_LURAH" }, { statusSaatIni: "TTD_CAMAT" }] },
      include: { jenisSurat: { select: { nama: true, butuhTtdCamat: true } }, creator: { select: { name: true } } },
      orderBy: { updatedAt: "asc" },
    });
  }

  return NextResponse.json({
    role,
    stats: {
      total: counts.total,
      diproses,
      menungguPengukuran,
      menungguLurah,
      menungguCamat,
      selesai,
      ditolak,
      revisi,
      avgDays,
    },
    counts,
    monthly,
    statusDist,
    perPetugas,
    recent: recent.map((r) => ({
      id: r.id,
      nomorRegister: r.nomorRegister,
      pemohonNama: r.pemohonNama,
      jenisSurat: r.jenisSurat.nama,
      statusSaatIni: r.statusSaatIni,
      prioritas: r.prioritas,
      updatedAt: r.updatedAt,
      createdAt: r.createdAt,
    })),
    pendingApprovals: pendingApprovals.map((p) => ({
      id: p.id,
      nomorRegister: p.nomorRegister,
      pemohonNama: p.pemohonNama,
      statusSaatIni: p.statusSaatIni,
      jenisSurat: p.jenisSurat.nama,
      butuhTtdCamat: p.jenisSurat.butuhTtdCamat,
      creator: p.creator.name,
      createdAt: p.createdAt,
      catatan: p.catatan,
    })),
  });
}
