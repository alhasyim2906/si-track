/**
 * Resolve the public-facing base URL of the application.
 *
 * Why this exists:
 *   The QR code embedded in the tanda terima (and the {app_url} placeholder in
 *   notification templates) must point to the *public* address where applicants
 *   can track their surat tanah — NOT to `http://localhost:3000`, which is what
 *   `new URL(req.url).origin` returns inside the dev server / container.
 *
 * Resolution order (first non-empty wins):
 *   1. `public_base_url` setting in the database (configurable by admin via
 *      Settings → Identitas Kelurahan / Setup Wizard). This is the canonical
 *      source — the admin knows the real public domain.
 *   2. `NEXT_PUBLIC_APP_URL` environment variable (useful for staging/prod
 *      deployments where the domain is known at deploy time).
 *   3. The request's own origin (`new URL(req.url).origin`) — last-resort
 *      fallback so the feature still works on a fresh install before the admin
 *      has configured anything. The admin should set `public_base_url` ASAP.
 *
 * The returned value is always normalized: trailing slashes are stripped and
 * only the origin (scheme + host [+ port]) is kept, so callers can safely
 * append paths like `/?track=...`.
 */

import { db } from "@/lib/db";

/** Cache the DB lookup result for the lifetime of the process (TTL-bounded). */
let cached: { value: string; at: number } | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute — short enough to pick up admin edits quickly

/**
 * Invalidate the in-memory cache of `public_base_url`. Call this whenever the
 * setting is updated (e.g., from the settings PUT endpoint or the setup wizard
 * complete endpoint) so subsequent reads reflect the new value immediately
 * instead of waiting up to CACHE_TTL_MS for the cache to expire.
 */
export function invalidatePublicBaseUrlCache(): void {
  cached = null;
}

/**
 * Read the `public_base_url` setting from the database, with a short in-memory
 * cache to avoid hitting the DB on every QR / notify call. Returns "" if the
 * setting is absent or empty.
 */
export async function getPublicBaseUrlSetting(): Promise<string> {
  // Return cached value if fresh
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value;
  }
  try {
    const row = await db.settings.findUnique({ where: { key: "public_base_url" } });
    const v = (row?.value || "").trim();
    cached = { value: v, at: Date.now() };
    return v;
  } catch {
    // DB not ready yet (e.g., during migration) — fall through to env/fallback
    return "";
  }
}

/**
 * Normalize a raw URL string to an origin (scheme://host[:port]) with no
 * trailing slash. Returns "" if the input is empty or not a valid URL.
 *
 * Examples:
 *   "https://si-track.seruyan.go.id/"   → "https://si-track.seruyan.go.id"
 *   "http://localhost:3000/?track=x"     → "http://localhost:3000"
 *   "si-track.seruyan.go.id"             → "" (no scheme — invalid)
 */
export function normalizeBaseUrl(raw: string): string {
  if (!raw) return "";
  try {
    const u = new URL(raw);
    return u.origin;
  } catch {
    return "";
  }
}

/**
 * Resolve the public base URL for outbound links (QR codes, notification
 * templates, etc.). Falls back through DB → env → requestOrigin.
 *
 * @param requestOrigin The origin of the incoming request, used as the final
 *                      fallback. Pass `new URL(req.url).origin` from a route
 *                      handler, or omit for server-side code with no request
 *                      context (in which case the env var is the last resort).
 */
export async function resolvePublicBaseUrl(requestOrigin?: string): Promise<string> {
  const fromDb = await getPublicBaseUrlSetting();
  const normalized = normalizeBaseUrl(fromDb);
  if (normalized) return normalized;

  const fromEnv = (process.env.NEXT_PUBLIC_APP_URL || "").trim();
  const envNormalized = normalizeBaseUrl(fromEnv);
  if (envNormalized) return envNormalized;

  // Last resort: the request's own origin (will be localhost in dev — admin
  // should configure `public_base_url` to fix QR codes for real applicants).
  if (requestOrigin) {
    return normalizeBaseUrl(requestOrigin);
  }
  return "";
}

/**
 * Build a full tracking URL for a given nomor register, using the resolved
 * public base URL. The result is safe to embed in a QR code.
 *
 * Example: "https://si-track.seruyan.go.id/?track=KPII-TNH-2026-XK7M2P9Q"
 */
export async function buildTrackingUrl(
  nomorRegister: string,
  requestOrigin?: string
): Promise<string> {
  const base = await resolvePublicBaseUrl(requestOrigin);
  return `${base}/?track=${encodeURIComponent(nomorRegister)}`;
}
