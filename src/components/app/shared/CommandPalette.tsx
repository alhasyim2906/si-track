"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import { api } from "@/lib/api";
import { STATUS_BY_KODE } from "@/lib/constants";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  BarChart3,
  ScrollText,
  Users,
  FileStack,
  ShieldAlert,
  Search,
  LogOut,
  Plus,
  Loader2,
  UserCog,
  Bell,
} from "lucide-react";
import type { AppView } from "@/lib/types";

// ── Navigation items (same structure as AppShell navItems) ──────────────────
const NAV_ITEMS: {
  view: AppView;
  label: string;
  icon: any;
  roles: string[] | null; // null = always visible (for logged-in users)
  shortcut?: string;
}[] = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "PETUGAS", "ATASAN"], shortcut: "D" },
  { view: "permohonan", label: "Permohonan", icon: FileText, roles: ["ADMIN", "PETUGAS", "ATASAN"], shortcut: "P" },
  { view: "permohonan-baru", label: "Daftar Baru", icon: PlusCircle, roles: ["ADMIN", "PETUGAS"] },
  { view: "laporan", label: "Laporan", icon: BarChart3, roles: ["ADMIN", "ATASAN"], shortcut: "L" },
  { view: "jenis-surat", label: "Jenis Surat", icon: FileStack, roles: ["ADMIN"] },
  { view: "status-penguasaan", label: "Status Penguasaan", icon: ShieldAlert, roles: ["ADMIN"] },
  { view: "users", label: "Pengguna", icon: Users, roles: ["ADMIN"] },
  { view: "audit-log", label: "Audit Log", icon: ScrollText, roles: ["ADMIN"] },
  { view: "profil", label: "Profil", icon: UserCog, roles: ["ADMIN", "PETUGAS", "ATASAN"] },
  { view: "notifikasi", label: "Notifikasi", icon: Bell, roles: ["ADMIN", "PETUGAS", "ATASAN"] },
  { view: "public", label: "Lacak Surat (Publik)", icon: Search, roles: null, shortcut: "T" },
];

// ── Types ───────────────────────────────────────────────────────────────────
interface SearchHit {
  id: string;
  nomorRegister: string;
  pemohonNama: string;
  statusKode: string;
  statusNama: string;
  statusWarna: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setView: (v: AppView) => void;
  selectPermohonan: (id: string | null) => void;
  onLogout: () => void;
}

