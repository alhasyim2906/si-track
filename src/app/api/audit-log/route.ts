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
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 500);
  const q = searchParams.get("q") || undefined;
  const modul = searchParams.get("modul") || undefined;
  // Cursor-style pagination: page is 1-indexed.
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (modul) where.modul = modul;
  if (q) {
    where.OR = [
      { userName: { contains: q } },
      { detail: { contains: q } },
      { aksi: { contains: q } },
    ];
  }

  const [items, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    db.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}
