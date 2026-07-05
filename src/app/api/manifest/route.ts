import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { iconMimeFromUrl, withIconCacheBust } from "@/lib/icon-mime";

/* ============================================================
   Dynamic PWA manifest
   Returns /manifest.json content with branding-customized
   app name, theme color, and icons (when uploaded).
   ============================================================ */
export async function GET() {
  const items = await db.settings.findMany({
    where: { key: { in: [
      "app_name",
      "app_subtitle",
      "nama_kelurahan",
      "branding_app_icon_192_url",
      "branding_app_icon_512_url",
      "branding_logo_url",
    ] } },
  });
  const s: Record<string, string> = {};
  for (const it of items) s[it.key] = it.value || "";

  const appName = s.app_name || "SI-TRACK TANAH";
  const shortName = appName.length > 12 ? appName.slice(0, 12) : appName;
  const description = `${appName} — ${s.app_subtitle || "Kelurahan Kuala Pembuang II"}`;

  const icon192 = withIconCacheBust(s.branding_app_icon_192_url || "/logo.svg");
  const icon512 = withIconCacheBust(s.branding_app_icon_512_url || "/logo.svg");
  const icon192Mime = iconMimeFromUrl(s.branding_app_icon_192_url || "/logo.svg");
  const icon512Mime = iconMimeFromUrl(s.branding_app_icon_512_url || "/logo.svg");

  const manifest = {
    name: appName,
    short_name: shortName,
    description,
    start_url: "/",
    display: "standalone",
    background_color: "#0a1628",
    theme_color: "#d4af37",
    orientation: "portrait-primary",
    icons: [
      { src: icon192, sizes: "192x192", type: icon192Mime, purpose: "any" },
      { src: icon512, sizes: "512x512", type: icon512Mime, purpose: "any" },
      { src: icon512, sizes: "512x512", type: icon512Mime, purpose: "maskable" },
      { src: "/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    categories: ["government", "utilities"],
    lang: "id",
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
