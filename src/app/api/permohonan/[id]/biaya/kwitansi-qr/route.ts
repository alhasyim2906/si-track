import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateQrDataUrl } from "@/lib/qr";
import { resolvePublicBaseUrl } from "@/lib/public-url";

/* ============================================================
   Kwitansi QR — generates a verification QR code for a LUNAS biaya.
   The QR encodes a short verification payload (nomorKwitansi + nominal +
   tanggalBayar + tracking URL) so the receipt can be verified by scanning.

   Endpoint:
     GET /api/permohonan/[id]/biaya/kwitansi-qr
   ============================================================ */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const biaya = await db.biayaOperasional.findUnique({
    where: { permohonanId: id },
    include: { permohonan: { select: { nomorRegister: true, pemohonNama: true } } },
  });
  if (!biaya) {
    return NextResponse.json({ error: "Biaya operasional tidak ditemukan" }, { status: 404 });
  }
  if (biaya.statusPembayaran !== "LUNAS" || !biaya.nomorKwitansi) {
    return NextResponse.json(
      { error: "Kwitansi belum tersedia — biaya belum ditandai LUNAS." },
      { status: 400 }
    );
  }

  // Build the verification payload. We embed the key receipt facts so a
  // verifier (e.g., an auditor scanning the printed receipt) can confirm
  // the payment record matches what's printed on the paper.
  const requestOrigin = new URL(req.url).origin;
  const baseUrl = await resolvePublicBaseUrl(requestOrigin);
  const trackUrl = `${baseUrl}/?track=${encodeURIComponent(biaya.permohonan.nomorRegister)}`;

  const payload = {
    v: 1, // payload version
    kwitansi: biaya.nomorKwitansi,
    register: biaya.permohonan.nomorRegister,
    pemohon: biaya.permohonan.pemohonNama,
    nominal: biaya.nominal,
    tanggalBayar: biaya.tanggalBayar,
    metode: biaya.metodePembayaran,
    verify: trackUrl,
  };

  const qr = await generateQrDataUrl(JSON.stringify(payload));
  return NextResponse.json({
    qr,
    payload,
    nomorKwitansi: biaya.nomorKwitansi,
  });
}
