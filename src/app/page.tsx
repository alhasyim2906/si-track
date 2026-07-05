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
import { ProfileSettings } from "@/components/app/shared/ProfileSettings";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, view, setUser, setView } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [trackQuery, setTrackQuery] = useState("");

  // restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const r = await api.me();
        if (r.user) setUser(r.user);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [setUser]);

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
      case "audit-log":
        return user.role === "ADMIN" ? <AuditLogView /> : <PublicTracking />;
      case "users":
        return user.role === "ADMIN" ? <UserManagement /> : <PublicTracking />;
      case "jenis-surat":
        return user.role === "ADMIN" ? <JenisSuratManagement /> : <PublicTracking />;
      case "profil":
        return <ProfileSettings />;
      default:
        return <PublicTracking initialRegister={trackQuery} onLoginClick={handleLoginClick} />;
    }
  }
}
