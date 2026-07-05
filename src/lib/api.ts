// SI-TRACK TANAH — client-side API helpers
import type { AppUser, SlaItem, SlaSummary } from "@/lib/types";

/**
 * Custom API error that carries the server's `code` field (e.g. "ARSIP_REQUIRED")
 * alongside the human-readable message. The UI can inspect `err.code` to render
 * context-specific guidance (e.g. auto-switch to the Arsip tab).
 */
export class ApiError extends Error {
  code?: string;
  status: number;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function req<T = any>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      ...(opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    },
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (data as any).error || `Request failed (${res.status})`,
      res.status,
      (data as any).code
    );
  }
  return data as T;
}

export const api = {
  // auth
  login: (email: string, password: string) =>
    req<{ user: AppUser }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => req("/api/auth/logout", { method: "POST" }),
  me: () => req<{ user: AppUser | null }>("/api/auth/me"),

  // tracking (public)
  track: (reg: string) => req<any>(`/api/tracking/${encodeURIComponent(reg)}`),
  // public revision upload (no auth) — pemohon uploads docs when status = REVISI
  publicRevisiUpload: (registerNumber: string, formData: FormData) =>
    req<{
      ok: boolean;
      count: number;
      total: number;
      dokumen: any[];
      errors?: { namaFile: string; error: string }[];
    }>(`/api/tracking/${encodeURIComponent(registerNumber)}/revisi-upload`, {
      method: "POST",
      body: formData,
    }),

  // permohonan
  listPermohonan: (params: Record<string, string | undefined> = {}) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
    return req<{ total: number; items: any[] }>(`/api/permohonan?${q.toString()}`);
  },
  getPermohonan: (id: string) => req<any>(`/api/permohonan/${id}`),
  createPermohonan: (body: any) => req<{ permohonan: any }>("/api/permohonan", { method: "POST", body: JSON.stringify(body) }),
  updatePermohonan: (id: string, body: any) => req<{ permohonan: any }>(`/api/permohonan/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deletePermohonan: (id: string) => req(`/api/permohonan/${id}`, { method: "DELETE" }),
  changeStatus: (id: string, body: { statusKode?: string; catatan?: string; alasanDitolak?: string }) =>
    req(`/api/permohonan/${id}/status`, { method: "POST", body: JSON.stringify(body) }),
  uploadDokumen: (id: string, formData: FormData) =>
    req<{ dokumen: any }>(`/api/permohonan/${id}/dokumen`, { method: "POST", body: formData }),
  uploadDokumenBatch: (id: string, files: File[], jenisDokumen: string) => {
    const fd = new FormData();
    for (const f of files) fd.append("files", f);
    fd.append("jenisDokumen", jenisDokumen);
    return req<{ dokumen: any[]; count: number; total: number; errors?: { namaFile: string; error: string }[] }>(
      `/api/permohonan/${id}/dokumen`,
      { method: "POST", body: fd }
    );
  },
  deleteDokumen: (id: string, dokId: string) =>
    req(`/api/permohonan/${id}/dokumen?dokId=${dokId}`, { method: "DELETE" }),
  getQr: (id: string) => req<{ qr: string; url: string; nomorRegister: string }>(`/api/permohonan/${id}/qr`),

  // ===== Arsip surat tanah (final, signed land-letter archive) =====
  // 1:1 with permohonan. Must be uploaded before status can reach SELESAI.
  getArsip: (id: string) =>
    req<{ arsip: any | null; permohonan: any }>(`/api/permohonan/${id}/arsip`),
  uploadArsip: (id: string, formData: FormData) =>
    req<{ arsip: any }>(`/api/permohonan/${id}/arsip`, { method: "POST", body: formData }),
  updateArsipMetadata: (id: string, body: any) =>
    req<{ arsip: any }>(`/api/permohonan/${id}/arsip`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  replaceArsipFile: (id: string, formData: FormData) =>
    req<{ arsip: any }>(`/api/permohonan/${id}/arsip`, { method: "PUT", body: formData }),
  deleteArsip: (id: string) =>
    req<{ ok: boolean }>(`/api/permohonan/${id}/arsip`, { method: "DELETE" }),

  // Global arsip list (admin/petugas dashboard — all archived surat tanah)
  listArsip: (params: Record<string, string | undefined> = {}) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
    return req<{ total: number; page: number; limit: number; totalPages: number; items: any[] }>(
      `/api/arsip?${q.toString()}`
    );
  },

  // riwayat tanah (land ownership history) — CRUD per permohonan
  listRiwayatTanah: (id: string) =>
    req<{ items: any[] }>(`/api/permohonan/${id}/riwayat-tanah`),
  addRiwayatTanah: (id: string, body: any) =>
    req<{ entry: any }>(`/api/permohonan/${id}/riwayat-tanah`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateRiwayatTanah: (id: string, entryId: string, body: any) =>
    req<{ entry: any }>(`/api/permohonan/${id}/riwayat-tanah/${entryId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteRiwayatTanah: (id: string, entryId: string) =>
    req<{ ok: boolean }>(`/api/permohonan/${id}/riwayat-tanah/${entryId}`, {
      method: "DELETE",
    }),

  // dashboard
  dashboard: (year?: number, range?: "today" | "7d" | "30d" | "year" | "all") => {
    const q = new URLSearchParams();
    if (year) q.set("year", String(year));
    if (range) q.set("range", range);
    const qs = q.toString();
    return req<any>(`/api/dashboard${qs ? `?${qs}` : ""}`);
  },

  // recent activity (riwayat)
  riwayatRecent: (limit: number = 5) =>
    req<{ items: any[] }>(`/api/riwayat/recent?limit=${limit}`),

  // master
  jenisSurat: () => req<{ items: any[] }>("/api/jenis-surat"),
  createJenisSurat: (body: any) => req<{ item: any }>("/api/jenis-surat", { method: "POST", body: JSON.stringify(body) }),
  updateJenisSurat: (id: string, body: any) =>
    req<{ item: any }>(`/api/jenis-surat/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteJenisSurat: (id: string) =>
    req<{ ok: boolean }>(`/api/jenis-surat/${id}`, { method: "DELETE" }),
  statusProses: () => req<{ items: any[] }>("/api/status-proses"),

  // status penguasaan (master data — land tenure types, admin-managed CRUD)
  statusPenguasaan: (includeInactive = false) =>
    req<{ items: any[] }>(
      `/api/status-penguasaan${includeInactive ? "?includeInactive=true" : ""}`
    ),
  createStatusPenguasaan: (body: any) =>
    req<{ item: any }>("/api/status-penguasaan", { method: "POST", body: JSON.stringify(body) }),
  updateStatusPenguasaan: (id: string, body: any) =>
    req<{ item: any }>(`/api/status-penguasaan/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteStatusPenguasaan: (id: string) =>
    req<{ ok: boolean }>(`/api/status-penguasaan/${id}`, { method: "DELETE" }),

  // SLA tracking (atasan/admin)
  sla: (filter?: "all" | "warning" | "breach") => {
    const q = new URLSearchParams();
    if (filter) q.set("filter", filter);
    const qs = q.toString();
    return req<{ summary: SlaSummary; items: SlaItem[] }>(
      `/api/sla${qs ? `?${qs}` : ""}`
    );
  },

  // users
  users: () => req<{ items: any[] }>("/api/users"),
  createUser: (body: any) => req<{ user: any }>("/api/users", { method: "POST", body: JSON.stringify(body) }),
  updateUser: (id: string, body: any) => req<{ user: any }>(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteUser: (id: string) => req(`/api/users/${id}`, { method: "DELETE" }),

  // laporan
  laporan: (params: Record<string, string | undefined> = {}) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
    return req<any>(`/api/laporan?${q.toString()}`);
  },

  // audit
  auditLog: (params: Record<string, string | undefined> = {}) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
    return req<{ items: any[] }>(`/api/audit-log?${q.toString()}`);
  },

  // notifikasi
  notifikasi: () => req<{ items: any[]; unread: number }>("/api/notifikasi"),
  markNotifRead: (id?: string) =>
    req("/api/notifikasi", { method: "PATCH", body: JSON.stringify(id ? { id } : { markAll: true }) }),
  deleteNotifikasi: (id: string) =>
    req("/api/notifikasi", { method: "DELETE", body: JSON.stringify({ id }) }),
  clearAllNotifikasi: () =>
    req("/api/notifikasi", { method: "DELETE", body: JSON.stringify({ clearAll: true }) }),

  // profile
  profile: () => req<{ user: any }>("/api/auth/profile"),
  updateProfile: (data: { name?: string; phone?: string; position?: string; currentPassword?: string; newPassword?: string }) =>
    req<{ user: any }>("/api/auth/profile", { method: "PUT", body: JSON.stringify(data) }),

  // settings
  settings: () => req<{ settings: Record<string, string> }>("/api/settings"),
  updateSettings: (settings: Record<string, string>) =>
    req<{ settings: Record<string, string> }>("/api/settings", { method: "PUT", body: JSON.stringify({ settings }) }),

  // branding assets (logo, favicon, app icons, login bg, hero banner)
  getBranding: () => req<{ branding: Record<string, string> }>("/api/settings/branding"),
  uploadBranding: (type: string, file: File) => {
    const fd = new FormData();
    fd.append("type", type);
    fd.append("file", file);
    return req<{ type: string; key: string; url: string; filename: string; branding: Record<string, string> }>(
      "/api/settings/branding",
      { method: "POST", body: fd }
    );
  },
  deleteBranding: (type: string) =>
    req<{ type: string; deleted: boolean; branding: Record<string, string> }>(
      `/api/settings/branding?type=${encodeURIComponent(type)}`,
      { method: "DELETE" }
    ),

  // notification test (Fonnte WA + email)
  testNotify: (channel: "wa" | "email", to?: string) =>
    req<{
      ok: boolean;
      channel: string;
      recipient?: string;
      error?: string;
      settings: { wa_enabled: string; email_enabled: string; fonnte_token_set: boolean; email_provider: string; email_from: string };
    }>("/api/settings/notify/test", {
      method: "POST",
      body: JSON.stringify({ channel, to }),
    }),

  // resend permohonan notification manually
  resendPermohonanNotify: (id: string, force = false) =>
    req<{
      ok: boolean;
      triggerStatus: string;
      results: { channel: string; success: boolean; error?: string; recipient?: string }[];
    }>(`/api/permohonan/${id}/notify`, {
      method: "POST",
      body: JSON.stringify({ force }),
    }),

  // public stats
  publicStats: () => req<{ total: number; selesai: number; diproses: number; ditolak: number; thisMonth: number; completionRate: number }>("/api/public/stats"),

  // setup wizard (first-run onboarding)
  setupStatus: () =>
    req<{
      needed: boolean;
      setupComplete: boolean;
      hasAdmin: boolean;
      hasSettings: boolean;
      hasMasterData: boolean;
      userCount: number;
      adminCount: number;
      jenisCount: number;
      statusPenguasaanCount: number;
      appName: string;
      appSubtitle: string;
      kelurahan: string;
    }>("/api/setup/status"),
  setupComplete: (body: any) =>
    req<{
      ok: boolean;
      adminSkipped: boolean;
      adminCreated: boolean;
      admin: { id: string; email: string; name: string; role: string } | null;
      settingsCount: number;
      masterSeeded: boolean;
      setupComplete: boolean;
    }>("/api/setup/complete", { method: "POST", body: JSON.stringify(body) }),
};
