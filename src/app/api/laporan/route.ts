import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/laporan?periode=harian|bulanan|tahunan&from=&to=&status=&petugas=
export async function GET(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "ATASAN"].includes(current.user.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");
  const petugas = searchParams.get("petugas");

  const where: any = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to + "T23:59:59");
  }
  if (status) where.statusSaatIni = status;
  if (petugas) where.createdBy = petugas;

  const items = await db.permohonan.findMany({
    where,
    include: {
      jenisSurat: { select: { nama: true } },
      creator: { select: { name: true, position: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const summary = {
    total: items.length,
    selesai: items.filter((i) => i.statusSaatIni === "SELESAI").length,
    diproses: items.filter((i) => !["SELESAI", "DITOLAK"].includes(i.statusSaatIni)).length,
    ditolak: items.filter((i) => i.statusSaatIni === "DITOLAK").length,
    avgDays: 0,
  };
  const done = items.filter((i) => i.tanggalSelesai);
  if (done.length) {
    summary.avgDays = Math.round((done.reduce((s, i) => s + (new Date(i.tanggalSelesai!).getTime() - new Date(i.createdAt).getTime()) / 86400000, 0) / done.length) * 10) / 10;
  }

  return NextResponse.json({
    summary,
    items: items.map((p) => ({
      id: p.id,
      nomorRegister: p.nomorRegister,
      pemohonNama: p.pemohonNama,
      pemohonNik: p.pemohonNik,
      jenisSurat: p.jenisSurat.nama,
      keperluan: p.keperluan,
      statusSaatIni: p.statusSaatIni,
      prioritas: p.prioritas,
      petugas: p.creator?.name,
      createdAt: p.createdAt,
      tanggalSelesai: p.tanggalSelesai,
      alasanDitolak: p.alasanDitolak,
      lokasiTanah: p.lokasiTanah,
      luasTanah: p.luasTanah,
    })),
  });
}
