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
export async function generateNomorRegister(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `KPII-TNH-${year}-`;
  // count existing this year
  const count = await db.permohonan.count({
    where: { nomorRegister: { startsWith: prefix } },
  });
  const seq = (count + 1).toString().padStart(6, "0");
  return `${prefix}${seq}`;
}
