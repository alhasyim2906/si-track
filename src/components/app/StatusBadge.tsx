"use client";
import { STATUS_BY_KODE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ kode, nama, className, size = "default" }: { kode: string; nama?: string; className?: string; size?: "sm" | "default" | "lg" }) {
  const def = STATUS_BY_KODE[kode];
  const label = nama || def?.nama || kode;
  const color = def?.warna || "#d4af37";
  const sizeCls = size === "sm" ? "text-[10px] px-2 py-0.5" : size === "lg" ? "text-sm px-3.5 py-1.5" : "text-xs px-2.5 py-1";
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full font-semibold border", sizeCls, className)}
      style={{
        color,
        backgroundColor: `${color}1a`,
        borderColor: `${color}55`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export function PriorityBadge({ prioritas }: { prioritas: string }) {
  if (!prioritas || prioritas === "NORMAL") return null;
  const map: Record<string, { c: string; label: string }> = {
    TINGGI: { c: "#f59e0b", label: "Prioritas Tinggi" },
    MENDESAK: { c: "#dc2626", label: "Mendesak" },
  };
  const m = map[prioritas];
  if (!m) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full text-[10px] font-semibold px-2 py-0.5 border"
      style={{ color: m.c, backgroundColor: `${m.c}1a`, borderColor: `${m.c}55` }}
    >
      {m.label}
    </span>
  );
}
