"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, ArrowRight, ChevronRight } from "lucide-react";

/* ============================================================
   RecentActivityWidget
   --------------------------------------------------------------
   AdminLTE-style card showing the 5 most recent process events
   (RiwayatProses) across all permohonan. Each row is a vertical
   timeline entry with a colored avatar (initial letter, color by
   role) + action description + relative time. Clicking a row
   opens the permohonan detail.

   Roles → avatar color:
     - ADMIN   → blue   (#0d6efd)
     - PETUGAS → gold   (#d4af37)
     - ATASAN  → green  (#16a34a)
   ============================================================ */

export interface RecentActivityItem {
  id: string;
  permohonanId: string;
  nomorRegister: string;
  pemohonNama: string;
  jenisSurat: string;
  currentTahap: string;
  statusKode: string;
  statusNama: string;
  catatan: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: "ADMIN" | "PETUGAS" | "ATASAN";
  };
}

/** Indonesian relative time formatter. */
function relativeTimeId(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return "baru saja";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "kemarin";
  if (day < 7) return `${day} hari lalu`;
  const week = Math.floor(day / 7);
  if (week < 4) return `${week} minggu lalu`;
  // older — formatted date
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "#0d6efd",
  PETUGAS: "#d4af37",
  ATASAN: "#16a34a",
};

const ROLE_LABEL_SHORT: Record<string, string> = {
  ADMIN: "Admin",
  PETUGAS: "Petugas",
  ATASAN: "Atasan",
};

export function RecentActivityWidget({ limit = 5 }: { limit?: number }) {
  const setView = useAppStore((s) => s.setView);
  const [items, setItems] = useState<RecentActivityItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const r = await api.riwayatRecent(limit);
        if (!cancelled) setItems(r.items || []);
      } catch {
        if (!cancelled) {
          setError(true);
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  const handleClick = (permohonanId: string) => {
    setView("permohonan-detail");
    // Defer to next tick so the permohonan detail view can read the store
    setTimeout(() => {
      useAppStore.getState().selectPermohonan(permohonanId);
    }, 0);
  };

  return (
    <Card className="glass-card border-primary/15">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Aktivitas Terbaru
          </CardTitle>
          <CardDescription>
            {limit} aktivitas proses terakhir di seluruh permohonan
          </CardDescription>
        </div>
        <button
          onClick={() => setView("permohonan")}
          className="text-xs gold-text font-semibold inline-flex items-center gap-1 hover:gap-1.5 transition-all"
          aria-label="Lihat semua permohonan"
        >
          Lihat Semua <ArrowRight className="w-3 h-3" />
        </button>
      </CardHeader>
      <CardContent>
        {/* Loading skeleton — 3 rows */}
        {loading && (
          <div className="space-y-3 py-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && items && items.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            <Activity className="w-7 h-7 mx-auto mb-2 opacity-40" />
            Belum ada aktivitas terbaru
          </div>
        )}

        {/* Timeline list */}
        {!loading && items && items.length > 0 && (
          <ol className="relative max-h-96 overflow-y-auto pr-1 -mr-1">
            {/* vertical connector line */}
            <span
              aria-hidden="true"
              className="absolute left-[18px] top-2 bottom-2 w-px bg-border"
            />
            {items.map((it) => {
              const color = ROLE_COLOR[it.user.role] || "#d4af37";
              const roleLabel = ROLE_LABEL_SHORT[it.user.role] || it.user.role;
              return (
                <li key={it.id} className="relative">
                  <button
                    type="button"
                    onClick={() => handleClick(it.permohonanId)}
                    className="w-full text-left rounded-lg p-2.5 hover:bg-secondary/40 transition-colors border border-transparent hover:border-primary/20 flex items-start gap-3 group"
                  >
                    {/* Avatar circle (sits above connector line) */}
                    <span
                      className="relative z-10 shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-background"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    >
                      {it.user.name.charAt(0).toUpperCase()}
                    </span>
                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-tight">
                        <span className="font-semibold">{it.user.name}</span>{" "}
                        <span
                          className="inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded mr-1 align-middle"
                          style={{
                            color,
                            backgroundColor: `${color}1a`,
                          }}
                        >
                          {roleLabel}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        memajukan{" "}
                        <span className="font-mono font-semibold text-foreground/80">
                          {it.nomorRegister}
                        </span>{" "}
                        ke{" "}
                        <span className="font-medium text-foreground">
                          {it.statusNama || it.statusKode}
                        </span>
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 mt-1 flex items-center gap-1">
                        <span>{it.pemohonNama}</span>
                        <span aria-hidden="true">·</span>
                        <span>{it.jenisSurat}</span>
                      </p>
                    </div>
                    {/* Right meta */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {relativeTimeId(it.createdAt)}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        )}

        {/* Error state (silent — render empty state) */}
        {!loading && error && items && items.length === 0 && null}
      </CardContent>
    </Card>
  );
}

export default RecentActivityWidget;
