import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateQrDataUrl } from "@/lib/qr";

// GET /api/permohonan/[id]/qr — returns QR data URL encoding the public tracking URL
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const p = await db.permohonan.findUnique({ where: { id }, select: { nomorRegister: true } });
  if (!p) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  const origin = new URL(req.url).origin;
  const trackUrl = `${origin}/?track=${encodeURIComponent(p.nomorRegister)}`;
  const qr = await generateQrDataUrl(trackUrl);
  return NextResponse.json({ qr, url: trackUrl, nomorRegister: p.nomorRegister });
}
