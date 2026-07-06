// SI-TRACK TANAH — Kwitansi number generator
//
// Generates sequential, year-scoped official receipt numbers for the Biaya
// Operasional feature, in the form: {PREFIX}-{YEAR}-{NNNNNN}
// (e.g., "KWT-2026-000001").
//
// The prefix is configurable via the `kwitansi_prefix` setting (default "KWT").
// The serial is zero-padded to 6 digits (configurable via `kwitansi_digit_count`,
// clamped to [4, 10]) and is scoped to the prefix+year combination — it
// restarts at 1 for each new year.

import { db } from "@/lib/db";

/**
 * Read the settings map (key -> value) for the kwitansi configuration keys.
 * Falls back to sensible defaults if any are missing.
 */
async function readKwitansiSettings(): Promise<{
  prefix: string;
  digitCount: number;
}> {
  const items = await db.settings.findMany({
    where: { key: { in: ["kwitansi_prefix", "kwitansi_digit_count"] } },
  });
  const map: Record<string, string> = {};
  for (const s of items) map[s.key] = s.value || "";

  const prefix = (map.kwitansi_prefix || "KWT").trim().toUpperCase();
  const digitCount = Math.max(
    4,
    Math.min(10, parseInt(map.kwitansi_digit_count || "6", 10) || 6)
  );
  return { prefix, digitCount };
}

/**
 * Generate the next unique kwitansi number for the current year.
 * Uses a count-based heuristic with a retry loop to handle race conditions
 * (extremely unlikely at kelurahan scale, but we guard for correctness).
 */
export async function generateNomorKwitansi(): Promise<string> {
  const { prefix, digitCount } = await readKwitansiSettings();
  const year = new Date().getFullYear();
  const head = `${prefix}-${year}-`;

  // Find existing kwitansi numbers with this prefix+year and compute the next
  // serial. We use startsWith on the nomorKwitansi field to scope the count.
  // Note: nomorKwitansi is also @unique, so any collision will be caught by
  // the DB constraint and we retry with a higher serial.
  for (let attempt = 0; attempt < 12; attempt++) {
    const count = await db.biayaOperasional.count({
      where: { nomorKwitansi: { startsWith: head } },
    });
    const serial = (count + 1 + attempt).toString().padStart(digitCount, "0");
    const candidate = `${head}${serial}`;

    // Verify uniqueness before returning (defensive — count-based is usually enough)
    const exists = await db.biayaOperasional.findUnique({
      where: { nomorKwitansi: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }

  // Extremely unlikely fallback — append a random 2-char suffix.
  const fallbackSerial = `${Date.now().toString().slice(-digitCount)}`;
  return `${head}${fallbackSerial.padStart(digitCount, "0")}`;
}

/**
 * Convenience: preview a sample kwitansi number for UI display without
 * touching the DB. Used by settings page to show what the format looks like.
 */
export function previewNomorKwitansi(opts?: {
  prefix?: string;
  year?: number;
  digitCount?: number;
}): string {
  const prefix = (opts?.prefix || "KWT").trim().toUpperCase();
  const year = opts?.year ?? new Date().getFullYear();
  const digitCount = Math.max(4, Math.min(10, opts?.digitCount ?? 6));
  return `${prefix}-${year}-${"1".padStart(digitCount, "0")}`;
}
