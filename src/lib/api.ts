// SI-TRACK TANAH — client-side API helpers
import type { AppUser } from "@/lib/types";

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
    throw new Error((data as any).error || `Request failed (${res.status})`);
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
  deleteDokumen: (id: string, dokId: string) =>
    req(`/api/permohonan/${id}/dokumen?dokId=${dokId}`, { method: "DELETE" }),
  getQr: (id: string) => req<{ qr: string; url: string; nomorRegister: string }>(`/api/permohonan/${id}/qr`),

  // dashboard
  dashboard: (year?: number) => req<any>(`/api/dashboard${year ? `?year=${year}` : ""}`),

  // master
  jenisSurat: () => req<{ items: any[] }>("/api/jenis-surat"),
  createJenisSurat: (body: any) => req<{ item: any }>("/api/jenis-surat", { method: "POST", body: JSON.stringify(body) }),
  statusProses: () => req<{ items: any[] }>("/api/status-proses"),

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

  // settings
  settings: () => req<{ settings: Record<string, string> }>("/api/settings"),
};
