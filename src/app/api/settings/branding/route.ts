import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

/* ============================================================
   Branding asset upload API
   Handles: logo, favicon, app_icon_192, app_icon_512,
            login_bg, hero_banner
   Files are saved to /public/branding/<type>-<hash>.<ext>
   The previous file (if any) is deleted.
   The settings key branding_<type>_url is updated.
   ============================================================ */

const BRANDING_DIR = path.join(process.cwd(), "public", "branding");

// Allowed types and their constraints
interface BrandingSpec {
  key: string;            // settings key suffix
  acceptMime: string[];   // allowed MIME types
  maxMb: number;          // max file size in MB
  recommended?: string;   // hint for the UI
}

const SPECS: Record<string, BrandingSpec> = {
  logo: {
    key: "branding_logo_url",
    acceptMime: ["image/svg+xml", "image/png", "image/jpeg", "image/webp", "image/gif"],
    maxMb: 2,
    recommended: "SVG / PNG transparan, rasio 1:1, min 64×64px",
  },
  favicon: {
    key: "branding_favicon_url",
    acceptMime: ["image/svg+xml", "image/png", "image/x-icon", "image/vnd.microsoft.icon", "image/jpeg", "image/webp"],
    maxMb: 1,
    recommended: "ICO / PNG / SVG, 16×16 atau 32×32px",
  },
  app_icon_192: {
    key: "branding_app_icon_192_url",
    acceptMime: ["image/png", "image/jpeg", "image/webp"],
    maxMb: 1,
    recommended: "PNG 192×192px (PWA icon)",
  },
  app_icon_512: {
    key: "branding_app_icon_512_url",
    acceptMime: ["image/png", "image/jpeg", "image/webp"],
    maxMb: 2,
    recommended: "PNG 512×512px (PWA icon)",
  },
  login_bg: {
    key: "branding_login_bg_url",
    acceptMime: ["image/png", "image/jpeg", "image/webp"],
    maxMb: 5,
    recommended: "Lanskap, min 1280×720px (background halaman login)",
  },
  hero_banner: {
    key: "branding_hero_banner_url",
    acceptMime: ["image/png", "image/jpeg", "image/webp"],
    maxMb: 5,
    recommended: "Lanskap, min 1600×500px (banner landing publik)",
  },
};

function extFromMime(mime: string, originalName?: string): string {
  // Try to extract from original name first
  if (originalName) {
    const m = originalName.toLowerCase().match(/\.([a-z0-9]+)$/);
    if (m) return m[1];
  }
  switch (mime) {
    case "image/svg+xml": return "svg";
    case "image/png": return "png";
    case "image/jpeg": return "jpg";
    case "image/webp": return "webp";
    case "image/gif": return "gif";
    case "image/x-icon":
    case "image/vnd.microsoft.icon": return "ico";
    default: return "bin";
  }
}

async function deleteFileIfExists(relativePath?: string | null) {
  if (!relativePath) return;
  try {
    const abs = path.join(process.cwd(), "public", relativePath.replace(/^\//, ""));
    await fs.unlink(abs);
  } catch {
    /* ignore — file may not exist */
  }
}

/* ---------------- GET — current branding settings ---------------- */
export async function GET() {
  const items = await db.settings.findMany({
    where: { key: { startsWith: "branding_" } },
  });
  const branding: Record<string, string> = {};
  for (const s of items) branding[s.key] = s.value || "";
  return NextResponse.json({ branding, specs: SPECS });
}

/* ---------------- POST — upload one asset ---------------- */
export async function POST(req: Request) {
  const result = await getCurrentUser();
  if (!result || result.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Akses ditolak. Hanya ADMIN yang dapat mengunggah aset branding." }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Body multipart/form-data tidak valid" }, { status: 400 });
  }

  const type = String(form.get("type") || "");
  const spec = SPECS[type];
  if (!spec) {
    return NextResponse.json({ error: `Tipe tidak dikenal. Pilihan: ${Object.keys(SPECS).join(", ")}` }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "File wajib diunggah" }, { status: 400 });
  }

  // MIME & size validation
  if (!spec.acceptMime.includes(file.type)) {
    return NextResponse.json(
      { error: `Tipe file tidak didukung untuk ${type}. Diterima: ${spec.acceptMime.join(", ")}` },
      { status: 400 }
    );
  }
  const maxBytes = spec.maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `Ukuran file melebihi batas ${spec.maxMb}MB (ukuran: ${(file.size / 1024 / 1024).toFixed(2)}MB)` },
      { status: 400 }
    );
  }

  // Ensure branding dir exists
  await fs.mkdir(BRANDING_DIR, { recursive: true });

  // Delete previous file (look up setting first)
  const prev = await db.settings.findUnique({ where: { key: spec.key } });
  if (prev?.value) await deleteFileIfExists(prev.value);

  // Save new file — name: <type>-<8char-random>.<ext>
  const hash = crypto.randomBytes(6).toString("hex");
  const ext = extFromMime(file.type, file.name);
  const filename = `${type}-${hash}.${ext}`;
  const absPath = path.join(BRANDING_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absPath, buffer);

  // Public URL path
  const url = `/branding/${filename}`;

  // Upsert setting
  await db.settings.upsert({
    where: { key: spec.key },
    update: { value: url },
    create: { key: spec.key, value: url },
  });

  // Audit
  await writeAudit(result.session, {
    aksi: "UPDATE",
    modul: "SETTINGS",
    detail: `Mengunggah aset branding '${type}': ${filename} (${(file.size / 1024).toFixed(0)} KB)`,
  });

  return NextResponse.json({
    type,
    key: spec.key,
    url,
    filename,
    size: file.size,
    mimeType: file.type,
    branding: await fetchAllBranding(),
  });
}

/* ---------------- DELETE — remove one asset ---------------- */
export async function DELETE(req: Request) {
  const result = await getCurrentUser();
  if (!result || result.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Akses ditolak. Hanya ADMIN yang dapat menghapus aset branding." }, { status: 403 });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const spec = type ? SPECS[type] : null;
  if (!spec) {
    return NextResponse.json({ error: `Tipe tidak dikenal. Pilihan: ${Object.keys(SPECS).join(", ")}` }, { status: 400 });
  }

  const prev = await db.settings.findUnique({ where: { key: spec.key } });
  if (prev?.value) await deleteFileIfExists(prev.value);

  await db.settings.deleteMany({ where: { key: spec.key } });

  await writeAudit(result.session, {
    aksi: "DELETE",
    modul: "SETTINGS",
    detail: `Menghapus aset branding '${type}'`,
  });

  return NextResponse.json({
    type,
    key: spec.key,
    deleted: true,
    branding: await fetchAllBranding(),
  });
}

/* ---------------- helper ---------------- */
async function fetchAllBranding(): Promise<Record<string, string>> {
  const items = await db.settings.findMany({
    where: { key: { startsWith: "branding_" } },
  });
  const branding: Record<string, string> = {};
  for (const s of items) branding[s.key] = s.value || "";
  return branding;
}
