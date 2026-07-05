import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { JENIS_DOKUMEN } from "@/lib/constants";
import fs from "fs/promises";
import path from "path";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const dokumen = await db.dokumen.findMany({
    where: { permohonanId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ dokumen });
}

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

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const jenisDokumen = (formData.get("jenisDokumen") as string) || "DOKUMEN_PENDUKUNG";
  if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  if (!JENIS_DOKUMEN.find((j) => j.kode === jenisDokumen)) {
    return NextResponse.json({ error: "Jenis dokumen tidak valid" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "permohonan", id);
  await fs.mkdir(uploadDir, { recursive: true });
  const ext = path.extname(file.name) || "";
  const safeName = `${jenisDokumen}-${Date.now()}${ext}`;
  const filePath = path.join(uploadDir, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  const dok = await db.dokumen.create({
    data: {
      permohonanId: id,
      jenisDokumen,
      namaFile: file.name,
      filePath: `/uploads/permohonan/${id}/${safeName}`,
      ukuran: file.size,
      mimeType: file.type,
    },
  });

  await writeAudit(current.session, {
    aksi: "CREATE",
    modul: "PERMOHONAN",
    entitasId: id,
    detail: `Upload dokumen ${jenisDokumen}: ${file.name}`,
  });

  return NextResponse.json({ dokumen: dok }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["PETUGAS", "ADMIN"].includes(current.user.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const dokId = searchParams.get("dokId");
  if (!dokId) return NextResponse.json({ error: "dokId required" }, { status: 400 });
  const dok = await db.dokumen.findUnique({ where: { id: dokId } });
  if (!dok) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  try {
    await fs.unlink(path.join(process.cwd(), "public", dok.filePath));
  } catch {}
  await db.dokumen.delete({ where: { id: dokId } });
  return NextResponse.json({ ok: true });
}
