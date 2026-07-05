import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (current.user.role !== "ADMIN") return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const data: any = {
    name: body.name,
    role: body.role,
    position: body.position || null,
    nip: body.nip || null,
    phone: body.phone || null,
    isActive: body.isActive !== false,
  };
  if (body.password) data.password = await hashPassword(body.password);
  const user = await db.user.update({ where: { id }, data, select: { id: true, email: true, name: true, role: true, position: true, nip: true, phone: true, isActive: true } });
  await writeAudit(current.session, { aksi: "UPDATE", modul: "USER", entitasId: id, detail: `Update user ${user.email}` });
  return NextResponse.json({ user });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (current.user.role !== "ADMIN") return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  const { id } = await params;
  if (id === current.user.id) return NextResponse.json({ error: "Tidak dapat menghapus akun sendiri" }, { status: 400 });
  const u = await db.user.delete({ where: { id }, select: { email: true } });
  await writeAudit(current.session, { aksi: "DELETE", modul: "USER", entitasId: id, detail: `Hapus user ${u.email}` });
  return NextResponse.json({ ok: true });
}
