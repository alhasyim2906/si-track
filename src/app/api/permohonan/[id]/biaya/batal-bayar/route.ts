import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

/* ============================================================
   Biaya Operasional — revert LUNAS → BELUM_LUNAS (ADMIN only)
   Clears tanggalBayar, metodePembayaran, diterimaOleh, and
   nullifies nomorKwitansi (the receipt number is freed for reuse
   on the next payment — but the historical number is preserved in
   the audit log for traceability).

   Endpoint:
     POST /api/permohonan/[id]/biaya/batal-bayar
       body: { alasan?: string }  // optional reason, recorded in audit log
   ============================================================ */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (current.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Hanya admin yang dapat membatalkan pembayaran. Hubungi admin jika diperlukan." },
      { status: 403 }
    );
  }
  const { id } = await params;

  const existing = await db.biayaOperasional.findUnique({
    where: { permohonanId: id },
    include: { permohonan: { select: { nomorRegister: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Biaya operasional tidak ditemukan" }, { status: 404 });
  }
  if (existing.statusPembayaran !== "LUNAS") {
    return NextResponse.json(
      { error: "Biaya operasional belum ditandai LUNAS." },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const alasan = body.alasan ? String(body.alasan).trim().slice(0, 500) : null;

  const previousKwitansi = existing.nomorKwitansi;

  const biaya = await db.biayaOperasional.update({
    where: { permohonanId: id },
    data: {
      statusPembayaran: "BELUM_LUNAS",
      metodePembayaran: null,
      tanggalBayar: null,
      diterimaOleh: null,
      nomorKwitansi: null,
      updatedBy: current.user.id,
    },
  });

  await writeAudit(current.session, {
    aksi: "STATUS_CHANGE",
    modul: "PERMOHONAN",
    entitasId: id,
    detail: `Batalkan pembayaran biaya operasional ${existing.permohonan.nomorRegister} (kwitansi sebelumnya: ${previousKwitansi})${alasan ? ` — Alasan: ${alasan}` : ""}`,
  });

  return NextResponse.json({ biaya });
}
