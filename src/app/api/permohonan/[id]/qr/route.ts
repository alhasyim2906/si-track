import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateQrDataUrl } from "@/lib/qr";
import { buildTrackingUrl, resolvePublicBaseUrl } from "@/lib/public-url";

// GET /api/permohonan/[id]/qr — returns QR data URL encoding the public tracking URL
//
// The QR code must encode the *public* tracking URL (e.g.
// https://si-track.seruyan.go.id/?track=KPII-TNH-2026-XXXX), NOT the server's
// internal origin (http://localhost:3000). Otherwise applicants scanning the
// QR with their phone get an unreachable localhost URL.
//
// We resolve the public base URL from the `public_base_url` DB setting first,
// then fall back to NEXT_PUBLIC_APP_URL env, then to the request origin.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const p = await db.permohonan.findUnique({ where: { id }, select: { nomorRegister: true } });
  if (!p) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  const requestOrigin = new URL(req.url).origin;
  const baseUrl = await resolvePublicBaseUrl(requestOrigin);
  const trackUrl = `${baseUrl}/?track=${encodeURIComponent(p.nomorRegister)}`;
  const qr = await generateQrDataUrl(trackUrl);
  return NextResponse.json({
    qr,
    url: trackUrl,
    nomorRegister: p.nomorRegister,
    baseUrl, // exposed for debugging / display in the UI
    isFallback: baseUrl === requestOrigin, // true when using localhost fallback
  });
}
