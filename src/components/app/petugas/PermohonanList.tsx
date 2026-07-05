"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { STATUS_DEFINITIONS } from "@/lib/constants";
import type { PermohonanListItem } from "@/lib/types";
import { SectionHeader } from "@/components/app/StatCard";
import { StatusBadge, PriorityBadge } from "@/components/app/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  PlusCircle, Search, FileText, ChevronLeft, ChevronRight,
  Inbox, Loader2, Eye, Hash, User, Calendar, Files, MessageSquare,
  Download, X, CheckSquare, CalendarRange, Trash2, ArrowRight,
  ChevronsUpDown, Filter, AlertTriangle,
} from "lucide-react";

const PER_PAGE_OPTIONS = ["10", "20", "50"];

const PRIORITY_OPTIONS = [
  { value: "ALL", label: "Semua Prioritas" },
  { value: "NORMAL", label: "Normal" },
  { value: "TINGGI", label: "Tinggi" },
  { value: "MENDESAK", label: "Mendesak" },
] as const;

type DateRangePreset = "today" | "7days" | "30days" | "";

function formatDate(d: string): string {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function PermohonanList() {
  const { selectPermohonan, setView, can } = useAppStore();
  const canCreate = can("create_permohonan");
  const canDelete = can("delete_permohonan");
  const canChangeStatus = can("change_status");

  const [items, setItems] = useState<PermohonanListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [prioritas, setPrioritas] = useState<string>("ALL");
  const [limit, setLimit] = useState<string>("10");
  const [page, setPage] = useState(1);

  // advanced date-range filter (YYYY-MM-DD or empty)
  const [dariTanggal, setDariTanggal] = useState<string>("");
  const [sampaiTanggal, setSampaiTanggal] = useState<string>("");
  const [datePreset, setDatePreset] = useState<DateRangePreset>("");

  // bulk selection mode
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // bulk action dialog states
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [bulkStatusKode, setBulkStatusKode] = useState("");
  const [bulkCatatan, setBulkCatatan] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | undefined> = {
        q: debouncedQ || undefined,
        status: status && status !== "ALL" ? status : undefined,
        prioritas: prioritas && prioritas !== "ALL" ? prioritas : undefined,
        page: String(page),
        limit,
        dariTanggal: dariTanggal || undefined,
        sampaiTanggal: sampaiTanggal || undefined,
      };
      const r = await api.listPermohonan(params);
      setItems(r.items || []);
      setTotal(r.total || 0);
      // clear selection when page/filter changes
      setSelectedIds(new Set());
    } catch (e: any) {
      setError(e.message || "Gagal memuat data");
      toast.error(e.message || "Gagal memuat data permohonan");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, status, prioritas, page, limit, dariTanggal, sampaiTanggal]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const totalPages = Math.max(1, Math.ceil(total / Number(limit || 10)));

  // Helper to format a YYYY-MM-DD date string into a localized short date.
  const formatDateShort = (d: string): string => {
    if (!d) return "";
    try {
      return new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  const hasDateRange = !!(dariTanggal || sampaiTanggal);
  const hasAnyFilter = !!(debouncedQ || (status && status !== "ALL") || (prioritas && prioritas !== "ALL") || hasDateRange);

  // Count active filters for badge
  const activeFilterCount = [
    debouncedQ,
    status && status !== "ALL",
    prioritas && prioritas !== "ALL",
    hasDateRange,
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    setQ("");
    setDebouncedQ("");
    setStatus("ALL");
    setPrioritas("ALL");
    setDariTanggal("");
    setSampaiTanggal("");
    setDatePreset("");
    setPage(1);
  };

  // ---- Date range preset helpers ----
  const applyDatePreset = (preset: DateRangePreset) => {
    const today = new Date();
    const todayStr = toISODate(today);
    setDatePreset(preset);

    if (preset === "today") {
      setDariTanggal(todayStr);
      setSampaiTanggal(todayStr);
    } else if (preset === "7days") {
      const from = new Date();
      from.setDate(from.getDate() - 6);
      setDariTanggal(toISODate(from));
      setSampaiTanggal(todayStr);
    } else if (preset === "30days") {
      const from = new Date();
      from.setDate(from.getDate() - 29);
      setDariTanggal(toISODate(from));
      setSampaiTanggal(todayStr);
    }
    setPage(1);
  };

  // ---- bulk selection helpers ----
  const allOnPageSelected = items.length > 0 && items.every((it) => selectedIds.has(it.id));
  const someOnPageSelected = items.some((it) => selectedIds.has(it.id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        items.forEach((it) => next.delete(it.id));
      } else {
        items.forEach((it) => next.add(it.id));
      }
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkMode(false);
  };

  const enterBulkMode = () => {
    setBulkMode(true);
  };

  const exitBulkMode = () => {
    setBulkMode(false);
    setSelectedIds(new Set());
  };

  // ---- CSV export helpers ----
  const buildCsv = (data: PermohonanListItem[]) => {
    const headers = [
      "Nomor Register", "Nama Pemohon", "NIK", "Jenis Surat",
      "Status", "Prioritas", "Dibuat", "Selesai", "Keperluan",
    ];
    const rows = data.map((it) => [
      it.nomorRegister,
      it.pemohonNama,
      it.pemohonNik,
      it.jenisSurat?.nama || "-",
      it.statusNama || it.statusSaatIni,
      it.prioritas || "NORMAL",
      it.createdAt ? new Date(it.createdAt).toLocaleDateString("id-ID") : "-",
      it.tanggalSelesai ? new Date(it.tanggalSelesai).toLocaleDateString("id-ID") : "-",
      (it.keperluan || "-").replace(/[\n\r,]/g, " "),
    ]);
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    return [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  };

  const downloadCsv = (csv: string, filename: string) => {
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export selected items to CSV
  const exportSelectedCsv = () => {
    const selected = items.filter((it) => selectedIds.has(it.id));
    if (selected.length === 0) {
      toast.error("Tidak ada item terpilih untuk diekspor");
      return;
    }
    const csv = buildCsv(selected);
    downloadCsv(csv, `permohonan-terpilih-${toISODate(new Date())}.csv`);
    toast.success(`${selected.length} permohonan diekspor ke CSV`);
  };

  // Export current page to CSV
  const exportPageCsv = () => {
    if (!items.length) {
      toast.error("Tidak ada data pada halaman ini");
      return;
    }
    const csv = buildCsv(items);
    downloadCsv(csv, `permohonan-halaman-${page}-${toISODate(new Date())}.csv`);
    toast.success(`${items.length} permohonan (halaman ini) diekspor ke CSV`);
  };

  // Export all matching filter to CSV (fetch all pages)
  const exportAllCsv = async () => {
    try {
      const params: Record<string, string | undefined> = {
        q: debouncedQ || undefined,
        status: status && status !== "ALL" ? status : undefined,
        prioritas: prioritas && prioritas !== "ALL" ? prioritas : undefined,
        page: "1",
        limit: String(total || 10000),
        dariTanggal: dariTanggal || undefined,
        sampaiTanggal: sampaiTanggal || undefined,
      };
      const r = await api.listPermohonan(params);
      const allItems = r.items || [];
      if (!allItems.length) {
        toast.error("Tidak ada data untuk diekspor");
        return;
      }
      const csv = buildCsv(allItems);
      downloadCsv(csv, `permohonan-semua-${toISODate(new Date())}.csv`);
      toast.success(`${allItems.length} permohonan diekspor ke CSV`);
    } catch {
      toast.error("Gagal mengekspor data");
    }
  };

  // ---- Bulk actions ----
  const handleBulkChangeStatus = async () => {
    if (!bulkStatusKode) {
      toast.error("Pilih status baru");
      return;
    }
    setBulkProcessing(true);
    let success = 0;
    let failed = 0;
    for (const id of selectedIds) {
      try {
        await api.changeStatus(id, { statusKode: bulkStatusKode, catatan: bulkCatatan || undefined });
        success++;
      } catch {
        failed++;
      }
    }
    setBulkProcessing(false);
    setShowStatusDialog(false);
    setBulkStatusKode("");
    setBulkCatatan("");
    if (success > 0) {
      toast.success(`${success} permohonan berhasil diubah statusnya`);
      fetchList();
    }
    if (failed > 0) {
      toast.error(`${failed} permohonan gagal diubah statusnya`);
    }
    exitBulkMode();
  };

  const handleBulkDelete = async () => {
    setBulkProcessing(true);
    let success = 0;
    let failed = 0;
    for (const id of selectedIds) {
      try {
        await api.deletePermohonan(id);
        success++;
      } catch {
        failed++;
      }
    }
    setBulkProcessing(false);
    setShowDeleteDialog(false);
    if (success > 0) {
      toast.success(`${success} permohonan berhasil dihapus`);
      fetchList();
    }
    if (failed > 0) {
      toast.error(`${failed} permohonan gagal dihapus`);
    }
    exitBulkMode();
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-5">
      {/* Header with bulk select toggle + export */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <SectionHeader
          title="Daftar Permohonan"
          subtitle="Kelola seluruh permohonan surat tanah"
          icon={FileText}
        />
        <div className="flex items-center gap-2 shrink-0">
          {!bulkMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={enterBulkMode}
                className="gap-1.5"
              >
                <CheckSquare className="w-4 h-4" /> Pilih
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Download className="w-4 h-4" /> Export
                    <ChevronsUpDown className="w-3 h-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportAllCsv}>
                    <Download className="w-4 h-4 mr-2" /> Export CSV (Semua)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPageCsv}>
                    <Download className="w-4 h-4 mr-2" /> Export CSV (Halaman Ini)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {selectedIds.size > 0 && (
                <Badge className="bg-primary/15 border border-primary/30 text-primary text-[11px] font-semibold px-2.5">
                  {selectedIds.size} dipilih
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={exitBulkMode}
                className="gap-1.5"
              >
                <X className="w-4 h-4" /> Batalkan
              </Button>
            </>
          )}
          {canCreate && (
            <Button
              onClick={() => setView("permohonan-baru")}
              className="alte-btn-primary font-semibold"
            >
              <PlusCircle className="w-4 h-4" /> Daftar Baru
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card border-primary/15">
        <CardContent className="p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_160px_140px]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Cari nomor register, nama pemohon, atau NIK..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                {STATUS_DEFINITIONS.map((s) => (
                  <SelectItem key={s.kode} value={s.kode}>
                    {s.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={prioritas} onValueChange={(v) => { setPrioritas(v); setPage(1); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Prioritas" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={limit} onValueChange={(v) => { setLimit(v); setPage(1); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Per halaman" />
              </SelectTrigger>
              <SelectContent>
                {PER_PAGE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={n}>{n} / halaman</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range quick chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <CalendarRange className="w-3 h-3" /> Rentang:
            </span>
            {(["today", "7days", "30days"] as const).map((preset) => {
              const labels: Record<string, string> = { today: "Hari Ini", "7days": "7 Hari", "30days": "30 Hari" };
              const isActive = datePreset === preset;
              return (
                <Button
                  key={preset}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={"h-7 text-[11px] px-2.5 gap-1 " + (isActive ? "bg-primary/20 border-primary/40 text-primary hover:bg-primary/30" : "")}
                  onClick={() => {
                    if (isActive) {
                      setDatePreset("");
                      setDariTanggal("");
                      setSampaiTanggal("");
                      setPage(1);
                    } else {
                      applyDatePreset(preset);
                    }
                  }}
                >
                  {labels[preset]}
                </Button>
              );
            })}
          </div>

          {/* Advanced date-range filter */}
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <label
                htmlFor="dariTanggal"
                className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"
              >
                <CalendarRange className="w-3 h-3" /> Dari Tanggal
              </label>
              <Input
                id="dariTanggal"
                type="date"
                value={dariTanggal}
                onChange={(e) => { setDariTanggal(e.target.value); setDatePreset(""); setPage(1); }}
                className="w-full"
                max={sampaiTanggal || undefined}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="sampaiTanggal"
                className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5"
              >
                <Calendar className="w-3 h-3" /> Sampai Tanggal
              </label>
              <Input
                id="sampaiTanggal"
                type="date"
                value={sampaiTanggal}
                onChange={(e) => { setSampaiTanggal(e.target.value); setDatePreset(""); setPage(1); }}
                className="w-full"
                min={dariTanggal || undefined}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasDateRange}
              onClick={() => { setDariTanggal(""); setSampaiTanggal(""); setDatePreset(""); setPage(1); }}
              className="h-9"
              title="Reset rentang tanggal"
            >
              <X className="w-3.5 h-3.5" /> Reset Tanggal
            </Button>
          </div>

          {/* Active filter chips + count */}
          {hasAnyFilter && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Filter className="w-3 h-3" />
                Filter aktif
                <Badge className="h-5 min-w-[20px] flex items-center justify-center text-[10px] px-1.5 bg-primary/20 text-primary border-primary/30">
                  {activeFilterCount}
                </Badge>:
              </span>
              {debouncedQ && (
                <Badge variant="outline" className="text-[11px] border-primary/30 bg-primary/5">
                  &quot;{debouncedQ}&quot;
                </Badge>
              )}
              {status && status !== "ALL" && (
                <Badge variant="outline" className="text-[11px] border-primary/30 bg-primary/5">
                  {STATUS_DEFINITIONS.find((s) => s.kode === status)?.nama || status}
                </Badge>
              )}
              {prioritas && prioritas !== "ALL" && (
                <Badge variant="outline" className="text-[11px] border-primary/30 bg-primary/5">
                  {PRIORITY_OPTIONS.find((p) => p.value === prioritas)?.label || prioritas}
                </Badge>
              )}
              {dariTanggal && (
                <Badge variant="outline" className="text-[11px] border-primary/30 bg-primary/5">
                  Dari: {formatDateShort(dariTanggal)}
                </Badge>
              )}
              {sampaiTanggal && (
                <Badge variant="outline" className="text-[11px] border-primary/30 bg-primary/5">
                  Sampai: {formatDateShort(sampaiTanggal)}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2"
                onClick={resetAllFilters}
              >
                Reset Semua
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Card className="glass-card border-primary/15">
          <CardContent className="p-4 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md skeleton-shimmer" />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {!loading && error && (
        <Card className="glass-card border-destructive/30">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchList}>
              Coba lagi
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <Card className="glass-card border-primary/15">
          <CardContent className="p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold">Belum ada permohonan</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Belum terdapat permohonan yang sesuai dengan filter Anda.
              {canCreate && " Anda dapat mendaftarkan permohonan baru."}
            </p>
            {canCreate && (
              <Button
                onClick={() => setView("permohonan-baru")}
                className="mt-4 bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
              >
                <PlusCircle className="w-4 h-4" /> Daftar Permohonan Baru
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulk action bar (sticky bottom, appears in bulk mode when items selected) */}
      {bulkMode && selectedIds.size > 0 && (
        <div className="sticky bottom-4 z-30 animate-fade-in-up">
          <Card className="border-primary/40 shadow-lg" style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(184,148,31,0.08) 100%)" }}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                    <CheckSquare className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {selectedIds.size} permohonan dipilih
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Pilih aksi untuk item terpilih
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canChangeStatus && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowStatusDialog(true)}
                      className="border-primary/30 gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5" /> Ubah Status
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={exportSelectedCsv}
                    className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90 gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </Button>
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      className="gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearSelection}
                    className="gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" /> Batalkan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk status change dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Status Massal</DialogTitle>
            <DialogDescription>
              Ubah status untuk {selectedIds.size} permohonan terpilih.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Baru</label>
              <Select value={bulkStatusKode} onValueChange={setBulkStatusKode}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status..." />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_DEFINITIONS.map((s) => (
                    <SelectItem key={s.kode} value={s.kode}>
                      {s.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan (opsional)</label>
              <Input
                placeholder="Catatan perubahan status..."
                value={bulkCatatan}
                onChange={(e) => setBulkCatatan(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)} disabled={bulkProcessing}>
              Batal
            </Button>
            <Button
              onClick={handleBulkChangeStatus}
              disabled={!bulkStatusKode || bulkProcessing}
              className="alte-btn-primary"
            >
              {bulkProcessing && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              Ubah Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk delete alert dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Hapus {selectedIds.size} Permohonan?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. {selectedIds.size} permohonan yang dipilih akan dihapus secara permanen beserta seluruh riwayat dan dokumen terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkProcessing}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkProcessing && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Table (desktop) */}
      {!loading && !error && items.length > 0 && (
        <>
          <Card className="glass-card border-primary/15 hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    {bulkMode && (
                      <TableHead className="w-[44px] pl-4">
                        <Checkbox
                          checked={allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Pilih semua di halaman ini"
                        />
                      </TableHead>
                    )}
                    <TableHead>Nomor Register</TableHead>
                    <TableHead>Pemohon</TableHead>
                    <TableHead>Jenis Surat</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right pr-4">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => {
                    const isSelected = selectedIds.has(it.id);
                    return (
                      <TableRow
                        key={it.id}
                        className={"cursor-pointer border-border/40 " + (isSelected && bulkMode ? "bg-primary/8" : "")}
                        onClick={() => {
                          if (!bulkMode) selectPermohonan(it.id);
                        }}
                      >
                        {bulkMode && (
                          <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectOne(it.id)}
                              aria-label={`Pilih ${it.nomorRegister}`}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-1 rounded-md border border-primary/30 bg-primary/5 text-primary font-semibold">
                            <Hash className="w-3 h-3" />
                            {it.nomorRegister}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{it.pemohonNama}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">{it.pemohonNik}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {it.jenisSurat?.nama || "-"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge kode={it.statusSaatIni} nama={it.statusNama} size="sm" />
                        </TableCell>
                        <TableCell>
                          {it.prioritas && it.prioritas !== "NORMAL" ? (
                            <PriorityBadge prioritas={it.prioritas} />
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Normal</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(it.createdAt)}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectPermohonan(it.id);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" /> Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Card list (mobile) */}
          <div className="md:hidden space-y-3">
            {items.map((it) => {
              const isSelected = selectedIds.has(it.id);
              return (
              <Card
                key={it.id}
                className={"glass-card border-primary/15 cursor-pointer hover:gold-border transition-all " + (isSelected && bulkMode ? "border-primary/40 bg-primary/5" : "")}
                onClick={() => {
                  if (bulkMode) {
                    toggleSelectOne(it.id);
                  } else {
                    selectPermohonan(it.id);
                  }
                }}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {bulkMode && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectOne(it.id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Pilih ${it.nomorRegister}`}
                        />
                      )}
                      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] px-2 py-1 rounded-md border border-primary/30 bg-primary/5 text-primary font-semibold">
                        <Hash className="w-3 h-3" />
                        {it.nomorRegister}
                      </span>
                    </div>
                    <StatusBadge kode={it.statusSaatIni} nama={it.statusNama} size="sm" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      {it.pemohonNama}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono ml-5">{it.pemohonNik}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {it.jenisSurat?.nama || "-"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(it.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Files className="w-3 h-3" />
                      {it._count?.dokumen ?? 0} dok
                    </span>
                  </div>
                  {it.prioritas && it.prioritas !== "NORMAL" && (
                    <PriorityBadge prioritas={it.prioritas} />
                  )}
                </CardContent>
              </Card>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <p className="text-xs text-muted-foreground">
              Menampilkan <span className="font-semibold text-foreground">{items.length}</span> dari{" "}
              <span className="font-semibold text-foreground">{total}</span> permohonan
              {total > 0 && (
                <span className="ml-1">
                  · Halaman {page} / {totalPages}
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" /> Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Berikutnya <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Loading overlay footer */}
      {loading && items.length === 0 && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> Memuat data permohonan...
          </span>
        </div>
      )}
    </div>
  );
}

export default PermohonanList;
