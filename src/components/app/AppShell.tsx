"use client";
import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/app-store";
import { api } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/constants";
import { LogoFull, Logo } from "./Logo";
import { NotificationsBell } from "./NotificationsBell";
import { CommandPalette } from "./shared/CommandPalette";
import { KeyboardShortcutsHelp } from "./shared/KeyboardShortcutsHelp";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  LayoutDashboard, FileText, PlusCircle, BarChart3, ScrollText,
  Users, FileStack, ShieldAlert, LogOut, LogIn, Menu, Search, ChevronDown,
  ShieldCheck, UserCog, Crown, Heart, Keyboard, Settings, Bell, Timer,
} from "lucide-react";
import type { AppView } from "@/lib/types";
import { Footer } from "./Footer";

/* ============================================================
   AdminLTE 4 — admin area navigation
   ============================================================ */
type NavItem = { view: AppView; label: string; icon: any; roles: string[] };

const NAV_ITEMS: NavItem[] = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "PETUGAS", "ATASAN"] },
  { view: "permohonan", label: "Permohonan", icon: FileText, roles: ["ADMIN", "PETUGAS", "ATASAN"] },
  { view: "permohonan-baru", label: "Daftar Baru", icon: PlusCircle, roles: ["ADMIN", "PETUGAS"] },
  { view: "laporan", label: "Laporan", icon: BarChart3, roles: ["ADMIN", "ATASAN"] },
  { view: "sla", label: "Pelacakan SLA", icon: Timer, roles: ["ADMIN", "ATASAN"] },
  { view: "jenis-surat", label: "Jenis Surat", icon: FileStack, roles: ["ADMIN"] },
  { view: "status-penguasaan", label: "Status Penguasaan", icon: ShieldAlert, roles: ["ADMIN"] },
  { view: "users", label: "Pengguna", icon: Users, roles: ["ADMIN"] },
  { view: "audit-log", label: "Audit Log", icon: ScrollText, roles: ["ADMIN"] },
  { view: "notifikasi-center", label: "Notifikasi", icon: Bell, roles: ["ADMIN", "PETUGAS", "ATASAN"] },
  { view: "pengaturan", label: "Pengaturan", icon: Settings, roles: ["ADMIN"] },
  { view: "profil", label: "Profil", icon: UserCog, roles: ["ADMIN", "PETUGAS", "ATASAN"] },
];

// Group items into AdminLTE-style sections.
// Each section is rendered with an uppercase `nav-header` label.
function getSections(role: string): { header: string; items: NavItem[] }[] {
  const allowed = NAV_ITEMS.filter((i) => i.roles.includes(role));
  const menu = allowed.filter(
    (i) =>
      i.view === "dashboard" ||
      i.view === "permohonan" ||
      i.view === "permohonan-baru" ||
      i.view === "laporan" ||
      i.view === "sla" ||
      i.view === "notifikasi-center"
  );
  const manajemen = allowed.filter(
    (i) =>
      i.view === "jenis-surat" ||
      i.view === "status-penguasaan" ||
      i.view === "users" ||
      i.view === "audit-log" ||
      i.view === "pengaturan"
  );
  const akun = allowed.filter((i) => i.view === "profil");
  const sections: { header: string; items: NavItem[] }[] = [];
  if (menu.length) sections.push({ header: "Menu", items: menu });
  if (manajemen.length) sections.push({ header: "Manajemen", items: manajemen });
  if (akun.length) sections.push({ header: "Akun", items: akun });
  return sections;
}

const VIEW_LABELS: Record<AppView, string> = {
  public: "Lacak Surat",
  dashboard: "Dashboard",
  permohonan: "Permohonan",
  "permohonan-baru": "Daftar Permohonan Baru",
  "permohonan-detail": "Detail Permohonan",
  laporan: "Laporan",
  "audit-log": "Audit Log",
  users: "Manajemen Pengguna",
  "jenis-surat": "Jenis Surat",
  "status-penguasaan": "Status Penguasaan Tanah",
  notifikasi: "Notifikasi",
  "notifikasi-center": "Pusat Notifikasi",
  pengaturan: "Pengaturan Sistem",
  profil: "Pengaturan Akun",
  sla: "Pelacakan SLA",
};

function isActive(view: AppView, item: AppView): boolean {
  if (view === item) return true;
  if (item === "permohonan" && view === "permohonan-detail") return true;
  return false;
}

