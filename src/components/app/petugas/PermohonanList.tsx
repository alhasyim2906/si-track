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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  PlusCircle, Search, FileText, ChevronLeft, ChevronRight,
  Inbox, Loader2, Eye, Hash, User, Calendar, Files, MessageSquare,
} from "lucide-react";

const PER_PAGE_OPTIONS = ["10", "20", "50"];

function formatDate(d: string): string {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

export function PermohonanList() {
  const { selectPermohonan, setView, can } = useAppStore();
  const canCreate = can("create_permohonan");

  const [items, setItems] = useState<PermohonanListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [limit, setLimit] = useState<string>("10");
  const [page, setPage] = useState(1);

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
        page: String(page),
        limit,
      };
      const r = await api.listPermohonan(params);
      setItems(r.items || []);
      setTotal(r.total || 0);
    } catch (e: any) {
      setError(e.message || "Gagal memuat data");
      toast.error(e.message || "Gagal memuat data permohonan");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, status, page, limit]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const totalPages = Math.max(1, Math.ceil(total / Number(limit || 10)));

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-5">
      <SectionHeader
        title="Daftar Permohonan"
        subtitle="Kelola seluruh permohonan surat tanah"
        icon={FileText}
        action={
          canCreate ? (
            <Button
              onClick={() => setView("permohonan-baru")}
              className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
            >
              <PlusCircle className="w-4 h-4" /> Daftar Baru
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <Card className="glass-card border-primary/15">
        <CardContent className="p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_220px_140px]">
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
          {/* active filter chips */}
          {(debouncedQ || (status && status !== "ALL")) && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Filter aktif:</span>
              {debouncedQ && (
                <Badge variant="outline" className="text-[11px] border-primary/30 bg-primary/5">
                  "{debouncedQ}"
                </Badge>
              )}
              {status && status !== "ALL" && (
                <Badge variant="outline" className="text-[11px] border-primary/30 bg-primary/5">
                  {STATUS_DEFINITIONS.find((s) => s.kode === status)?.nama || status}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => { setQ(""); setDebouncedQ(""); setStatus("ALL"); setPage(1); }}
              >
                Reset
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
              <Skeleton key={i} className="h-12 w-full rounded-md" />
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

      {/* Table (desktop) */}
      {!loading && !error && items.length > 0 && (
        <>
          <Card className="glass-card border-primary/15 hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="pl-4">Nomor Register</TableHead>
                    <TableHead>Pemohon</TableHead>
                    <TableHead>Jenis Surat</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right pr-4">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow
                      key={it.id}
                      className="cursor-pointer border-border/40"
                      onClick={() => selectPermohonan(it.id)}
                    >
                      <TableCell className="pl-4">
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Card list (mobile) */}
          <div className="md:hidden space-y-3">
            {items.map((it) => (
              <Card
                key={it.id}
                className="glass-card border-primary/15 cursor-pointer hover:gold-border transition-all"
                onClick={() => selectPermohonan(it.id)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] px-2 py-1 rounded-md border border-primary/30 bg-primary/5 text-primary font-semibold">
                      <Hash className="w-3 h-3" />
                      {it.nomorRegister}
                    </span>
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
            ))}
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
