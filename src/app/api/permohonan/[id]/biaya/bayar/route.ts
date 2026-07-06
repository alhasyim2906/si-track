import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { generateNomorKwitansi } from "@/lib/kwitansi";

/* ============================================================
   Biaya Operasional — mark as LUNAS (paid)
   Stamps `tanggalBayar` to now, sets `metodePembayaran`, captures
   `diterimaOleh` (the petugas who received the payment), and
   auto-generates a unique `nomorKwitansi` so a printable official
   receipt (Kwitansi Pembayaran) can be issued from the app.

   Endpoint:
     POST /api/permohonan/[id]/biaya/bayar
       body: { metodePembayaran: "TUNAI" | "TRANSFER" | "QRIS" | "LAINNYA",
               diterimaOleh?: string,  // optional override (defaults to current user's name)
               catatan?: string }
   ============================================================ */

const METODE_PEMBAYARAN = ["TUNAI", "TRANSFER", "QRIS", "LAINNYA"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["PETUGAS", "ADMIN"].includes(current.user.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  const { id } = await params;

  const existing = await db.biayaOperasional.findUnique({
    where: { permohonanId: id },
    include: { permohonan: { select: { nomorRegister: true, pemohonNama: true } } },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Biaya operasional belum dibuat. Buat terlebih dahulu sebelum menandai pembayaran." },
      { status: 404 }
    );
  }
  if (existing.statusPembayaran === "LUNAS") {
    return NextResponse.json(
      { error: "Biaya operasional sudah ditandai LUNAS.", biaya: existing },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));

  // metodePembayaran is required when marking as paid.
  const metode = String(body.metodePembayaran || "").toUpperCase();
  if (!METODE_PEMBAYARAN.includes(metode)) {
    return NextResponse.json(
      { error: `Metode pembayaran wajib diisi (salah satu: ${METODE_PEMBAYARAN.join(", ")})` },
      { status: 400 }
    );
  }

  // diterimaOleh defaults to current user's name (the petugas processing the payment).
  const diterimaOleh = (String(body.diterimaOleh || "").trim()) || current.user.name;

  // Optional catatan override (append to existing catatan if provided).
  const catatanOverride = body.catatan != null ? String(body.catatan).trim().slice(0, 1000) : null;
  const catatan = catatanOverride !== null
    ? (catatanOverride || null)
    : existing.catatan;

  // Generate the unique kwitansi number — auto-incremented per year.
  const nomorKwitansi = await generateNomorKwitansi();

  const biaya = await db.biayaOperasional.update({
    where: { permohonanId: id },
    data: {
      statusPembayaran: "LUNAS",
      metodePembayaran: metode,
      tanggalBayar: new Date(),
      diterimaOleh,
      catatan,
      nomorKwitansi,
      updatedBy: current.user.id,
    },
  });

  await writeAudit(current.session, {
    aksi: "STATUS_CHANGE",
    modul: "PERMOHONAN",
    entitasId: id,
    detail: `Tandai biaya operasional LUNAS untuk ${existing.permohonan.nomorRegister}: Rp ${existing.nominal.toLocaleString("id-ID")} via ${metode} — Kwitansi ${nomorKwitansi}`,
  });

  return NextResponse.json({
    biaya,
    kwitansi: {
      nomorKwitansi,
      tanggalBayar: biaya.tanggalBayar,
      diterimaOleh,
      metodePembayaran: metode,
    },
  });
}
