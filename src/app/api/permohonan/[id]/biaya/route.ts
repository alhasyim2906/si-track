import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { generateNomorKwitansi } from "@/lib/kwitansi";

/* ============================================================
   Biaya Operasional — per-permohonan operational cost & receipt API
   Tracks the operational fee charged to the pemohon and its payment
   status (BELUM_LUNAS / LUNAS). When marked LUNAS, a unique
   `nomorKwitansi` is auto-generated so a printable official receipt
   (Kwitansi Pembayaran) can be issued directly from the app.

   Endpoints:
     GET    /api/permohonan/[id]/biaya        — fetch biaya for this permohonan
     POST   /api/permohonan/[id]/biaya        — create biaya (idempotent if exists)
     PUT    /api/permohonan/[id]/biaya        — update nominal / keterangan / due date
   ============================================================ */

const MAX_NOMINAL = 1_000_000_000; // 1 billion IDR — sanity ceiling for kelurahan fees
const METODE_PEMBAYARAN = ["TUNAI", "TRANSFER", "QRIS", "LAINNYA"];

/* ---------- GET ---------- */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const permohonan = await db.permohonan.findUnique({
    where: { id },
    select: {
      id: true,
      nomorRegister: true,
      statusSaatIni: true,
      pemohonNama: true,
      pemohonNik: true,
      jenisSuratId: true,
    },
  });
  if (!permohonan) return NextResponse.json({ error: "Permohonan tidak ditemukan" }, { status: 404 });

  const biaya = await db.biayaOperasional.findUnique({
    where: { permohonanId: id },
  });

  return NextResponse.json({ biaya, permohonan });
}

/* ---------- POST (create) ---------- */
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

  const permohonan = await db.permohonan.findUnique({
    where: { id },
    select: { id: true, nomorRegister: true, statusSaatIni: true, pemohonNama: true, jenisSuratId: true },
  });
  if (!permohonan) return NextResponse.json({ error: "Permohonan tidak ditemukan" }, { status: 404 });

  // Reject if biaya already exists — use PUT to modify.
  const existing = await db.biayaOperasional.findUnique({ where: { permohonanId: id } });
  if (existing) {
    return NextResponse.json(
      { error: "Biaya operasional sudah ada. Gunakan PUT untuk memperbarui.", biaya: existing },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));

  // Validate nominal — accept either number or numeric string.
  const nominalRaw = body.nominal;
  let nominal: number | null = null;
  if (typeof nominalRaw === "number") nominal = nominalRaw;
  else if (typeof nominalRaw === "string") nominal = parseInt(nominalRaw.replace(/[^\d]/g, ""), 10);
  if (nominal == null || isNaN(nominal) || nominal < 0) {
    return NextResponse.json({ error: "Nominal biaya wajib diisi (angka >= 0)" }, { status: 400 });
  }
  if (nominal > MAX_NOMINAL) {
    return NextResponse.json(
      { error: `Nominal melebihi batas wajar (maks. Rp ${MAX_NOMINAL.toLocaleString("id-ID")})` },
      { status: 400 }
    );
  }

  const keterangan = body.keterangan ? String(body.keterangan).trim().slice(0, 1000) : null;

  let tanggalJatuhTempo: Date | null = null;
  if (body.tanggalJatuhTempo) {
    const d = new Date(body.tanggalJatuhTempo);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "Format tanggalJatuhTempo tidak valid (YYYY-MM-DD)" }, { status: 400 });
    }
    tanggalJatuhTempo = d;
  }

  const catatan = body.catatan ? String(body.catatan).trim().slice(0, 1000) : null;

  const biaya = await db.biayaOperasional.create({
    data: {
      permohonanId: id,
      nominal,
      keterangan,
      tanggalJatuhTempo,
      catatan,
      statusPembayaran: "BELUM_LUNAS",
      createdBy: current.user.id,
    },
  });

  await writeAudit(current.session, {
    aksi: "CREATE",
    modul: "PERMOHONAN",
    entitasId: id,
    detail: `Buat biaya operasional untuk ${permohonan.nomorRegister}: Rp ${nominal.toLocaleString("id-ID")}${keterangan ? ` — ${keterangan}` : ""}`,
  });

  return NextResponse.json({ biaya }, { status: 201 });
}

/* ---------- PUT (update nominal / keterangan / due date / catatan) ---------- */
// Note: payment-status transitions are handled by the dedicated /bayar and
// /batal-bayar endpoints. This PUT only updates the editable metadata fields
// while a biaya is still BELUM_LUNAS (or for admin, even when LUNAS to fix typos).
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["PETUGAS", "ADMIN"].includes(current.user.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  const { id } = await params;

  const existing = await db.biayaOperasional.findUnique({ where: { permohonanId: id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Biaya operasional belum ada. Gunakan POST untuk membuat." },
      { status: 404 }
    );
  }

  // Once LUNAS, only ADMIN may modify the nominal/keterangan (to prevent
  // tampering with the receipt's underlying fee after the fact).
  if (existing.statusPembayaran === "LUNAS" && current.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Biaya yang sudah lunas hanya dapat diubah oleh admin." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const data: any = { updatedBy: current.user.id };

  if ("nominal" in body) {
    const nominalRaw = body.nominal;
    let nominal: number | null = null;
    if (typeof nominalRaw === "number") nominal = nominalRaw;
    else if (typeof nominalRaw === "string") nominal = parseInt(nominalRaw.replace(/[^\d]/g, ""), 10);
    if (nominal == null || isNaN(nominal) || nominal < 0) {
      return NextResponse.json({ error: "Nominal tidak valid (angka >= 0)" }, { status: 400 });
    }
    if (nominal > MAX_NOMINAL) {
      return NextResponse.json({ error: "Nominal melebihi batas wajar" }, { status: 400 });
    }
    data.nominal = nominal;
  }

  if ("keterangan" in body) {
    data.keterangan = body.keterangan ? String(body.keterangan).trim().slice(0, 1000) : null;
  }

  if ("tanggalJatuhTempo" in body) {
    if (body.tanggalJatuhTempo === null || body.tanggalJatuhTempo === "") {
      data.tanggalJatuhTempo = null;
    } else {
      const d = new Date(body.tanggalJatuhTempo);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "Format tanggalJatuhTempo tidak valid" }, { status: 400 });
      }
      data.tanggalJatuhTempo = d;
    }
  }

  if ("catatan" in body) {
    data.catatan = body.catatan ? String(body.catatan).trim().slice(0, 1000) : null;
  }

  // metodePembayaran can also be edited here (e.g., correcting a typo)
  if ("metodePembayaran" in body) {
    const mp = body.metodePembayaran;
    if (mp === null || mp === "") data.metodePembayaran = null;
    else if (METODE_PEMBAYARAN.includes(mp)) data.metodePembayaran = mp;
    else return NextResponse.json({ error: `Metode pembayaran tidak valid: ${mp}` }, { status: 400 });
  }

  const biaya = await db.biayaOperasional.update({ where: { permohonanId: id }, data });

  await writeAudit(current.session, {
    aksi: "UPDATE",
    modul: "PERMOHONAN",
    entitasId: id,
    detail: `Perbarui biaya operasional: ${Object.keys(data).filter((k) => k !== "updatedBy").join(", ") || "(no change)"}`,
  });

  return NextResponse.json({ biaya });
}
