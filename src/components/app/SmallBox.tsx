"use client";
import { cn } from "@/lib/utils";

export type SmallBoxVariant =
  | "primary"
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "gold";

/* ============================================================
   Sparkline
   --------------------------------------------------------------
   Tiny inline SVG (40×16px) used to convey a 6-point trend
   inside a SmallBox. Stroke color auto-adapts to dark text
   variants (info/warning/gold) vs white text variants.
   ============================================================ */
function Sparkline({
  data,
  dark,
}: {
  data: number[];
  dark?: boolean;
}) {
  if (!data || data.length < 2) return null;
  const w = 40;
  const h = 16;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = data.length > 1 ? w / (data.length - 1) : 0;
  const points = data
    .map((v, i) => `${(i * stepX).toFixed(1)},${(h - ((v - min) / range) * (h - 2) - 1).toFixed(1)}`)
    .join(" ");
  const stroke = dark ? "rgba(10,22,40,0.78)" : "rgba(255,255,255,0.88)";
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="sb-sparkline"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * AdminLTE 4 signature "small-box" widget.
 * Colored box with a big number, uppercase label, large translucent icon,
 * an optional tiny sparkline trend, and a darker "More info ›" footer that
 * is clickable.
 *
 * Used by AdminDashboard, PetugasDashboard, AtasanDashboard for visual
 * consistency across all role dashboards.
 */
export function SmallBox({
  number,
  label,
  icon: Icon,
  variant = "primary",
  footerText = "More info",
  trend,
  onClick,
}: {
  number: number | string;
  label: string;
  icon: any;
  variant?: SmallBoxVariant;
  footerText?: string;
  /** Optional 6-point trend data. Renders a tiny sparkline bottom-right. */
  trend?: number[];
  onClick?: () => void;
}) {
  // Variants with dark text (light backgrounds) need dark sparkline stroke.
  const darkText = variant === "info" || variant === "warning" || variant === "gold";
  return (
    <button
      type="button"
      className={cn("alte-small-box", `sb-${variant}`)}
      onClick={onClick}
    >
      <div className="sb-inner">
        <div className="sb-text">
          <div className="sb-number">{number}</div>
          <div className="sb-label">{label}</div>
        </div>
        {trend && trend.length >= 2 && (
          <div className="sb-trend" aria-hidden="true">
            <Sparkline data={trend} dark={darkText} />
          </div>
        )}
      </div>
      <Icon className="sb-icon" />
      <span className="sb-footer">
        {footerText} <span className="sb-arrow">›</span>
      </span>
    </button>
  );
}

export default SmallBox;
