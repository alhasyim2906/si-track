"use client";
import { cn } from "@/lib/utils";

export type SmallBoxVariant =
  | "primary"
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "gold";

/**
 * AdminLTE 4 signature "small-box" widget.
 * Colored box with a big number, uppercase label, large translucent icon,
 * and a darker "More info ›" footer that is clickable.
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
  onClick,
}: {
  number: number | string;
  label: string;
  icon: any;
  variant?: SmallBoxVariant;
  footerText?: string;
  onClick?: () => void;
}) {
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
      </div>
      <Icon className="sb-icon" />
      <span className="sb-footer">
        {footerText} <span className="sb-arrow">›</span>
      </span>
    </button>
  );
}

export default SmallBox;
