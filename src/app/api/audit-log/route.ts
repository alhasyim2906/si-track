import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN"].includes(current.user.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "100");
  const q = searchParams.get("q") || undefined;
  const modul = searchParams.get("modul") || undefined;

  const where: any = {};
  if (modul) where.modul = modul;
  if (q) {
    where.OR = [
      { userName: { contains: q } },
      { detail: { contains: q } },
      { aksi: { contains: q } },
    ];
  }

  const items = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json({ items });
}
