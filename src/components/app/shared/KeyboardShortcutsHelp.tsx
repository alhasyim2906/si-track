"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Keyboard, Search, Home, FileText, Plus, BarChart3, Users, Bell, LogOut } from "lucide-react";

interface ShortcutItem {
  keys: string[];
  label: string;
  icon: any;
  section: string;
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ["⌘", "K"], label: "Buka pencarian & palet perintah", icon: Search, section: "Umum" },
  { keys: ["?"], label: "Tampilkan bantuan shortcut ini", icon: Keyboard, section: "Umum" },
  { keys: ["Esc"], label: "Tutup dialog / modal", icon: LogOut, section: "Umum" },
  { keys: ["G", "D"], label: "Ke Dashboard", icon: Home, section: "Navigasi" },
  { keys: ["G", "P"], label: "Ke Daftar Permohonan", icon: FileText, section: "Navigasi" },
  { keys: ["G", "B"], label: "Buat Permohonan Baru", icon: Plus, section: "Navigasi" },
  { keys: ["G", "L"], label: "Ke Laporan", icon: BarChart3, section: "Navigasi" },
  { keys: ["G", "U"], label: "Ke Manajemen Pengguna", icon: Users, section: "Navigasi" },
  { keys: ["N"], label: "Buka notifikasi", icon: Bell, section: "Aksi Cepat" },
];

export function KeyboardShortcutsHelp({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const sections = Array.from(new Set(SHORTCUTS.map((s) => s.section)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-primary/20 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Keyboard className="w-5 h-5 text-primary" />
            Pintasan Keyboard
          </DialogTitle>
          <DialogDescription>
            Percepat pekerjaan Anda dengan pintasan keyboard berikut.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2 max-h-[60vh] overflow-y-auto pr-1">
          {sections.map((section) => (
            <div key={section}>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                {section}
              </h3>
              <div className="space-y-1">
                {SHORTCUTS.filter((s) => s.section === section).map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{s.label}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {s.keys.map((k, j) => (
                          <kbd
                            key={j}
                            className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted/60 px-1.5 font-mono text-[11px] font-semibold text-foreground shadow-sm"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-border/60">
          <p className="text-[11px] text-muted-foreground text-center">
            Di macOS gunakan <kbd className="font-mono font-semibold">⌘</kbd>,
            di Windows/Linux gunakan <kbd className="font-mono font-semibold">Ctrl</kbd>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default KeyboardShortcutsHelp;
