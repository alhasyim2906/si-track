import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { normalizeBaseUrl, invalidatePublicBaseUrlCache } from "@/lib/public-url";

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

  // Normalize certain keys before persisting:
  //  - public_base_url: strip path/trailing slash → keep only origin, so QR
  //    codes encode a clean URL. Empty string is preserved (means "use fallback").
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(settings)) {
    if (key === "public_base_url") {
      normalized[key] = normalizeBaseUrl(String(value).trim());
    } else {
      normalized[key] = String(value);
    }
  }

  // Upsert each key-value pair
  for (const [key, value] of Object.entries(normalized)) {
    await db.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  // If public_base_url was part of this save, bust the resolver cache so the
  // next QR code / notification renders with the new domain immediately.
  if ("public_base_url" in normalized) {
    invalidatePublicBaseUrlCache();
  }

  // Audit trail
  await writeAudit(result.session, {
    aksi: "UPDATE",
    modul: "SETTINGS",
    detail: `Mengubah pengaturan: ${Object.keys(normalized).join(", ")}`,
  });

  // Return updated settings map
  const items = await db.settings.findMany();
  const map: Record<string, string> = {};
  for (const s of items) map[s.key] = s.value || "";
  return NextResponse.json({ settings: map });
}
