"use client";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type InfoBoxVariant =
  | "primary"
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "gold";

/**
 * AdminLTE 4 signature "info-box" widget.
 *
 * Layout (3 visual zones):
 *   [ colored icon ] [ text/value/progress ]
 *      ↑                ↑
 *    ib-icon         ib-body (title, big value, optional progress bar + caption)
 *
 * Variants: primary (blue), success (green), info (cyan), warning (yellow),
 * danger (red), gold (signature gold).
 *
 * Used on PermohonanDetail header (Tahap Saat Ini / Dokumen / Hari Berjalan)
 * to add the signature AdminLTE info-box widget to the detail page.
 */
export function AlteInfoBox({
  icon: Icon,
  iconVariant = "primary",
  title,
  value,
  progress,
  progressText,
}: {
  icon: LucideIcon;
  iconVariant?: InfoBoxVariant;
  title: string;
  value: string | number;
  progress?: number;
  progressText?: string;
}) {
  // Clamp progress to 0-100 so callers can pass raw numbers safely.
  const clamped =
    typeof progress === "number"
      ? Math.max(0, Math.min(100, progress))
      : null;
  const showProgress = clamped !== null;

  return (
    <div className={cn("alte-info-box", `ib-${iconVariant}`)}>
      <div className="ib-icon">
        <Icon className="w-7 h-7" strokeWidth={2.25} />
      </div>
      <div className="ib-body">
        <div className="ib-text">{title}</div>
        <div className="ib-number">{value}</div>
        {showProgress && (
          <div className="ib-progress" aria-label={`Progress ${clamped}%`}>
            <div
              className="ib-progress-bar"
              style={{ width: `${clamped}%` }}
            />
          </div>
        )}
        {progressText && <div className="ib-progress-text">{progressText}</div>}
      </div>
    </div>
  );
}

export default AlteInfoBox;
