import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, generateNomorRegister } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { STATUS_BY_KODE, NOTIF_TEMPLATES } from "@/lib/constants";
import { generateTandaTerimaPdf, generateQrPngBuffer } from "@/lib/tanda-terima-pdf";
import { dispatchTandaTerimaNotification } from "@/lib/notify";
import { resolvePublicBaseUrl } from "@/lib/public-url";

// GET /api/permohonan — list with filters (auth: staff)
// Query params:
//   q            — search string (matches nomorRegister, pemohonNama, pemohonNik)
//   status       — statusSaatIni kode
//   jenisSuratId —
//   petugasId    — createdBy filter
//   prioritas    —
//   dariTanggal  — YYYY-MM-DD inclusive lower bound on createdAt
//   sampaiTanggal— YYYY-MM-DD inclusive upper bound on createdAt (whole day)
//   page, limit, year
export async function GET(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const q = searchParams.get("q") || undefined;
  const jenisSuratId = searchParams.get("jenisSuratId") || undefined;
  const petugasId = searchParams.get("petugasId") || undefined;
  const prioritas = searchParams.get("prioritas") || undefined;
  const dariTanggal = searchParams.get("dariTanggal") || undefined;
  const sampaiTanggal = searchParams.get("sampaiTanggal") || undefined;
  const year = searchParams.get("year") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: any = {};
  if (status) where.statusSaatIni = status;
  if (jenisSuratId) where.jenisSuratId = jenisSuratId;
  if (petugasId) where.createdBy = petugasId;
  if (prioritas) where.prioritas = prioritas;
  if (q) {
    where.OR = [
      { nomorRegister: { contains: q } },
      { pemohonNama: { contains: q } },
      { pemohonNik: { contains: q } },
    ];
  }

  // Date range filter on createdAt
  // dariTanggal: inclusive (>= start of dariTanggal day)
  // sampaiTanggal: inclusive (< start of (sampaiTanggal + 1 day))
  const dateFilter: any = {};
  if (dariTanggal) {
    const start = new Date(`${dariTanggal}T00:00:00.000`);
    if (!isNaN(start.getTime())) dateFilter.gte = start;
  }
  if (sampaiTanggal) {
    // upper bound = day after sampaiTanggal at 00:00:00
    const end = new Date(`${sampaiTanggal}T00:00:00.000`);
    if (!isNaN(end.getTime())) {
      end.setDate(end.getDate() + 1);
      dateFilter.lt = end;
    }
  }
  if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;

  // Year filter (backwards-compat). If a date range is already provided, year is ignored
  // to avoid conflicting bounds.
  if (year && !dariTanggal && !sampaiTanggal) {
    const y = parseInt(year);
    if (!Number.isNaN(y)) {
      where.AND = [
        { createdAt: { gte: new Date(y, 0, 1, 0, 0, 0, 0) } },
        { createdAt: { lte: new Date(y, 11, 31, 23, 59, 59, 999) } },
      ];
    }
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
        pemohonEmail: body.pemohonEmail || null,
        lokasiTanah: body.lokasiTanah || null,
        tanahRt: body.tanahRt || null,
        tanahRw: body.tanahRw || null,
        // luasTanah is String? in the schema — coerce to string in case the
        // client sent a Number. Preserve null when empty.
        luasTanah: body.luasTanah != null && body.luasTanah !== ""
          ? String(body.luasTanah).trim()
          : null,
        batasUtara: body.batasUtara || null,
        batasSelatan: body.batasSelatan || null,
        batasTimur: body.batasTimur || null,
        batasBarat: body.batasBarat || null,
        statusPenguasaan: body.statusPenguasaan || null,
        keperluan: body.keperluan || null,
        prioritas: body.prioritas || "NORMAL",
        statusSaatIni: "PENGAJUAN",
        createdBy: current.user.id,
        // Optional: create initial riwayat tanah entries inline
        riwayatTanah: Array.isArray(body.riwayatTanah) && body.riwayatTanah.length > 0
          ? {
              create: body.riwayatTanah
                .filter((r: any) => r && typeof r === "object")
                .map((r: any, idx: number) => ({
                  urutan: typeof r.urutan === "number" ? r.urutan : idx + 1,
                  tahun: r.tahun?.toString().trim() || null,
                  pemilikSebelumnya: r.pemilikSebelumnya?.toString().trim() || null,
                  hubunganPemilik: r.hubunganPemilik?.toString().trim() || null,
                  caraPerolehan: r.caraPerolehan?.toString().trim() || null,
                  noDokumen: r.noDokumen?.toString().trim() || null,
                  keterangan: r.keterangan?.toString().trim() || null,
                })),
            }
          : undefined,
      },
      include: { jenisSurat: true, riwayatTanah: true },
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

    // ===== Fire-and-forget: send Tanda Terima via Email + WhatsApp =====
    // The PDF is generated server-side and attached to the email. WhatsApp
    // gets a text message with the tracking link (PDF attachment via Fonnte
    // requires a public URL — see /tanda-terima/send route for details).
    //
    // We deliberately do NOT `await` this — the user should get an immediate
    // 201 response with the permohonan data, and the notification dispatch
    // continues in the background. Failures are logged to AuditLog inside
    // `dispatchTandaTerimaNotification`.
    //
    // We wrap it in a try/catch + IIFE so any sync error before the first
    // `await` doesn't crash the process. Async errors are caught inside the
    // dispatcher.
    (async () => {
      try {
        // Re-fetch the permohonan with relations needed for the PDF.
        const pForPdf = await db.permohonan.findUnique({
          where: { id: permohonan.id },
          include: {
            jenisSurat: { select: { nama: true, kode: true } },
            creator: { select: { name: true, position: true } },
          },
        });
        if (!pForPdf) return;

        // Build the QR code (encodes public tracking URL).
        const baseUrl = await resolvePublicBaseUrl();
        const trackUrl = `${baseUrl}/?track=${encodeURIComponent(pForPdf.nomorRegister)}`;
        const qrPng = await generateQrPngBuffer(trackUrl, 240);

        // Fetch kelurahan settings for letterhead + notify templates/creds.
        const settings = await db.settings.findMany();
        const settingsMap: Record<string, string> = {};
        for (const s of settings) settingsMap[s.key] = s.value || "";

        // Generate the PDF buffer (kept in memory).
        const pdfBuffer = await generateTandaTerimaPdf(
          {
            nomorRegister: pForPdf.nomorRegister,
            statusSaatIni: pForPdf.statusSaatIni,
            statusNama: STATUS_BY_KODE[pForPdf.statusSaatIni]?.nama || pForPdf.statusSaatIni,
            prioritas: pForPdf.prioritas,
            keperluan: pForPdf.keperluan,
            catatan: pForPdf.catatan,
            createdAt: pForPdf.createdAt,
            jenisSurat: {
              nama: pForPdf.jenisSurat.nama,
              kode: pForPdf.jenisSurat.kode || undefined,
            },
            creator: pForPdf.creator
              ? { name: pForPdf.creator.name, position: pForPdf.creator.position }
              : null,
            pemohonNik: pForPdf.pemohonNik,
            pemohonNama: pForPdf.pemohonNama,
            pemohonTempatLahir: pForPdf.pemohonTempatLahir,
            pemohonTanggalLahir: pForPdf.pemohonTanggalLahir,
            pemohonAlamat: pForPdf.pemohonAlamat,
            pemohonRt: pForPdf.pemohonRt,
            pemohonRw: pForPdf.pemohonRw,
            pemohonHp: pForPdf.pemohonHp,
            pemohonEmail: pForPdf.pemohonEmail,
            lokasiTanah: pForPdf.lokasiTanah,
            tanahRt: pForPdf.tanahRt,
            tanahRw: pForPdf.tanahRw,
            luasTanah: pForPdf.luasTanah,
            batasUtara: pForPdf.batasUtara,
            batasSelatan: pForPdf.batasSelatan,
            batasTimur: pForPdf.batasTimur,
            batasBarat: pForPdf.batasBarat,
            statusPenguasaan: pForPdf.statusPenguasaan,
          },
          {
            qrPngBuffer: qrPng,
            kelurahan: {
              nama: settingsMap.nama_kelurahan || undefined,
              alamat: settingsMap.alamat_kelurahan || undefined,
              telepon: settingsMap.telepon_kelurahan || undefined,
              email: settingsMap.email_kelurahan || undefined,
            },
          }
        );

        const pdfFilename = `Tanda-Terima-${pForPdf.nomorRegister}.pdf`;

        // Dispatch email + WhatsApp (fire-and-forget within fire-and-forget
        // is fine — the dispatcher handles its own errors + audit log).
        await dispatchTandaTerimaNotification(
          pForPdf.id,
          {
            nomorRegister: pForPdf.nomorRegister,
            pemohonNama: pForPdf.pemohonNama,
            pemohonHp: pForPdf.pemohonHp,
            pemohonEmail: pForPdf.pemohonEmail,
            statusNama: STATUS_BY_KODE[pForPdf.statusSaatIni]?.nama || pForPdf.statusSaatIni,
            jenisSuratNama: pForPdf.jenisSurat.nama,
            kelurahanNama: settingsMap.nama_kelurahan,
            kelurahanAlamat: settingsMap.alamat_kelurahan,
            kelurahanTelepon: settingsMap.telepon_kelurahan,
            kelurahanEmail: settingsMap.email_kelurahan,
            appUrl: trackUrl,
            pdfBuffer,
            pdfFilename,
            // pdfPublicUrl is intentionally undefined — see /tanda-terima/send
            // route comment for why we can't attach the PDF directly via Fonnte.
            pdfPublicUrl: undefined,
          },
          current.user.id,
          { force: false } // respect notify_tanda_terima_auto setting
        );
      } catch (e: any) {
        // Don't let the notification failure crash the request — log it.
        console.error("[permohonan POST] tanda terima dispatch failed:", e);
        try {
          await db.auditLog.create({
            data: {
              userId: current.user.id,
              aksi: "TANDA_TERIMA_DISPATCH_ERROR",
              modul: "PERMOHONAN",
              entitasId: permohonan.id,
              detail: `Gagal mengirim tanda terima otomatis: ${e?.message || String(e)}`,
            },
          });
        } catch {
          // swallow — last-resort
        }
      }
    })();

    return NextResponse.json({ permohonan }, { status: 201 });
  } catch (e) {
    console.error("create permohonan error", e);
    return NextResponse.json({ error: "Gagal membuat permohonan" }, { status: 500 });
  }
}
