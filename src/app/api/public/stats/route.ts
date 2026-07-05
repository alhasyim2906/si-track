import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/public/stats — public aggregate counters for transparency banner (no auth)
export async function GET() {
  const all = await db.permohonan.findMany({
    select: { statusSaatIni: true, createdAt: true },
  });
  const total = all.length;
  const selesai = all.filter((p) => p.statusSaatIni === "SELESAI").length;
  const diproses = all.filter((p) => !["SELESAI", "DITOLAK"].includes(p.statusSaatIni)).length;
  const ditolak = all.filter((p) => p.statusSaatIni === "DITOLAK").length;

  const now = new Date();
  const thisMonth = all.filter(
    (p) => new Date(p.createdAt).getMonth() === now.getMonth() && new Date(p.createdAt).getFullYear() === now.getFullYear()
  ).length;

  const completionRate = total > 0 ? Math.round((selesai / total) * 100) : 0;

  return NextResponse.json({
    total,
    selesai,
    diproses,
    ditolak,
    thisMonth,
    completionRate,
  });
}
