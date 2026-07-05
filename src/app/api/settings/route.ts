import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const items = await db.settings.findMany();
  const map: Record<string, string> = {};
  for (const s of items) map[s.key] = s.value || "";
  return NextResponse.json({ settings: map });
}
