import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const items = await db.statusProses.findMany({ orderBy: { urutan: "asc" } });
  return NextResponse.json({ items });
}
