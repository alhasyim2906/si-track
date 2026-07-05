import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

/* ============================================================
   Arsip Surat Tanah — per-permohonan archive API
   The Arsip is the single canonical "finished" surat tanah
   document that MUST be uploaded before a permohonan can be
   moved to status SELESAI (enforced in /api/permohonan/[id]/status).

   Endpoints:
     GET    /api/permohonan/[id]/arsip       — fetch arsip for this permohonan
     POST   /api/permohonan/[id]/arsip       — upload arsip (multipart: file + metadata)
     PUT    /api/permohonan/[id]/arsip       — update metadata OR replace file
     DELETE /api/permohonan/[id]/arsip       — delete arsip (revert to "not yet archived")
   ============================================================ */

const MAX_FILE_MB = 25;
const ALLOWED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function extFromName(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "bin";
}

async function sha256OfFile(buffer: Buffer): Promise<string> {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function deleteFileIfExists(relativePath?: string | null) {
  if (!relativePath) return;
  try {
    await fs.unlink(path.join(process.cwd(), "public", relativePath.replace(/^\//, "")));
  } catch {
    /* file may not exist */
  }
}

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
      jenisSuratId: true,
      pemohonNama: true,
    },
  });
  if (!permohonan) return NextResponse.json({ error: "Permohonan tidak ditemukan" }, { status: 404 });

  const arsip = await db.arsipSuratTanah.findUnique({
    where: { permohonanId: id },
  });

  return NextResponse.json({ arsip, permohonan });
}

