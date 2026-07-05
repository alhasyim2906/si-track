import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/dashboard — role-aware stats
// Query params:
//   year  — int (backwards-compat). Used for chart axis grouping when range=all/year.
//   range — 'today' | '7d' | '30d' | 'year' | 'all' (default 'year'). Range takes precedence over year.
export async function GET(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = current.user.role;
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const range = (searchParams.get("range") || "year") as
    | "today"
    | "7d"
    | "30d"
    | "year"
    | "all";

  // Compute the start-of-day / cutoff for the date filter on permohonan.createdAt
  const now = new Date();
  let fromDate: Date | null = null; // null = no lower bound
  let toDate: Date | null = null; // null = no upper bound (use now implicitly via <= now)
  let rangeLabel = "";

  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    fromDate = start;
    toDate = now;
    rangeLabel = "Hari Ini";
  } else if (range === "7d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6); // include today → 7 days total
    start.setHours(0, 0, 0, 0);
    fromDate = start;
    toDate = now;
    rangeLabel = "7 Hari Terakhir";
  } else if (range === "30d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    fromDate = start;
    toDate = now;
    rangeLabel = "30 Hari Terakhir";
  } else if (range === "year") {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    fromDate = start;
    toDate = end;
    rangeLabel = `Tahun ${now.getFullYear()}`;
  } else {
    // all — no filter
    rangeLabel = "Semua";
  }

  // If range is year and an explicit year query param was provided, override the bounds.
  if (range === "year" && searchParams.get("year")) {
    fromDate = new Date(year, 0, 1, 0, 0, 0, 0);
    toDate = new Date(year, 11, 31, 23, 59, 59, 999);
    rangeLabel = `Tahun ${year}`;
  }

  // overall counts — apply range filter
  const where: any = {};
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = fromDate;
    if (toDate) where.createdAt.lte = toDate;
  }

  const all = await db.permohonan.findMany({
    where,
    select: {
      id: true, statusSaatIni: true, createdAt: true, tanggalSelesai: true,
      createdBy: true, prioritas: true, jenisSuratId: true, nomorRegister: true,
      pemohonNama: true, jenisSurat: { select: { nama: true } },
    },
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

  // monthly chart — always 12 months of `year` (for axis grouping).
  // If range is year/all, this is the year's distribution.
  // If range is today/7d/30d, we still show the year's monthly chart for context.
  const monthly = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][i],
    total: 0, selesai: 0, ditolak: 0,
  }));

  // For the chart, use a separate query — count permohonan by createdAt month within `year`.
  // For range=all we still pick `year` (current year) as the chart axis.
  const chartYear = year;
  for (const p of all) {
    if (new Date(p.createdAt).getFullYear() === chartYear) {
      const m = new Date(p.createdAt).getMonth();
      monthly[m].total++;
      if (p.statusSaatIni === "SELESAI") monthly[m].selesai++;
      if (p.statusSaatIni === "DITOLAK") monthly[m].ditolak++;
    }
  }

  // status distribution
  const statusDist = Object.entries(counts)
    .filter(([k]) => k !== "total")
    .map(([k, v]) => ({ kode: k, nama: k, value: v }));

  // avg completion time (days) for completed
  const completed = all.filter((p) => p.tanggalSelesai);
  let avgDays = 0;
  if (completed.length) {
    const totalDays = completed.reduce(
      (s, p) =>
        s +
        (new Date(p.tanggalSelesai!).getTime() - new Date(p.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      0
    );
    avgDays = Math.round((totalDays / completed.length) * 10) / 10;
  }

  // per petugas (admin only)
  let perPetugas: any[] = [];
  if (role === "ADMIN") {
    const users = await db.user.findMany({
      where: { role: "PETUGAS" },
      select: { id: true, name: true },
    });
    perPetugas = users.map((u) => ({
      id: u.id,
      name: u.name,
      total: all.filter((p) => p.createdBy === u.id).length,
      selesai: all.filter((p) => p.createdBy === u.id && p.statusSaatIni === "SELESAI").length,
    }));
  }

  // recent items (last 6, NOT filtered by range — always show recent activity)
  const recent = await db.permohonan.findMany({
    orderBy: { updatedAt: "desc" },
    take: 6,
    include: { jenisSurat: { select: { nama: true } } },
  });

  // pending approvals for ATASAN (filtered by range)
  let pendingApprovals: any[] = [];
  if (role === "ATASAN") {
    pendingApprovals = await db.permohonan.findMany({
      where: {
        ...(where.createdAt ? { createdAt: where.createdAt } : {}),
        OR: [{ statusSaatIni: "TTD_LURAH" }, { statusSaatIni: "TTD_CAMAT" }],
      },
      include: {
        jenisSurat: { select: { nama: true, butuhTtdCamat: true } },
        creator: { select: { name: true } },
      },
      orderBy: { updatedAt: "asc" },
    });
  }

  return NextResponse.json({
    role,
    range,
    rangeLabel,
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
