import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }
    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Akun tidak ditemukan atau nonaktif" }, { status: 401 });
    }
    const ok = await verifyPassword(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }
    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const session = { uid: user.id, email: user.email, name: user.name, role: user.role as any };
    await setSessionCookie(session);
    await writeAudit(session, {
      aksi: "LOGIN",
      modul: "AUTH",
      detail: `Login berhasil`,
      ip: req.headers.get("x-forwarded-for") || undefined,
    });
    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, position: user.position, phone: user.phone, nip: user.nip },
    });
  } catch (e) {
    console.error("login error", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
