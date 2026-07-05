import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const riwayat = await db.riwayatProses.findMany({
    where: { permohonanId: id },
    orderBy: { createdAt: "asc" },
    include: { petugas: { select: { name: true, position: true } } },
  });
  return NextResponse.json({ riwayat });
}