// ── Component ───────────────────────────────────────────────────────────────
// Note: Parent should use a changing `key` prop so the component remounts
// with fresh state each time the dialog opens.
export function CommandPalette({
  open,
  onOpenChange,
  setView,
  selectPermohonan,
  onLogout,
}: CommandPaletteProps) {
  const user = useAppStore((s) => s.user);
  const can = useAppStore((s) => s.can);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);

  // Effective query for search (only when >= 2 chars)
  const effectiveQuery = query.trim().length >= 2 ? query.trim() : "";

  // Debounced search — only fire when effectiveQuery is non-empty
  useEffect(() => {
    if (!effectiveQuery) return;

    const timer = setTimeout(() => {
      setSearching(true);
      setSearchDone(false);
      api
        .listPermohonan({ search: effectiveQuery, limit: "5", page: "1" })
        .then((res) => {
          const hits: SearchHit[] = (res.items || []).map((it: any) => ({
            id: it.id,
            nomorRegister: it.nomorRegister,
            pemohonNama: it.pemohonNama,
            statusKode: it.statusSaatIni,
            statusNama: it.statusNama || STATUS_BY_KODE[it.statusSaatIni]?.nama || it.statusSaatIni,
            statusWarna: it.statusWarna || STATUS_BY_KODE[it.statusSaatIni]?.warna || "#d4af37",
          }));
          setSearchResults(hits);
          setSearchDone(true);
          setSearching(false);
        })
        .catch(() => {
          setSearchResults([]);
          setSearchDone(true);
          setSearching(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [effectiveQuery]);

  // Clear search results when effective query is empty (derive, not effect)
  const visibleResults = effectiveQuery ? searchResults : [];

  const navigate = useCallback(
    (view: AppView) => {
      setView(view);
      onOpenChange(false);
    },
    [setView, onOpenChange]
  );

  const openPermohonan = useCallback(
    (id: string) => {
      selectPermohonan(id);
      onOpenChange(false);
    },
    [selectPermohonan, onOpenChange]
  );

  const handleLogout = useCallback(() => {
    onOpenChange(false);
    onLogout();
  }, [onOpenChange, onLogout]);

  // Filter nav items by role
  const visibleNavItems = user
    ? NAV_ITEMS.filter((i) => i.roles === null || i.roles.includes(user.role))
    : NAV_ITEMS.filter((i) => i.view === "public");

  const canCreate = can("create_permohonan");

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command Palette"
      description="Cari navigasi, permohonan, atau aksi cepat"
      className="glass-card navy-glow border-primary/25 bg-background/95 backdrop-blur-md sm:max-w-lg"
    >
      <CommandInput
        placeholder="Cari navigasi, nomor register, nama pemohon..."
        value={query}
        onValueChange={setQuery}
        className="text-base"
      />
      <CommandList className="max-h-[360px]">
        <CommandEmpty>
          {searching ? (
            <span className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Mencari...
            </span>
          ) : effectiveQuery && searchDone && visibleResults.length === 0 ? (
            "Tidak ditemukan hasil untuk pencarian tersebut."
          ) : query.length === 1 ? (
            "Ketik minimal 2 karakter untuk mencari permohonan..."
          ) : (
            "Tidak ditemukan."
          )}
        </CommandEmpty>

        {/* ── Search Results ──────────────────────────────────────── */}
        {visibleResults.length > 0 && (
          <CommandGroup heading="Hasil Pencarian Permohonan">
            {visibleResults.map((hit) => (
              <CommandItem
                key={hit.id}
                onSelect={() => openPermohonan(hit.id)}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
              >
                {/* Register badge */}
                <span
                  className="shrink-0 font-mono text-xs font-bold px-2 py-0.5 rounded border"
                  style={{
                    color: "#d4af37",
                    borderColor: "#d4af3755",
                    backgroundColor: "#d4af3715",
                  }}
                >
                  {hit.nomorRegister}
                </span>

                <span className="flex-1 truncate text-sm">
                  {hit.pemohonNama}
                </span>

                {/* Status badge */}
                <span
                  className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                  style={{
                    color: hit.statusWarna,
                    backgroundColor: `${hit.statusWarna}1a`,
                    borderColor: `${hit.statusWarna}55`,
                  }}
                >
                  {hit.statusNama}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* ── Navigation ──────────────────────────────────────────── */}
        {user && (
          <CommandGroup heading="Navigasi">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.view}
                  onSelect={() => navigate(item.view)}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 text-sm">{item.label}</span>
                  {item.shortcut && (
                    <CommandShortcut className="text-muted-foreground/60">
                      ⌘{item.shortcut}
                    </CommandShortcut>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* ── Quick Actions ───────────────────────────────────────── */}
        {user && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Aksi Cepat">
              {canCreate && (
                <CommandItem
                  onSelect={() => navigate("permohonan-baru")}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                >
                  <Plus className="w-4 h-4 text-[#d4af37]" />
                  <span className="flex-1 text-sm">Daftar Permohonan Baru</span>
                  <CommandShortcut className="text-muted-foreground/60">⌘N</CommandShortcut>
                </CommandItem>
              )}
              <CommandItem
                onSelect={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer data-[selected=true]:bg-destructive/10 data-[selected=true]:text-destructive"
              >
                <LogOut className="w-4 h-4 text-destructive/70" />
                <span className="flex-1 text-sm text-destructive/90">Keluar (Logout)</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>

      {/* Footer hint */}
      <div className="flex items-center justify-between border-t border-border/40 px-3 py-2 text-[10px] text-muted-foreground/60">
        <span>↑↓ navigasi</span>
        <span>↵ pilih</span>
        <span>esc tutup</span>
      </div>
    </CommandDialog>
  );
}
