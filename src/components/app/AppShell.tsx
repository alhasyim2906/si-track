"use client";
import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import { api } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/constants";
import { LogoFull, Logo } from "./Logo";
import { LoginModal } from "./LoginModal";
import { NotificationsBell } from "./NotificationsBell";
import { CommandPalette } from "./shared/CommandPalette";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  LayoutDashboard, FileText, PlusCircle, BarChart3, ScrollText,
  Users, FileStack, LogOut, LogIn, Menu, Search, ChevronDown, ShieldCheck, UserCog, Crown,
} from "lucide-react";
import type { AppView } from "@/lib/types";

const navItems: { view: AppView; label: string; icon: any; roles: string[] }[] = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "PETUGAS", "ATASAN"] },
  { view: "profil", label: "Profil", icon: UserCog, roles: ["ADMIN", "PETUGAS", "ATASAN"] },
  { view: "permohonan", label: "Permohonan", icon: FileText, roles: ["ADMIN", "PETUGAS", "ATASAN"] },
  { view: "permohonan-baru", label: "Daftar Baru", icon: PlusCircle, roles: ["ADMIN", "PETUGAS"] },
  { view: "laporan", label: "Laporan", icon: BarChart3, roles: ["ADMIN", "ATASAN"] },
  { view: "jenis-surat", label: "Jenis Surat", icon: FileStack, roles: ["ADMIN"] },
  { view: "users", label: "Pengguna", icon: Users, roles: ["ADMIN"] },
  { view: "audit-log", label: "Audit Log", icon: ScrollText, roles: ["ADMIN"] },
];

function NavLinks({
  items,
  view,
  setView,
  onNavigate,
}: {
  items: typeof navItems;
  view: AppView;
  setView: (v: AppView) => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        const active = view === item.view || (item.view === "permohonan" && view === "permohonan-detail");
        return (
          <button
            key={item.view}
            onClick={() => { setView(item.view); onNavigate?.(); }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              active
                ? "bg-primary/15 text-primary gold-border border"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/60 border border-transparent"
            )}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </button>
        );
      })}
    </>
  );
}

export function AppShell({ children, onLoginClick }: { children: React.ReactNode; onLoginClick: () => void }) {
  const { user, view, setView, setUser, selectPermohonan } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdKey, setCmdKey] = useState(0);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdKey((k) => k + 1);
        setCmdOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const items = navItems.filter((i) => !user || i.roles.includes(user.role));

  const handleLogout = async () => {
    try {
      await api.logout();
      setUser(null);
      toast.success("Anda telah keluar");
    } catch {
      toast.error("Gagal logout");
    }
  };

  const roleIcon = user?.role === "ADMIN" ? ShieldCheck : user?.role === "ATASAN" ? Crown : UserCog;
  const RoleIcon = roleIcon;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 glass-card">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Logo */}
            <button onClick={() => setView(user ? "dashboard" : "public")} className="shrink-0">
              <LogoFull />
            </button>

            {/* Desktop nav */}
            {user && (
              <nav className="hidden lg:flex items-center gap-1">
                <NavLinks items={items} view={view} setView={setView} />
              </nav>
            )}

            {/* Right actions */}
            <div className="flex items-center gap-1.5">
              {!user ? (
                <>
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
                </>
              ) : (
                <>
                  {/* Command Palette trigger */}
                  <button
                    onClick={() => { setCmdKey((k) => k + 1); setCmdOpen(true); }}
                    className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border border-border/60 bg-background/60 hover:bg-accent/60 text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    <span className="text-xs">Cari...</span>
                    <kbd className="ml-1 pointer-events-none inline-flex h-5 items-center gap-0.5 rounded border border-border/60 bg-muted/40 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </button>
                  <NotificationsBell />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-9 px-2 gap-2 hover:bg-accent">
                        <Avatar className="w-7 h-7 border border-primary/40">
                          <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden md:flex flex-col items-start leading-tight">
                          <span className="text-xs font-semibold">{user.name}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <RoleIcon className="w-3 h-3" /> {ROLE_LABELS[user.role]}
                          </span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-card navy-glow w-56">
                      <DropdownMenuLabel className="text-xs">
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{user.name}</span>
                          <span className="text-muted-foreground">{user.email}</span>
                          <Badge variant="outline" className="mt-1 w-fit text-[10px]">
                            <RoleIcon className="w-3 h-3 mr-1" /> {ROLE_LABELS[user.role]}
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
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                        <LogOut className="w-4 h-4 mr-2" /> Keluar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}

              {/* Mobile menu */}
              {user && (
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 glass-card border-primary/20">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <Logo size={32} /> <span className="gold-gradient-text">SI-TRACK TANAH</span>
                      </SheetTitle>
                    </SheetHeader>
                    <nav className="flex flex-col gap-1 mt-4">
                      <NavLinks items={items} view={view} setView={setView} onNavigate={() => setMobileOpen(false)} />
                      <div className="mt-4 pt-4 border-t border-border/40">
                        <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
                          <LogOut className="w-4 h-4 mr-2" /> Keluar
                        </Button>
                      </div>
                    </nav>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <FooterLazy />

      {/* Command Palette (Cmd+K) — key changes on each open to reset internal state */}
      <CommandPalette
        key={cmdKey}
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        setView={setView}
        selectPermohonan={selectPermohonan}
        onLogout={handleLogout}
      />
    </div>
  );
}

import { Footer } from "./Footer";
function FooterLazy() {
  return <Footer />;
}
