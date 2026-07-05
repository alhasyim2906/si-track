import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await db.notifikasi.findMany({
    where: { OR: [{ userId: null }, { userId: current.user.id }] },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { permohonan: { select: { nomorRegister: true, pemohonNama: true } } },
  });
  const unread = items.filter((i) => !i.dibaca).length;
  return NextResponse.json({ items, unread });
}

export async function PATCH(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body.markAll) {
    await db.notifikasi.updateMany({
      where: { OR: [{ userId: null }, { userId: current.user.id }] },
      data: { dibaca: true },
    });
    return NextResponse.json({ ok: true });
  }
  if (body.id) {
    await db.notifikasi.update({ where: { id: body.id }, data: { dibaca: true } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  if (body.clearAll) {
    await db.notifikasi.deleteMany({
      where: { OR: [{ userId: null }, { userId: current.user.id }] },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.id) {
    // only allow deleting own notifications or global (userId=null)
    const notif = await db.notifikasi.findUnique({ where: { id: body.id } });
    if (!notif) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (notif.userId && notif.userId !== current.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await db.notifikasi.delete({ where: { id: body.id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid" }, { status: 400 });
}
