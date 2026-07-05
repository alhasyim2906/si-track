import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function GET() {
  const items = await db.settings.findMany();
  const map: Record<string, string> = {};
  for (const s of items) map[s.key] = s.value || "";
  return NextResponse.json({ settings: map });
}

export async function PUT(req: Request) {
  const result = await getCurrentUser();
  if (!result || result.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Akses ditolak. Hanya ADMIN yang dapat mengubah pengaturan." }, { status: 403 });
  }

  let body: { settings?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const settings = body.settings;
  if (!settings || typeof settings !== "object") {
    return NextResponse.json({ error: "Field 'settings' wajib diisi" }, { status: 400 });
  }

  // Upsert each key-value pair
  for (const [key, value] of Object.entries(settings)) {
    await db.settings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }

  // Audit trail
  await writeAudit(result.session, {
    aksi: "UPDATE",
    modul: "SETTINGS",
    detail: `Mengubah pengaturan: ${Object.keys(settings).join(", ")}`,
  });

  // Return updated settings map
  const items = await db.settings.findMany();
  const map: Record<string, string> = {};
  for (const s of items) map[s.key] = s.value || "";
  return NextResponse.json({ settings: map });
}
