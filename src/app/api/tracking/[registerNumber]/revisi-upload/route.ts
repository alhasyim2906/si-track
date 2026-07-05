import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { JENIS_DOKUMEN } from "@/lib/constants";
import fs from "fs/promises";
import path from "path";

// ============================================================
// PUBLIC revision upload endpoint (no auth required).
//
// Pemohon can upload requested documents when their permohonan
// is in REVISI status. Files are saved with isRevisionUpload=true
// and uploadedBy="PEMOHON" so petugas can distinguish them.
//
// POST /api/tracking/[registerNumber]/revisi-upload
//   FormData:
//     - files: File[] (one or more; same key "files" repeated)
//     - jenisDokumen: string (one of JENIS_DOKUMEN.kode)
//     - catatan?: string (optional note from pemohon)
//
// Returns:
//   200: { ok, count, total, dokumen: Dokumen[], errors?: [] }
//   400: validation errors
//   403: permohonan not in REVISI status
//   404: register number not found
//   413: file too large
// ============================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_REQUEST = 20;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "application/pdf",
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ registerNumber: string }> }
) {
  const { registerNumber } = await params;
  const reg = decodeURIComponent(registerNumber).trim().toUpperCase();

  // 1. Find permohonan by register number
  const permohonan = await db.permohonan.findUnique({
    where: { nomorRegister: reg },
    select: { id: true, statusSaatIni: true, pemohonNama: true },
  });

  if (!permohonan) {
    return NextResponse.json(
      { error: "Nomor register tidak ditemukan. Periksa kembali nomor register Anda." },
      { status: 404 }
    );
  }

  // 2. Must be in REVISI status
  if (permohonan.statusSaatIni !== "REVISI") {
    return NextResponse.json(
      {
        error:
          "Unggahan dokumen perbaikan hanya tersedia ketika status permohonan adalah 'Perbaikan Dokumen' (REVISI).",
        statusSaatIni: permohonan.statusSaatIni,
      },
      { status: 403 }
    );
  }

  // 3. Parse formData
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 });
  }

  const jenisDokumen = (formData.get("jenisDokumen") as string) || "";
  if (!JENIS_DOKUMEN.find((j) => j.kode === jenisDokumen)) {
    return NextResponse.json(
      { error: "Jenis dokumen tidak valid. Pilih dari daftar yang tersedia." },
      { status: 400 }
    );
  }

  const catatanPemohon = ((formData.get("catatan") as string) || "").trim().slice(0, 500);

  // 4. Collect files
  const files: File[] = [];
  const allEntries = formData.getAll("files");
  for (const f of allEntries) {
    if (f instanceof File) files.push(f);
  }
  // Backward-compat: also accept "file" key
  const single = formData.get("file");
  if (single && single instanceof File) files.push(single);

  if (files.length === 0) {
    return NextResponse.json({ error: "Tidak ada file yang dipilih." }, { status: 400 });
  }
  if (files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json(
      { error: `Maksimal ${MAX_FILES_PER_REQUEST} file per unggahan.` },
      { status: 400 }
    );
  }

  // 5. Validate each file (size + MIME)
  for (const f of files) {
    if (f.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File "${f.name}" melebihi 10 MB. Kompres atau unggah file yang lebih kecil.` },
        { status: 413 }
      );
    }
    // Some browsers may send empty MIME for unusual files; allow only known types
    if (f.type && !ALLOWED_MIME.has(f.type)) {
      return NextResponse.json(
        {
          error: `File "${f.name}" berjenis ${f.type} yang tidak diizinkan. Hanya gambar (JPG/PNG) atau PDF yang diperbolehkan.`,
        },
        { status: 400 }
      );
    }
    // Fallback for empty MIME: check extension
    if (!f.type) {
      const ext = path.extname(f.name).toLowerCase();
      const okExt = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".pdf"];
      if (!okExt.includes(ext)) {
        return NextResponse.json(
          { error: `File "${f.name}" tidak dikenali. Hanya gambar atau PDF yang diperbolehkan.` },
          { status: 400 }
        );
      }
    }
  }

  // 6. Save files
  const uploadDir = path.join(process.cwd(), "public", "uploads", "permohonan", permohonan.id);
  await fs.mkdir(uploadDir, { recursive: true });

  const created: any[] = [];
  const errors: { namaFile: string; error: string }[] = [];

  for (const file of files) {
    try {
      const ext = path.extname(file.name) || "";
      const safeName = `revisi-${jenisDokumen}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}${ext}`;
      const filePath = path.join(uploadDir, safeName);
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      const dok = await db.dokumen.create({
        data: {
          permohonanId: permohonan.id,
          jenisDokumen,
          namaFile: file.name,
          filePath: `/uploads/permohonan/${permohonan.id}/${safeName}`,
          ukuran: file.size,
          mimeType: file.type || guessMime(ext),
          uploadedBy: "PEMOHON",
          isRevisionUpload: true,
          catatanPemohon: catatanPemohon || null,
        },
      });
      created.push(dok);
    } catch (e: any) {
      errors.push({ namaFile: file.name, error: e?.message || "Gagal menyimpan" });
    }
  }

  // 7. Create in-app notification for petugas (permohonan-level)
  if (created.length > 0) {
    try {
      await db.notifikasi.create({
        data: {
          permohonanId: permohonan.id,
          judul: "Unggahan Dokumen Revisi Pemohon",
          pesan: `${permohonan.pemohonNama} (${reg}) mengunggah ${created.length} dokumen revisi: ${
            JENIS_DOKUMEN.find((j) => j.kode === jenisDokumen)?.nama || jenisDokumen
          }${catatanPemohon ? `. Catatan: "${catatanPemohon}"` : ""}`,
          tipe: "INFO",
        },
      });
    } catch (e) {
      console.error("[revisi-upload] failed to create notification", e);
    }

    // Write an audit log entry (anonymous / pemohon action)
    try {
      await db.auditLog.create({
        data: {
          userId: null,
          userName: `Pemohon: ${permohonan.pemohonNama}`,
          userRole: "PEMOHON",
          aksi: "CREATE",
          modul: "PERMOHONAN",
          entitasId: permohonan.id,
          detail: `Pemohon mengunggah ${created.length} dokumen revisi (${jenisDokumen}) via halaman publik${catatanPemohon ? `. Catatan: "${catatanPemohon}"` : ""}`,
          ip: getClientIp(req),
        },
      });
    } catch (e) {
      console.error("[revisi-upload] failed to write audit log", e);
    }
  }

  // 8. Return result
  return NextResponse.json(
    {
      ok: created.length > 0,
      count: created.length,
      total: files.length,
      dokumen: created.map((d) => ({
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
      errors: errors.length ? errors : undefined,
    },
    { status: created.length > 0 ? 201 : 400 }
  );
}

function guessMime(ext: string): string {
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".pdf": "application/pdf",
  };
  return map[ext.toLowerCase()] || "application/octet-stream";
}

function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri;
  return null;
}
