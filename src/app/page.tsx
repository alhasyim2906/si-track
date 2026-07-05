"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { AppShell } from "@/components/app/AppShell";
import { LoginModal } from "@/components/app/LoginModal";
import { PublicTracking } from "@/components/app/PublicTracking";
import { AdminDashboard } from "@/components/app/admin/AdminDashboard";
import { PetugasDashboard } from "@/components/app/petugas/PetugasDashboard";
import { AtasanDashboard } from "@/components/app/atasan/AtasanDashboard";
import { PermohonanList } from "@/components/app/petugas/PermohonanList";
import { PermohonanForm } from "@/components/app/petugas/PermohonanForm";
import { PermohonanDetail } from "@/components/app/shared/PermohonanDetail";
import { Reports } from "@/components/app/shared/Reports";
import { AuditLogView } from "@/components/app/admin/AuditLogView";
import { UserManagement } from "@/components/app/admin/UserManagement";
import { JenisSuratManagement } from "@/components/app/admin/JenisSuratManagement";
import { StatusPenguasaanManagement } from "@/components/app/admin/StatusPenguasaanManagement";
import { SettingsManagement } from "@/components/app/admin/SettingsManagement";
import { ProfileSettings } from "@/components/app/shared/ProfileSettings";
import { NotificationCenter } from "@/components/app/shared/NotificationCenter";
import { SlaTracking } from "@/components/app/shared/SlaTracking";
import { SetupWizard } from "@/components/app/shared/SetupWizard";
import { ArsipList } from "@/components/app/shared/ArsipList";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, view, setUser, setView, setBranding, setAppName, setSettings, setupWizardOpen, setSetupWizardOpen } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [trackQuery, setTrackQuery] = useState("");

  // restore session + branding settings on mount
  useEffect(() => {
    (async () => {
      try {
        const [meR, setR, brandR, setupR] = await Promise.all([
          api.me(),
          api.settings(),
          api.getBranding().catch(() => ({ branding: {} })),
          api.setupStatus().catch(() => ({ needed: false })),
        ]);
        if (meR.user) setUser(meR.user);
        setAppName(setR.settings.app_name, setR.settings.app_subtitle);
        setSettings(setR.settings || {});
        setBranding(brandR.branding || {});
        // Auto-open Setup Wizard on first-run when visitor isn't logged in.
        // Admins see a banner in-app instead (see AppShell / Settings).
        if ((setupR as any).needed && !meR.user) {
          setSetupWizardOpen(true);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [setUser, setBranding, setAppName, setSettings, setSetupWizardOpen]);

  // read ?track= from URL once
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get("track");
    if (t) setTrackQuery(t);
  }, []);

  // open login automatically when user tries to access protected view without auth
  useEffect(() => {
    if (!loading && !user && view !== "public") {
      setView("public");
    }
  }, [loading, user, view, setView]);

  const handleLoginClick = () => setLoginOpen(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Memuat SI-TRACK TANAH...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppShell onLoginClick={handleLoginClick}>
        {renderView()}
      </AppShell>
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      <SetupWizard
        open={setupWizardOpen}
        onOpenChange={setSetupWizardOpen}
        onCompleted={async ({ adminCreated }) => {
          // If the wizard created an admin and auto-logged-in, refresh session
          if (adminCreated) {
            try {
              const meR = await api.me();
              if (meR.user) setUser(meR.user);
            } catch {
              /* non-blocking */
            }
          }
        }}
      />
    </>
  );

  function renderView() {
    // public view (no auth needed)
    if (view === "public" || !user) {
      return <PublicTracking initialRegister={trackQuery} onLoginClick={handleLoginClick} />;
    }

    // protected views
    switch (view) {
      case "dashboard":
        if (user.role === "ADMIN") return <AdminDashboard />;
        if (user.role === "PETUGAS") return <PetugasDashboard />;
        if (user.role === "ATASAN") return <AtasanDashboard />;
        return <AdminDashboard />;
      case "permohonan":
        return <PermohonanList />;
      case "permohonan-baru":
        return <PermohonanForm />;
      case "permohonan-detail":
        return <PermohonanDetail />;
      case "laporan":
        return <Reports />;
      case "sla":
        return user.role === "ADMIN" || user.role === "ATASAN" ? <SlaTracking /> : <PublicTracking />;
      case "arsip":
        return <ArsipList />;
      case "audit-log":
        return user.role === "ADMIN" ? <AuditLogView /> : <PublicTracking />;
      case "users":
        return user.role === "ADMIN" ? <UserManagement /> : <PublicTracking />;
      case "jenis-surat":
        return user.role === "ADMIN" ? <JenisSuratManagement /> : <PublicTracking />;
      case "status-penguasaan":
        return user.role === "ADMIN" ? <StatusPenguasaanManagement /> : <PublicTracking />;
      case "pengaturan":
        return user.role === "ADMIN" ? <SettingsManagement /> : <PublicTracking />;
      case "notifikasi-center":
        return <NotificationCenter />;
      case "profil":
        return <ProfileSettings />;
      default:
        return <PublicTracking initialRegister={trackQuery} onLoginClick={handleLoginClick} />;
    }
  }
}
