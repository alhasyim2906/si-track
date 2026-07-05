// SI-TRACK TANAH — audit log helper
import { db } from "@/lib/db";
import type { SessionPayload } from "@/lib/auth";

export async function writeAudit(
  session: SessionPayload | null,
  params: {
    aksi: string;
    modul: string;
    entitasId?: string;
    detail?: string;
    ip?: string;
  }
) {
  try {
    await db.auditLog.create({
      data: {
        userId: session?.uid ?? null,
        userName: session?.name ?? "System",
        userRole: session?.role ?? "SYSTEM",
        aksi: params.aksi,
        modul: params.modul,
        entitasId: params.entitasId ?? null,
        detail: params.detail ?? null,
        ip: params.ip ?? null,
      },
    });
  } catch (e) {
    // non-blocking
    console.error("audit log failed", e);
  }
}
