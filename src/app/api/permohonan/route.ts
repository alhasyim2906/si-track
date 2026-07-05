import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, generateNomorRegister } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { STATUS_BY_KODE, NOTIF_TEMPLATES } from "@/lib/constants";

// GET /api/permohonan — list with filters (auth: staff)
export async function GET(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const q = searchParams.get("q") || undefined;
  const jenisSuratId = searchParams.get("jenisSuratId") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: any = {};
  if (status) where.statusSaatIni = status;
  if (jenisSuratId) where.jenisSuratId = jenisSuratId;
  if (q) {
    where.OR = [
      { nomorRegister: { contains: q } },
      { pemohonNama: { contains: q } },
      { pemohonNik: { contains: q } },
    ];
  }

  const [total, items] = await Promise.all([
    db.permohonan.count({ where }),
    db.permohonan.findMany({
      where,
      include: {
        jenisSurat: { select: { nama: true, kode: true, butuhPengukuran: true, butuhTtdCamat: true } },
        creator: { select: { name: true } },
        _count: { select: { dokumen: true, riwayat: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    limit,
    items: items.map((p) => ({
      ...p,
      statusNama: STATUS_BY_KODE[p.statusSaatIni]?.nama || p.statusSaatIni,
      statusWarna: STATUS_BY_KODE[p.statusSaatIni]?.warna || "#d4af37",
    })),
  });
}

// POST /api/permohonan — create (auth: PETUGAS / ADMIN)
export async function POST(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["PETUGAS", "ADMIN"].includes(current.user.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const nomorRegister = await generateNomorRegister();

    const permohonan = await db.permohonan.create({
      data: {
        nomorRegister,
        jenisSuratId: body.jenisSuratId,
        pemohonNik: body.pemohonNik,
        pemohonNama: body.pemohonNama,
        pemohonTempatLahir: body.pemohonTempatLahir || null,
        pemohonTanggalLahir: body.pemohonTanggalLahir || null,
        pemohonAlamat: body.pemohonAlamat || null,
        pemohonRt: body.pemohonRt || null,
        pemohonRw: body.pemohonRw || null,
        pemohonHp: body.pemohonHp || null,
        lokasiTanah: body.lokasiTanah || null,
        tanahRt: body.tanahRt || null,
        tanahRw: body.tanahRw || null,
        luasTanah: body.luasTanah || null,
        batasUtara: body.batasUtara || null,
        batasSelatan: body.batasSelatan || null,
        batasTimur: body.batasTimur || null,
        batasBarat: body.batasBarat || null,
        statusPenguasaan: body.statusPenguasaan || null,
        keperluan: body.keperluan || null,
        prioritas: body.prioritas || "NORMAL",
        statusSaatIni: "PENGAJUAN",
        createdBy: current.user.id,
      },
      include: { jenisSurat: true },
    });

    // initial riwayat
    await db.riwayatProses.create({
      data: {
        permohonanId: permohonan.id,
        statusKode: "PENGAJUAN",
        statusNama: STATUS_BY_KODE["PENGAJUAN"].nama,
        catatan: "Berkas diterima dan didaftarkan oleh petugas.",
        petugasId: current.user.id,
      },
    });

    // notification
    const tpl = NOTIF_TEMPLATES.BERKAS_DITERIMA(nomorRegister, permohonan.pemohonNama);
    await db.notifikasi.create({ data: { permohonanId: permohonan.id, judul: tpl.judul, pesan: tpl.pesan, tipe: tpl.tipe } });

    await writeAudit(current.session, {
      aksi: "CREATE",
      modul: "PERMOHONAN",
      entitasId: permohonan.id,
      detail: `Mendaftarkan permohonan ${nomorRegister} atas nama ${permohonan.pemohonNama}`,
    });

    return NextResponse.json({ permohonan }, { status: 201 });
  } catch (e) {
    console.error("create permohonan error", e);
    return NextResponse.json({ error: "Gagal membuat permohonan" }, { status: 500 });
  }
}