/* ----- Sidebar content (shared by desktop <aside> + mobile <Sheet>) ----- */
function SidebarContent({
  role,
  view,
  setView,
  onNavigate,
  onOpenSearch,
  userName,
  roleLabel,
  roleIcon: RoleIcon,
  logoUrl,
  appName,
  appSubtitle,
}: {
  role: string;
  view: AppView;
  setView: (v: AppView) => void;
  onNavigate?: () => void;
  onOpenSearch: () => void;
  userName: string;
  roleLabel: string;
  roleIcon: any;
  logoUrl?: string;
  appName: string;
  appSubtitle: string;
}) {
  const sections = getSections(role);
  return (
    <>
      <a
        className="brand-link"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setView("dashboard");
          onNavigate?.();
        }}
        aria-label={appName}
      >
        <Logo size={36} src={logoUrl} alt={`${appName} logo`} />
        <span className="flex flex-col leading-tight">
          <span className="gold-gradient-text font-extrabold text-base">{appName}</span>
          <span className="brand-sub">{appSubtitle}</span>
        </span>
      </a>

      <div className="user-panel">
        <div className="up-avatar">{userName.charAt(0).toUpperCase()}</div>
        <div className="up-info">
          <div className="up-name">{userName}</div>
          <div className="up-role">
            <RoleIcon className="w-3 h-3" /> {roleLabel}
          </div>
        </div>
      </div>

      <div className="sidebar-form">
        <button
          type="button"
          className="sidebar-search-btn"
          onClick={() => {
            onOpenSearch();
            onNavigate?.();
          }}
        >
          <Search className="w-4 h-4" />
          <span>Cari…</span>
          <span className="kbd">⌘K</span>
        </button>
      </div>

      <nav className="nav-sidebar">
        {sections.map((section) => (
          <div key={section.header}>
            <p className="nav-header">{section.header}</p>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(view, item.view);
              return (
                <button
                  key={item.view}
                  type="button"
                  className={cn("nav-link", active && "active")}
                  onClick={() => {
                    setView(item.view);
                    onNavigate?.();
                  }}
                >
                  <Icon className="nav-icon" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </>
  );
}

/* ----- AdminLTE minimal footer (dark navy bar with copyright + version) ----- */
function AdminFooter({ appName }: { appName: string }) {
  return (
    <footer className="main-footer">
      <div className="mf-inner">
        <span>
          © {new Date().getFullYear()} Pemerintah Kelurahan Kuala Pembuang II ·{" "}
          <span className="gold-text font-semibold">{appName}</span> v1.0
        </span>
        <span className="hidden sm:inline-flex items-center gap-1">
          Dibuat dengan <Heart className="w-3 h-3" style={{ color: "#d4af37" }} /> untuk pelayanan publik
        </span>
      </div>
    </footer>
  );
}

/* ============================================================
   AppShell
   ============================================================ */
export function AppShell({ children, onLoginClick }: { children: React.ReactNode; onLoginClick: () => void }) {
  const { user, view, setView, setUser, selectPermohonan, branding, appName, appSubtitle } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdKey, setCmdKey] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const gPressedRef = useRef(false);

  // Global keyboard shortcuts:
  //   ⌘K / Ctrl+K  → Command Palette
  //   ?            → Keyboard Shortcuts Help
  //   g then d/p/b/l/u → quick navigation (g prefix)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K — Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdKey((k) => k + 1);
        setCmdOpen((v) => !v);
        return;
      }

      // Only handle single-key shortcuts when NOT typing in an input/textarea/select
      const target = e.target as HTMLElement;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (isTyping) return;

      // ? → Help modal (Shift+/ produces "?")
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }

      // g-prefix navigation (g then a second key)
      if (e.key === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        gPressedRef.current = true;
        // reset after 800ms if no second key
        setTimeout(() => {
          gPressedRef.current = false;
        }, 800);
        return;
      }

      if (gPressedRef.current) {
        gPressedRef.current = false;
        const role = user?.role;
        let nextView: AppView | null = null;
        switch (e.key) {
          case "d": nextView = "dashboard"; break;
          case "p": nextView = "permohonan"; break;
          case "b":
            if (role === "ADMIN" || role === "PETUGAS") nextView = "permohonan-baru";
            break;
          case "l":
            if (role === "ADMIN" || role === "ATASAN") nextView = "laporan";
            break;
          case "u":
            if (role === "ADMIN") nextView = "users";
            break;
        }
        if (nextView) {
          e.preventDefault();
          setView(nextView);
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [user, setView]);

  const handleLogout = async () => {
    try {
      await api.logout();
      setUser(null);
      toast.success("Anda telah keluar");
    } catch {
      toast.error("Gagal logout");
    }
  };

  const openCmd = () => {
    setCmdKey((k) => k + 1);
    setCmdOpen(true);
  };

  // ============ PUBLIC VIEW (no user) ============
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 border-b border-border/60 glass-card">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex h-16 items-center justify-between gap-3">
              <button onClick={() => setView("public")} className="shrink-0">
                <LogoFull src={branding.branding_logo_url} appName={appName} appSubtitle={appSubtitle} />
              </button>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView("public")}
                  className="hidden sm:flex"
                >
                  <Search className="w-4 h-4 mr-1.5" /> Lacak Surat
                </Button>
                <Button
                  size="sm"
                  onClick={onLoginClick}
                  className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
                >
                  <LogIn className="w-4 h-4 mr-1.5" /> Login Petugas
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  // ============ AUTHENTICATED VIEW (AdminLTE 4) ============
  const roleIcon = user.role === "ADMIN" ? ShieldCheck : user.role === "ATASAN" ? Crown : UserCog;
  const RoleIcon = roleIcon;
  const roleLabel = ROLE_LABELS[user.role];
  const currentLabel = VIEW_LABELS[view] || "Dashboard";

  return (
    <div className="adminlte wrapper">
      {/* Desktop sidebar (hidden < 992px via CSS) */}
      <aside className="main-sidebar">
        <SidebarContent
          role={user.role}
          view={view}
          setView={setView}
          onOpenSearch={openCmd}
          userName={user.name}
          roleLabel={roleLabel}
          roleIcon={RoleIcon}
          logoUrl={branding.branding_logo_url}
          appName={appName}
          appSubtitle={appSubtitle}
        />
      </aside>

      {/* Mobile sidebar via Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-[#1e2a3a] border-r border-white/10">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu Navigasi</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <SidebarContent
              role={user.role}
              view={view}
              setView={setView}
              onNavigate={() => setMobileOpen(false)}
              onOpenSearch={openCmd}
              userName={user.name}
              roleLabel={roleLabel}
              roleIcon={RoleIcon}
              logoUrl={branding.branding_logo_url}
              appName={appName}
              appSubtitle={appSubtitle}
            />
            <div className="mt-auto p-3 border-t border-white/10">
              <button
                type="button"
                className="nav-link"
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
              >
                <LogOut className="nav-icon" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div className="content-wrapper">
        {/* Top navbar (dark) */}
        <nav className="main-header">
          {/* Mobile hamburger */}
          <button
            type="button"
            className="sidebar-toggle lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mini brand (mobile only) */}
          <div className="navbar-brand-mini">
            <Logo size={26} src={branding.branding_logo_url} alt={`${appName} logo`} />
            <span className="gold-gradient-text">{appName}</span>
          </div>

          {/* Breadcrumb / current page title */}
          <div className="navbar-breadcrumb">
            <span className="bc-current">{currentLabel}</span>
          </div>

          {/* Right cluster */}
          <div className="navbar-nav-right">
            <button
              type="button"
              className="navbar-btn hidden sm:inline-flex"
              onClick={openCmd}
              aria-label="Cari"
            >
              <Search className="w-4 h-4" />
              <kbd
                className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: "rgba(0,0,0,.25)", color: "#c2c7d0" }}
              >
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              className="navbar-btn hidden sm:inline-flex"
              onClick={() => setHelpOpen(true)}
              aria-label="Pintasan keyboard"
              title="Pintasan keyboard (?)"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            <NotificationsBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="navbar-user-btn">
                  <span className="nu-avatar">{user.name.charAt(0).toUpperCase()}</span>
                  <span className="nu-meta hidden md:flex">
                    <span className="nu-name">{user.name}</span>
                    <span className="nu-role">
                      <RoleIcon className="w-3 h-3" /> {roleLabel}
                    </span>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8a94a6] hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="text-xs">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{user.name}</span>
                    <span className="text-muted-foreground">{user.email}</span>
                    <Badge variant="outline" className="mt-1 w-fit text-[10px]">
                      <RoleIcon className="w-3 h-3 mr-1" /> {roleLabel}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setView("dashboard")} className="cursor-pointer">
                  <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView("public")} className="cursor-pointer">
                  <Search className="w-4 h-4 mr-2" /> Lacak Surat (Publik)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setView("profil")} className="cursor-pointer">
                  <UserCog className="w-4 h-4 mr-2" /> Pengaturan Akun
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>

        {/* Content area */}
        <section className="content">{children}</section>

        {/* Footer */}
        <AdminFooter appName={appName} />
      </div>

      {/* Command Palette (Cmd+K) — key changes on each open to reset internal state */}
      <CommandPalette
        key={cmdKey}
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        setView={setView}
        selectPermohonan={selectPermohonan}
        onLogout={handleLogout}
      />

      {/* Keyboard Shortcuts Help (? key) */}
      <KeyboardShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
