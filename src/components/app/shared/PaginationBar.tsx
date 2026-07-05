"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

/**
 * Reusable pagination bar with gold-accented pager styling (.pager-bar CSS).
 *
 * Renders:
 *   - Summary text: "Menampilkan from-to dari total entri · Halaman x / y"
 *   - First / Prev / page numbers (with ellipsis) / Next / Last buttons
 *
 * When `totalPages <= 1`, a minimal single-line summary is shown.
 */
export function PaginationBar({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  itemName = "entri",
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  /** Word for the items being paginated, e.g. "entri", "permohonan", "pengguna". */
  itemName?: string;
}) {
  if (totalPages <= 1) {
    return (
      <div className="pager-bar">
        <p className="pager-info">
          Menampilkan <strong>{total.toLocaleString("id-ID")}</strong> {itemName} · Halaman 1 / 1
        </p>
        <span className="pager-info">—</span>
      </div>
    );
  }

  // Build a compact page list with ellipsis around the current page.
  const pages: (number | "…")[] = [];
  const windowSize = 1; // pages on each side of current
  const first = 1;
  const last = totalPages;
  const start = Math.max(first + 1, page - windowSize);
  const end = Math.min(last - 1, page + windowSize);

  pages.push(first);
  if (start > first + 1) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < last - 1) pages.push("…");
  if (last !== first) pages.push(last);

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="pager-bar">
      <p className="pager-info">
        Menampilkan <strong>{from.toLocaleString("id-ID")}</strong>–
        <strong>{to.toLocaleString("id-ID")}</strong> dari{" "}
        <strong>{total.toLocaleString("id-ID")}</strong> {itemName} · Halaman {page} / {totalPages}
      </p>
      <div className="pager-controls">
        <button
          type="button"
          className="pager-btn"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          title="Halaman pertama"
          aria-label="Halaman pertama"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="pager-btn"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          title="Halaman sebelumnya"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
        </button>
        {pages.map((p, idx) =>
          p === "…" ? (
            <span key={`e${idx}`} className="pager-ellipsis">…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={`pager-page ${p === page ? "active" : ""}`}
              onClick={() => onPageChange(p)}
              aria-label={`Halaman ${p}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          className="pager-btn"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          title="Halaman berikutnya"
          aria-label="Halaman berikutnya"
        >
          Berikutnya <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="pager-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          title="Halaman terakhir"
          aria-label="Halaman terakhir"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
