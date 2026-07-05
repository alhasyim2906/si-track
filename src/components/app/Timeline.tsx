"use client";
import { Check, Clock, X } from "lucide-react";
import { STATUS_BY_KODE } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TimelineProps {
  stages: string[];
  currentIndex: number;
  riwayat?: { statusKode: string; tanggal: string }[];
  compact?: boolean;
}

// Vertical timeline with stage statuses: done / current / pending
export function Timeline({ stages, currentIndex, riwayat = [], compact = false }: TimelineProps) {
  // Map of last date per status (from riwayat)
  const dateMap: Record<string, string> = {};
  for (const r of riwayat) {
    dateMap[r.statusKode] = r.tanggal;
  }

  return (
    <div className="relative">
      {stages.map((kode, idx) => {
        const def = STATUS_BY_KODE[kode];
        const done = idx < currentIndex;
        const current = idx === currentIndex;
        const pending = idx > currentIndex;
        const isFinal = kode === "SELESAI";
        const color = def?.warna || "#d4af37";
        const date = dateMap[kode];

        return (
          <div key={kode} className="flex gap-3 pb-5 last:pb-0 relative">
            {/* connector */}
            {idx < stages.length - 1 && (
              <div
                className={cn("absolute left-[15px] top-8 w-0.5", done ? "" : "bg-border")}
                style={{ height: "calc(100% - 16px)", background: done ? `linear-gradient(${color}, var(--border))` : undefined }}
              />
            )}
            {/* dot */}
            <div className="relative z-10 shrink-0">
              {done ? (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center border-2"
                  style={{ backgroundColor: `${color}25`, borderColor: color, color }}
                >
                  <Check className="w-4 h-4" strokeWidth={3} />
                </div>
              ) : current ? (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center border-2 pulse-gold"
                  style={{ backgroundColor: color, borderColor: color, color: "#0a1628" }}
                >
                  <Clock className="w-4 h-4" strokeWidth={2.5} />
                </div>
              ) : isFinal ? (
                <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-dashed border-muted-foreground/40 text-muted-foreground">
                  <Check className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-dashed border-muted-foreground/40 text-muted-foreground/60">
                  <span className="text-[10px] font-bold">{idx + 1}</span>
                </div>
              )}
            </div>
            {/* content */}
            <div className={cn("flex-1 pt-0.5", compact && "min-w-0")}>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "font-semibold",
                    current ? "text-foreground" : done ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {def?.nama || kode}
                </span>
                {current && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}25`, color }}>
                    Sedang Berjalan
                  </span>
                )}
              </div>
              {!compact && def?.keterangan && (
                <p className="text-xs text-muted-foreground mt-0.5">{def.keterangan}</p>
              )}
              {date && (
                <p className="text-[11px] text-muted-foreground/80 mt-1 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/50" />
                  {new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })} ·{" "}
                  {new Date(date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Horizontal progress bar version
export function ProgressBar({ stages, currentIndex }: { stages: string[]; currentIndex: number }) {
  const total = stages.length;
  const pct = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
        <span>Progress</span>
        <span className="font-semibold gold-text">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary/60 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #f5d77a, #d4af37, #b8941f)",
          }}
        />
      </div>
    </div>
  );
}
