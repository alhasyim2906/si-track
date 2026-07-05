// SI-TRACK TANAH — global app store (Zustand)
import { create } from "zustand";
import type { AppUser, AppView } from "@/lib/types";

interface AppState {
  user: AppUser | null;
  view: AppView;
  selectedPermohonanId: string | null;
  // branding settings (logo_url, favicon_url, etc.) — cached for client use
  branding: Record<string, string>;
  appName: string;
  appSubtitle: string;
  // nav
  setView: (v: AppView) => void;
  setUser: (u: AppUser | null) => void;
  selectPermohonan: (id: string | null) => void;
  setBranding: (b: Record<string, string>) => void;
  setAppName: (name: string, subtitle?: string) => void;
  // helpers
  can: (action: string) => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  view: "public",
  selectedPermohonanId: null,
  branding: {},
  appName: "SI-TRACK TANAH",
  appSubtitle: "Kelurahan Kuala Pembuang II",
  setView: (v) => {
    set({ view: v });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  },
  setUser: (u) => set({ user: u, view: u ? "dashboard" : "public" }),
  selectPermohonan: (id) => set({ selectedPermohonanId: id, view: id ? "permohonan-detail" : "permohonan" }),
  setBranding: (b) => set({ branding: b }),
  setAppName: (name, subtitle) =>
    set((s) => ({ appName: name || s.appName, appSubtitle: subtitle ?? s.appSubtitle })),
  can: (action) => {
    const u = get().user;
    if (!u) return false;
    switch (action) {
      case "manage_users":
      case "view_audit":
      case "manage_jenis":
      case "manage_settings":
        return u.role === "ADMIN";
      case "view_laporan":
        return u.role === "ADMIN" || u.role === "ATASAN";
      case "create_permohonan":
      case "edit_permohonan":
      case "upload_dokumen":
        return u.role === "PETUGAS" || u.role === "ADMIN";
      case "approve":
        return u.role === "ATASAN" || u.role === "ADMIN";
      case "edit_profile":
      case "view_notifications":
        return true;
      default:
        return true;
    }
  },
}));
