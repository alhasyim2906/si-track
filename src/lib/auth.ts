// SI-TRACK TANAH — Simple cookie-based auth (HMAC token, no external deps)
import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { Role } from "@/lib/constants";

const COOKIE_NAME = "sit_session";
const SECRET = process.env.AUTH_SECRET || "si-track-tanah-dev-secret-change-me";

export interface SessionPayload {
  uid: string;
  email: string;
  name: string;
  role: Role;
}

// ===== Password hashing (bcryptjs) =====
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ===== Token (HMAC-SHA256 base64url payload.signature) =====
function sign(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verify(token: string): SessionPayload | null {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as SessionPayload;
  } catch {
    return null;
  }
}

// ===== Server-side cookie helpers (use in Route Handlers / Server Components) =====
export async function setSessionCookie(payload: SessionPayload) {
  const token = sign(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verify(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.uid } });
  if (!user || !user.isActive) return null;
  return { user, session };
}

// ===== Role guards =====
export function requireRole(session: SessionPayload | null, ...roles: Role[]) {
  if (!session || !roles.includes(session.role)) {
    return false;
  }
  return true;
}

// ===== Register number generator =====
//
// Format: {PREFIX}-{YEAR}-{SERIAL}
//   - Random mode (default, anti-enumeration): SERIAL is an unguessable
//     alphanumeric token drawn from a 30-char alphabet that excludes
//     visually-ambiguous characters (I, L, O, U, 0, 1). With 8 chars the
//     keyspace is ~6.6 * 10^11 — infeasible to guess by enumeration.
//   - Sequential mode (legacy): SERIAL is a zero-padded counter.
//
// Behaviour is controlled by the `register_use_random` setting ("true"|"false").
// The prefix and token/serial length come from `register_prefix` and
// `register_digit_count` settings respectively.

// Crockford-base32-like alphabet without ambiguous chars (no I, L, O, U, 0, 1)
const REGISTER_ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";

function randomToken(length: number): string {
  // crypto.randomBytes gives unbiased bytes; we map each byte onto the
  // 30-char alphabet. A tiny modulo bias exists but is negligible for
  // a non-secret registration token (256 % 30 = 16 → bias toward first
  // 16 chars by ~6%). For stronger uniformity we'd use rejection sampling,
  // but this is more than sufficient to defeat enumeration.
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += REGISTER_ALPHABET[bytes[i] % REGISTER_ALPHABET.length];
  }
  return out;
}

/** Server-side settings reader (returns map of key→value). */
async function readSettingsMap(): Promise<Record<string, string>> {
  const items = await db.settings.findMany();
  const map: Record<string, string> = {};
  for (const s of items) map[s.key] = s.value || "";
  return map;
}

export async function generateNomorRegister(): Promise<string> {
  const settings = await readSettingsMap();
  const prefix = (settings.register_prefix || "KPII-TNH").trim().toUpperCase();
  const useRandom = (settings.register_use_random ?? "true") === "true";
  const digitCount = Math.max(
    4,
    Math.min(16, parseInt(settings.register_digit_count || "8", 10) || 8)
  );
  const year = new Date().getFullYear();
  const head = `${prefix}-${year}-`;

  if (useRandom) {
    // Random mode — retry until unique (collision probability is negligible
    // but we guard against it for correctness).
    for (let attempt = 0; attempt < 12; attempt++) {
      const candidate = `${head}${randomToken(digitCount)}`;
      const exists = await db.permohonan.findUnique({
        where: { nomorRegister: candidate },
        select: { id: true },
      });
      if (!exists) return candidate;
    }
    // Extremely unlikely fallback — extend token length to break any tie.
    return `${head}${randomToken(digitCount + 2)}`;
  }

  // Sequential mode (legacy) — zero-padded counter scoped to prefix+year.
  const count = await db.permohonan.count({
    where: { nomorRegister: { startsWith: head } },
  });
  const seq = (count + 1).toString().padStart(digitCount, "0");
  return `${head}${seq}`;
}

/** Convenience: generate a sample register number for preview/UI without DB access. */
export function previewNomorRegister(opts?: {
  prefix?: string;
  year?: number;
  digitCount?: number;
  useRandom?: boolean;
}): string {
  const prefix = (opts?.prefix || "KPII-TNH").trim().toUpperCase();
  const year = opts?.year ?? new Date().getFullYear();
  const digitCount = Math.max(4, Math.min(16, opts?.digitCount ?? 8));
  const useRandom = opts?.useRandom ?? true;
  const head = `${prefix}-${year}-`;
  if (useRandom) {
    return `${head}${randomToken(digitCount)}`;
  }
  return `${head}${"1".padStart(digitCount, "0")}`;
}
