import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { STATUS_BY_KODE } from "@/lib/constants";
import type { SlaItem, SlaStatus } from "@/lib/types";

/**
 * GET /api/sla
 *   Auth: ADMIN or ATASAN only.
 *   Query: ?filter=all | warning | breach
 *
 * Returns:
 *   - summary: counts of on-track / warning / breach + average age (days) + breach rate
 *   - items: list of permohonan currently in progress (not SELESAI/DITOLAK),
 *            each with SLA target, elapsed hours, remaining hours, progress %, status bucket
 *
 * SLA targets come from Settings (sla_<kode_lowercase>_hours). If unset, falls
 * back to a built-in default per status. The "warning threshold" percent
 * (sla_warning_threshold_pct, default 80) determines the boundary between
 * on_track and warning.
 */
export async function GET(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "ATASAN"].includes(current.user.role)) {
    return NextResponse.json({ error: "Akses ditolak. Hanya ADMIN/ATASAN." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const filter = (searchParams.get("filter") || "all") as "all" | "warning" | "breach";

  // ===== Load SLA settings =====
  const slaSettings = await db.settings.findMany({
    where: { OR: [{ key: { startsWith: "sla_" } }] },
  });
  const settingsMap: Record<string, string> = {};
  for (const s of slaSettings) settingsMap[s.key] = s.value || "";

  const warningPct = parseInt(settingsMap.sla_warning_threshold_pct || "80");
  const totalTargetHours = parseInt(settingsMap.sla_total_target_hours || "336");

  // Built-in defaults per status (hours) — used if Settings is empty
  const DEFAULT_SLA: Record<string, number> = {
    PENGAJUAN: 24,
    CEK_ADMIN: 48,
    VERIFIKASI_LAPANGAN: 72,
    PENGUKURAN: 72,
    PEMBUATAN_SURAT: 48,
    TTD_LURAH: 24,
    TTD_CAMAT: 48,
    REVISI: 168,
  };

  function getSlaHours(kode: string): number {
    const k = `sla_${kode.toLowerCase()}_hours`;
    const v = parseInt(settingsMap[k] || "");
    if (!isNaN(v) && v > 0) return v;
    return DEFAULT_SLA[kode] ?? 48; // sensible fallback
  }

  // ===== Load all in-progress permohonan =====
  const FINAL_STATUSES = ["SELESAI", "DITOLAK"];
  const permohonanList = await db.permohonan.findMany({
    where: { statusSaatIni: { notIn: FINAL_STATUSES } },
    include: {
      jenisSurat: { select: { nama: true, kode: true } },
      creator: { select: { name: true } },
      riwayat: { orderBy: { createdAt: "desc" }, take: 1, include: { petugas: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" }, // oldest first — most likely to breach
  });

  const now = Date.now();
  const items: SlaItem[] = [];

  for (const p of permohonanList) {
    // statusEnteredAt = createdAt of the latest RiwayatProses row that matches current status
    // We took only the latest 1 riwayat (most recent), but the latest may not match current status
    // (e.g., when admin restored from REVISI to CEK_ADMIN, the latest riwayat is CEK_ADMIN).
    // Actually, the latest riwayat row IS the entry into the current status in normal flow.
    // To be safe, find the latest riwayat whose statusKode === p.statusSaatIni.
    const matchingRiwayat = p.riwayat.find((r) => r.statusKode === p.statusSaatIni) || p.riwayat[0];
    const statusEnteredAt = matchingRiwayat ? new Date(matchingRiwayat.createdAt).getTime() : new Date(p.createdAt).getTime();

    const elapsedMs = now - statusEnteredAt;
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    const slaHours = getSlaHours(p.statusSaatIni);
    const remainingHours = slaHours - elapsedHours;
    const progressPct = slaHours > 0 ? Math.round((elapsedHours / slaHours) * 1000) / 10 : 100;

    let slaStatus: SlaStatus = "on_track";
    if (elapsedHours >= slaHours) slaStatus = "breach";
    else if (progressPct >= warningPct) slaStatus = "warning";

    const ageDays = Math.round(((now - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24)) * 10) / 10;

    items.push({
      id: p.id,
      nomorRegister: p.nomorRegister,
      pemohonNama: p.pemohonNama,
      pemohonNik: p.pemohonNik,
      jenisSurat: p.jenisSurat?.nama || "—",
      statusSaatIni: p.statusSaatIni,
      statusNama: STATUS_BY_KODE[p.statusSaatIni]?.nama || p.statusSaatIni,
      statusWarna: STATUS_BY_KODE[p.statusSaatIni]?.warna || "#d4af37",
      prioritas: p.prioritas,
      statusEnteredAt: new Date(statusEnteredAt).toISOString(),
      slaHours,
      elapsedHours: Math.round(elapsedHours * 10) / 10,
      remainingHours: Math.round(remainingHours * 10) / 10,
      progressPct,
      slaStatus,
      ageDays,
      createdAt: p.createdAt.toISOString(),
      petugas: p.creator?.name || null,
      lastCatatan: matchingRiwayat?.catatan || null,
    });
  }

  // Compute summary
  const onTrack = items.filter((i) => i.slaStatus === "on_track").length;
  const warning = items.filter((i) => i.slaStatus === "warning").length;
  const breach = items.filter((i) => i.slaStatus === "breach").length;
  const avgDays = items.length > 0
    ? Math.round((items.reduce((s, i) => s + i.ageDays, 0) / items.length) * 10) / 10
    : 0;
  const breachRate = items.length > 0 ? Math.round((breach / items.length) * 1000) / 10 : 0;

  // Apply filter
  let filteredItems = items;
  if (filter === "warning") {
    filteredItems = items.filter((i) => i.slaStatus === "warning");
  } else if (filter === "breach") {
    filteredItems = items.filter((i) => i.slaStatus === "breach");
  }

  // Sort: breach → warning → on_track, then by elapsedHours desc within each group
  const statusOrder: Record<SlaStatus, number> = { breach: 0, warning: 1, on_track: 2 };
  filteredItems.sort((a, b) => {
    if (statusOrder[a.slaStatus] !== statusOrder[b.slaStatus]) {
      return statusOrder[a.slaStatus] - statusOrder[b.slaStatus];
    }
    return b.elapsedHours - a.elapsedHours;
  });

  return NextResponse.json({
    summary: {
      total: items.length,
      onTrack,
      warning,
      breach,
      avgDays,
      breachRate,
      totalTargetHours,
      warningPct,
    },
    items: filteredItems,
  });
}
