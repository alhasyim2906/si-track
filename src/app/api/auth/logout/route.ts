import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session) {
    await writeAudit(session, { aksi: "LOGOUT", modul: "AUTH", ip: req.headers.get("x-forwarded-for") || undefined });
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
