import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function GET() {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (current.user.role !== "ADMIN") return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const items = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, position: true, nip: true, phone: true, isActive: true, lastLoginAt: true, createdAt: true },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (current.user.role !== "ADMIN") return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const body = await req.json();
  if (!body.email || !body.name || !body.role || !body.password) {
    return NextResponse.json({ error: "Field wajib tidak lengkap" }, { status: 400 });
  }
  const exists = await db.user.findUnique({ where: { email: body.email.toLowerCase().trim() } });
  if (exists) return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
  const user = await db.user.create({
    data: {
      email: body.email.toLowerCase().trim(),
      name: body.name,
      role: body.role,
      position: body.position || null,
      nip: body.nip || null,
      phone: body.phone || null,
      password: await hashPassword(body.password),
      isActive: body.isActive !== false,
    },
    select: { id: true, email: true, name: true, role: true, position: true, nip: true, phone: true, isActive: true, createdAt: true },
  });
  await writeAudit(current.session, { aksi: "CREATE", modul: "USER", entitasId: user.id, detail: `Tambah user ${user.email} (${user.role})` });
  return NextResponse.json({ user }, { status: 201 });
}
