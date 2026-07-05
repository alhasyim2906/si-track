"use client";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: any;
  accent?: string; // hex
  hint?: string;
  trend?: number; // % change
  onClick?: () => void;
  compact?: boolean;
}

export function StatCard({ label, value, icon: Icon, accent = "#d4af37", hint, trend, onClick, compact }: StatCardProps) {
  return (
    <Card
      className={cn(
        "glass-card border-primary/15 overflow-hidden transition-all",
        onClick && "cursor-pointer hover:gold-border hover:-translate-y-0.5"
      )}
      onClick={onClick}
    >
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <CardContent className={cn(compact ? "p-3.5" : "p-4 sm:p-5")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium truncate">{label}</p>
            <p className={cn("font-extrabold mt-1", compact ? "text-xl" : "text-2xl sm:text-3xl")}>{value}</p>
            {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
            {typeof trend === "number" && (
              <p className={cn("text-[10px] mt-1 flex items-center gap-0.5", trend >= 0 ? "text-green-400" : "text-red-400")}>
                {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {Math.abs(trend)}% dari bulan lalu
              </p>
            )}
          </div>
          <div
            className={cn("rounded-xl flex items-center justify-center shrink-0", compact ? "w-9 h-9" : "w-11 h-11")}
            style={{ backgroundColor: `${accent}1a`, border: `1px solid ${accent}40` }}
          >
            <Icon className={cn(compact ? "w-4.5 h-4.5" : "w-5 h-5")} style={{ color: accent }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SectionHeader({ title, subtitle, icon: Icon, action }: { title: string; subtitle?: string; icon?: any; action?: React.ReactNode }) {
  const I = Icon;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div className="flex items-center gap-3">
        {I && (
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <I className="w-5 h-5 text-primary" />
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