/* ---------- POST (upload new arsip) ---------- */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["PETUGAS", "ADMIN", "ATASAN"].includes(current.user.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  const { id } = await params;

  const permohonan = await db.permohonan.findUnique({
    where: { id },
    select: { id: true, nomorRegister: true, statusSaatIni: true, pemohonNama: true },
  });
  if (!permohonan) return NextResponse.json({ error: "Permohonan tidak ditemukan" }, { status: 404 });

  // Reject if an arsip already exists — use PUT to replace.
  const existing = await db.arsipSuratTanah.findUnique({ where: { permohonanId: id } });
  if (existing) {
    return NextResponse.json(
      { error: "Arsip sudah ada. Gunakan PUT untuk mengganti file atau memperbarui metadata." },
      { status: 409 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Body multipart/form-data tidak valid" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "File arsip wajib diunggah" }, { status: 400 });
  }

  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json(
      { error: `Tipe file tidak didukung: ${file.type}. Diterima: PDF, PNG, JPEG, WEBP, DOC, DOCX.` },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `Ukuran file melebihi ${MAX_FILE_MB}MB (ukuran: ${(file.size / 1024 / 1024).toFixed(2)}MB)` },
      { status: 400 }
    );
  }

  const nomorSurat = (String(form.get("nomorSurat") || "")).trim() || null;
  const tanggalTerbitRaw = (String(form.get("tanggalTerbit") || "")).trim();
  const tanggalTerbit = tanggalTerbitRaw ? new Date(tanggalTerbitRaw) : null;
  if (tanggalTerbitRaw && isNaN(tanggalTerbit!.getTime())) {
    return NextResponse.json({ error: "Format tanggalTerbit tidak valid (YYYY-MM-DD)" }, { status: 400 });
  }
  const pejabatPenerbit = (String(form.get("pejabatPenerbit") || "")).trim() || null;
  const jabatanPejabat = (String(form.get("jabatanPejabat") || "")).trim() || null;
  const nomorLembar = (String(form.get("nomorLembar") || "")).trim() || null;
  const lokasiArsip = (String(form.get("lokasiArsip") || "")).trim() || null;
  const catatan = (String(form.get("catatan") || "")).trim() || null;

  // Save file to /public/uploads/permohonan/{id}/arsip/
  const dir = path.join(process.cwd(), "public", "uploads", "permohonan", id, "arsip");
  await fs.mkdir(dir, { recursive: true });

  const ext = extFromName(file.name);
  const safeName = `arsip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const absPath = path.join(dir, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absPath, buffer);
  const fileHash = await sha256OfFile(buffer);

  const filePath = `/uploads/permohonan/${id}/arsip/${safeName}`;

  const arsip = await db.arsipSuratTanah.create({
    data: {
      permohonanId: id,
      nomorSurat,
      tanggalTerbit,
      pejabatPenerbit,
      jabatanPejabat,
      nomorLembar,
      lokasiArsip,
      catatan,
      namaFile: file.name,
      filePath,
      ukuran: file.size,
      mimeType: file.type,
      fileHash,
      uploadedBy: current.user.id,
    },
  });

  await writeAudit(current.session, {
    aksi: "CREATE",
    modul: "PERMOHONAN",
    entitasId: id,
    detail: `Upload arsip surat tanah untuk ${permohonan.nomorRegister}: ${file.name} (${(file.size / 1024).toFixed(0)} KB)${nomorSurat ? `, No. ${nomorSurat}` : ""}`,
  });

  return NextResponse.json({ arsip }, { status: 201 });
}

/* ---------- PUT (update metadata OR replace file) ---------- */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["PETUGAS", "ADMIN", "ATASAN"].includes(current.user.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  const { id } = await params;

  const existing = await db.arsipSuratTanah.findUnique({ where: { permohonanId: id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Arsip belum ada. Gunakan POST untuk mengunggah arsip pertama kali." },
      { status: 404 }
    );
  }

  // Detect content type to decide JSON metadata update vs multipart file replacement.
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    // -------- Replace file (+ optionally update metadata) --------
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "Body multipart/form-data tidak valid" }, { status: 400 });
    }
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File wajib diunggah untuk penggantian" }, { status: 400 });
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipe file tidak didukung: ${file.type}` },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `Ukuran file melebihi ${MAX_FILE_MB}MB` },
        { status: 400 }
      );
    }

    // Save new file
    const dir = path.join(process.cwd(), "public", "uploads", "permohonan", id, "arsip");
    await fs.mkdir(dir, { recursive: true });
    const ext = extFromName(file.name);
    const safeName = `arsip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const absPath = path.join(dir, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absPath, buffer);
    const fileHash = await sha256OfFile(buffer);
    const filePath = `/uploads/permohonan/${id}/arsip/${safeName}`;

    // Delete old file
    await deleteFileIfExists(existing.filePath);

    // Optional metadata fields (override existing if provided)
    const nomorSurat = form.get("nomorSurat") != null ? (String(form.get("nomorSurat")).trim() || null) : existing.nomorSurat;
    const tanggalTerbitRaw = form.get("tanggalTerbit") != null ? String(form.get("tanggalTerbit")).trim() : null;
    let tanggalTerbit = existing.tanggalTerbit;
    if (tanggalTerbitRaw !== null) {
      tanggalTerbit = tanggalTerbitRaw ? new Date(tanggalTerbitRaw) : null;
      if (tanggalTerbitRaw && isNaN(tanggalTerbit!.getTime())) {
        return NextResponse.json({ error: "Format tanggalTerbit tidak valid" }, { status: 400 });
      }
    }
    const pejabatPenerbit = form.get("pejabatPenerbit") != null ? (String(form.get("pejabatPenerbit")).trim() || null) : existing.pejabatPenerbit;
    const jabatanPejabat = form.get("jabatanPejabat") != null ? (String(form.get("jabatanPejabat")).trim() || null) : existing.jabatanPejabat;
    const nomorLembar = form.get("nomorLembar") != null ? (String(form.get("nomorLembar")).trim() || null) : existing.nomorLembar;
    const lokasiArsip = form.get("lokasiArsip") != null ? (String(form.get("lokasiArsip")).trim() || null) : existing.lokasiArsip;
    const catatan = form.get("catatan") != null ? (String(form.get("catatan")).trim() || null) : existing.catatan;

    const arsip = await db.arsipSuratTanah.update({
      where: { permohonanId: id },
      data: {
        nomorSurat, tanggalTerbit, pejabatPenerbit, jabatanPejabat,
        nomorLembar, lokasiArsip, catatan,
        namaFile: file.name, filePath, ukuran: file.size, mimeType: file.type, fileHash,
      },
    });

    await writeAudit(current.session, {
      aksi: "UPDATE",
      modul: "PERMOHONAN",
      entitasId: id,
      detail: `Ganti file arsip: ${existing.namaFile} -> ${file.name} (${(file.size / 1024).toFixed(0)} KB)`,
    });

    return NextResponse.json({ arsip });
  }

  // -------- JSON metadata-only update --------
  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if ("nomorSurat" in body) data.nomorSurat = body.nomorSurat ? String(body.nomorSurat).trim() || null : null;
  if ("tanggalTerbit" in body) {
    if (body.tanggalTerbit === null || body.tanggalTerbit === "") data.tanggalTerbit = null;
    else {
      const d = new Date(body.tanggalTerbit);
      if (isNaN(d.getTime())) return NextResponse.json({ error: "Format tanggalTerbit tidak valid" }, { status: 400 });
      data.tanggalTerbit = d;
    }
  }
  if ("pejabatPenerbit" in body) data.pejabatPenerbit = body.pejabatPenerbit ? String(body.pejabatPenerbit).trim() || null : null;
  if ("jabatanPejabat" in body) data.jabatanPejabat = body.jabatanPejabat ? String(body.jabatanPejabat).trim() || null : null;
  if ("nomorLembar" in body) data.nomorLembar = body.nomorLembar ? String(body.nomorLembar).trim() || null : null;
  if ("lokasiArsip" in body) data.lokasiArsip = body.lokasiArsip ? String(body.lokasiArsip).trim() || null : null;
  if ("catatan" in body) data.catatan = body.catatan ? String(body.catatan).trim() || null : null;

  const arsip = await db.arsipSuratTanah.update({ where: { permohonanId: id }, data });

  await writeAudit(current.session, {
    aksi: "UPDATE",
    modul: "PERMOHONAN",
    entitasId: id,
    detail: `Perbarui metadata arsip surat tanah: ${Object.keys(data).join(", ")}`,
  });

  return NextResponse.json({ arsip });
}

/* ---------- DELETE ---------- */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["PETUGAS", "ADMIN"].includes(current.user.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  const { id } = await params;

  const existing = await db.arsipSuratTanah.findUnique({ where: { permohonanId: id } });
  if (!existing) return NextResponse.json({ error: "Arsip tidak ditemukan" }, { status: 404 });

  await deleteFileIfExists(existing.filePath);
  await db.arsipSuratTanah.delete({ where: { permohonanId: id } });

  await writeAudit(current.session, {
    aksi: "DELETE",
    modul: "PERMOHONAN",
    entitasId: id,
    detail: `Hapus arsip surat tanah: ${existing.namaFile}`,
  });

  return NextResponse.json({ ok: true });
}
