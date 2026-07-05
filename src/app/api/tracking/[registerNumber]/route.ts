import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { STATUS_BY_KODE, buildStages } from "@/lib/constants";

// PUBLIC tracking — no auth required
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ registerNumber: string }> }
) {
  const { registerNumber } = await params;
  const reg = decodeURIComponent(registerNumber).trim().toUpperCase();

  const permohonan = await db.permohonan.findUnique({
    where: { nomorRegister: reg },
    include: {
      jenisSurat: true,
      riwayat: { orderBy: { createdAt: "asc" }, include: { petugas: { select: { name: true, position: true } } } },
      dokumen: { orderBy: { createdAt: "desc" } },
      creator: { select: { name: true, position: true } },
    },
  });

  if (!permohonan) {
    return NextResponse.json({ error: "Nomor register tidak ditemukan. Periksa kembali nomor register Anda." }, { status: 404 });
  }

  const stages = buildStages({
    butuhPengukuran: permohonan.jenisSurat.butuhPengukuran,
    butuhTtdCamat: permohonan.jenisSurat.butuhTtdCamat,
  });

  const currentStatusDef = STATUS_BY_KODE[permohonan.statusSaatIni];
  const currentIndex = stages.indexOf(permohonan.statusSaatIni);

  return NextResponse.json({
    nomorRegister: permohonan.nomorRegister,
    pemohonNama: permohonan.pemohonNama,
    pemohonNik: permohonan.pemohonNik,
    jenisSurat: permohonan.jenisSurat.nama,
    keperluan: permohonan.keperluan,
    statusSaatIni: permohonan.statusSaatIni,
    statusNama: currentStatusDef?.nama || permohonan.statusSaatIni,
    statusWarna: currentStatusDef?.warna || "#d4af37",
    statusKeterangan: currentStatusDef?.keterangan,
    isFinal: currentStatusDef?.isFinal,
    isKhusus: currentStatusDef?.isKhusus,
    alasanDitolak: permohonan.alasanDitolak,
    catatan: permohonan.catatan,
    prioritas: permohonan.prioritas,
    createdAt: permohonan.createdAt,
    updatedAt: permohonan.updatedAt,
    tanggalSelesai: permohonan.tanggalSelesai,
    lokasiTanah: permohonan.lokasiTanah,
    luasTanah: permohonan.luasTanah,
    stages,
    currentIndex,
    riwayat: permohonan.riwayat.map((r) => ({
      id: r.id,
      statusKode: r.statusKode,
      statusNama: r.statusNama,
      catatan: r.catatan,
      petugas: r.petugas?.name || "Sistem",
      petugasJabatan: r.petugas?.position,
      tanggal: r.createdAt,
    })),
    dokumenCount: permohonan.dokumen.length,
    dokumen: permohonan.dokumen.map((d) => ({
      id: d.id,
      jenisDokumen: d.jenisDokumen,
      namaFile: d.namaFile,
      createdAt: d.createdAt,
    })),
    // Revision docs uploaded by pemohon (via public tracking page)
    revisiDokumen: permohonan.dokumen
      .filter((d) => d.isRevisionUpload)
      .map((d) => ({
        id: d.id,
        jenisDokumen: d.jenisDokumen,
        namaFile: d.namaFile,
        filePath: d.filePath,
        ukuran: d.ukuran,
        mimeType: d.mimeType,
        uploadedBy: d.uploadedBy,
        isRevisionUpload: d.isRevisionUpload,
        catatanPemohon: d.catatanPemohon,
        createdAt: d.createdAt,
      })),
    revisiDokumenCount: permohonan.dokumen.filter((d) => d.isRevisionUpload).length,
    revisiUploadEnabled: permohonan.statusSaatIni === "REVISI",
  });
}
