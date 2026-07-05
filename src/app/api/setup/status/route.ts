import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/setup/status — public endpoint that reports whether the
 * first-run Setup Wizard should be displayed.
 *
 * The wizard is considered "needed" when ANY of the following is true:
 *   1. The `setup_complete` setting is missing or !== "true"
 *   2. No user with role=ADMIN exists
 *   3. The `app_name` or `kelurahan` settings are missing
 *
 * No auth required — this endpoint must be reachable before any admin
 * exists. It only exposes counts/booleans, never personal data.
 */
export async function GET() {
  try {
    const [adminCount, userCount, jenisCount, statusPenguasaanCount, settingsRows] = await Promise.all([
      db.user.count({ where: { role: "ADMIN" } }),
      db.user.count(),
      db.jenisSurat.count(),
      db.statusPenguasaan.count(),
      db.settings.findMany({
        where: {
          key: { in: ["setup_complete", "app_name", "kelurahan", "app_subtitle"] },
        },
      }),
    ]);

    const settingsMap: Record<string, string> = {};
    for (const s of settingsRows) settingsMap[s.key] = s.value || "";

    const setupComplete = settingsMap.setup_complete === "true";
    const hasAdmin = adminCount > 0;
    const hasSettings = !!(settingsMap.app_name && settingsMap.kelurahan);
    const hasMasterData = jenisCount > 0 && statusPenguasaanCount > 0;

    const needed = !setupComplete || !hasAdmin || !hasSettings;

    return NextResponse.json({
      needed,
      setupComplete,
      hasAdmin,
      hasSettings,
      hasMasterData,
      userCount,
      adminCount,
      jenisCount,
      statusPenguasaanCount,
      // Helpful for the wizard UI to pre-fill values when re-running
      appName: settingsMap.app_name || "",
      appSubtitle: settingsMap.app_subtitle || "",
      kelurahan: settingsMap.kelurahan || "",
    });
  } catch (e) {
    console.error("setup status error", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
