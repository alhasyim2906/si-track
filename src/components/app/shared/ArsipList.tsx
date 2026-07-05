"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Archive, Search, Download, FileText, Calendar, User, Landmark,
  Hash, MapPin, Loader2, ChevronLeft, ChevronRight, FileArchive,
  ShieldCheck, AlertCircle, Files,
} from "lucide-react";
import { SectionHeader } from "@/components/app/StatCard";
import { StatusBadge } from "@/components/app/StatusBadge";

/* ============================================================
   ArsipList — global archive of finished surat tanah
   Lists all ArsipSuratTanah records with search, pagination,
   and download. Click a row to open the parent permohonan
   detail (where the full arsip metadata editor lives).
   ============================================================ */

interface ArsipListItem {
  id: string;
  nomorSurat: string | null;
  tanggalTerbit: string | null;
  pejabatPenerbit: string | null;
  jabatanPejabat: string | null;
  nomorLembar: string | null;
  lokasiArsip: string | null;
  namaFile: string;
  filePath: string;
  ukuran: number | null;
  mimeType: string | null;
  uploadedAt: string;
  permohonan: {
    id: string;
    nomorRegister: string;
    pemohonNama: string;
    pemohonNik: string;
    statusSaatIni: string;
    tanggalSelesai: string | null;
    jenisSurat: { nama: string };
  };
}

function formatDate(d?: string | null): string {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

function formatBytes(n?: number | null): string {
  if (!n && n !== 0) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function ArsipList() {
  const { setView, selectPermohonan } = useAppStore();
  const [items, setItems] = useState<ArsipListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchArsip = useCallback(async (p: number, query: string) => {
    setLoading(true);
    try {
      const r = await api.listArsip({ page: String(p), limit: "15", q: query || undefined });
      setItems(r.items as ArsipListItem[]);
      setTotal(r.total);
      setPage(r.page);
      setTotalPages(r.totalPages);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat arsip");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArsip(1, "");
  }, [fetchArsip]);

  const onSearch = () => {
    setQ(searchInput.trim());
    fetchArsip(1, searchInput.trim());
  };

  const onClear = () => {
    setSearchInput("");
    setQ("");
    fetchArsip(1, "");
  };

  const openDetail = (permohonanId: string) => {
    selectPermohonan(permohonanId);
    setView("permohonan-detail");
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-5">
      {/* Header */}
      <SectionHeader
        icon={Archive}
        title="Arsip Surat Tanah"
        subtitle="Daftar dokumen final surat tanah yang sudah selesai dan diarsipkan"
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={FileArchive}
          label="Total Arsip"
          value={total}
          color="#16a34a"
        />
        <StatCard
          icon={ShieldCheck}
          label="Halaman Ini"
          value={`${page} / ${Math.max(totalPages, 1)}`}
          color="#d4af37"
        />
        <StatCard
          icon={FileText}
          label="Filter Aktif"
          value={q ? `"${q.slice(0, 12)}${q.length > 12 ? "…" : ""}"` : "Semua"}
          color="#0891b2"
        />
        <StatCard
          icon={Calendar}
          label="Arsip Terbaru"
          value={items[0] ? formatDate(items[0].uploadedAt) : "-"}
          color="#7c3aed"
        />
      </div>

      {/* Search bar */}
      <Card className="glass-card border-primary/15">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
                placeholder="Cari nomor register, nomor surat, nama pemohon, NIK, pejabat..."
                className="pl-9"
              />
            </div>
            <Button onClick={onSearch} className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold">
              <Search className="w-4 h-4 mr-1.5" /> Cari
            </Button>
            {q && (
              <Button variant="outline" onClick={onClear}>
                Reset
              </Button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Pencarian mencakup: nomor register, nomor surat, nama pemohon, NIK, pejabat penerbit, nomor lembar, dan lokasi arsip.
          </p>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="glass-card border-primary/15">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-muted/40 border border-border/60 flex items-center justify-center mx-auto mb-3">
                <Archive className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-sm">Belum Ada Arsip</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                {q
                  ? `Tidak ada arsip yang cocok dengan pencarian "${q}". Coba kata kunci lain atau reset filter.`
                  : "Arsip surat tanah akan muncul di sini setelah petugas mengunggah dokumen final pada permohonan yang telah selesai."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableHead className="text-[10px] uppercase tracking-wide">Nomor Register</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wide">Pemohon</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wide">Jenis Surat</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wide">No. Surat</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wide">Tgl Terbit</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wide">Pejabat</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wide">File</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wide text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((a) => (
                      <TableRow
                        key={a.id}
                        className="border-border/30 cursor-pointer hover:bg-primary/5"
                        onClick={() => openDetail(a.permohonan.id)}
                      >
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px] gold-border text-primary">
                            {a.permohonan.nomorRegister}
                          </Badge>
                          <div className="mt-1">
                            <StatusBadge kode={a.permohonan.statusSaatIni} size="sm" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{a.permohonan.pemohonNama}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{a.permohonan.pemohonNik}</p>
                        </TableCell>
                        <TableCell className="text-xs">{a.permohonan.jenisSurat.nama}</TableCell>
                        <TableCell className="text-xs font-mono">{a.nomorSurat || "-"}</TableCell>
                        <TableCell className="text-xs">{formatDate(a.tanggalTerbit)}</TableCell>
                        <TableCell>
                          <p className="text-xs font-medium">{a.pejabatPenerbit || "-"}</p>
                          {a.jabatanPejabat && (
                            <p className="text-[10px] text-muted-foreground">{a.jabatanPejabat}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium truncate max-w-[120px]">{a.namaFile}</p>
                              <p className="text-[10px] text-muted-foreground">{formatBytes(a.ukuran)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button asChild size="sm" variant="ghost" className="h-7 px-2">
                            <a href={a.filePath} download={a.namaFile} target="_blank" rel="noopener noreferrer">
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border/30">
                {items.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 cursor-pointer hover:bg-primary/5"
                    onClick={() => openDetail(a.permohonan.id)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="outline" className="font-mono text-[10px] gold-border text-primary">
                        {a.permohonan.nomorRegister}
                      </Badge>
                      <StatusBadge kode={a.permohonan.statusSaatIni} size="sm" />
                    </div>
                    <p className="text-sm font-semibold">{a.permohonan.pemohonNama}</p>
                    <p className="text-[11px] text-muted-foreground mb-2">{a.permohonan.jenisSurat.nama}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                      <div>
                        <span className="text-muted-foreground">No. Surat: </span>
                        <span className="font-mono">{a.nomorSurat || "-"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tgl Terbit: </span>
                        <span>{formatDate(a.tanggalTerbit)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Pejabat: </span>
                        <span>{a.pejabatPenerbit || "-"}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">File: </span>
                        <span className="truncate">{a.namaFile} ({formatBytes(a.ukuran)})</span>
                      </div>
                    </div>
                    <div className="flex justify-end mt-2" onClick={(e) => e.stopPropagation()}>
                      <Button asChild size="sm" variant="ghost" className="h-7 px-2">
                        <a href={a.filePath} download={a.namaFile} target="_blank" rel="noopener noreferrer">
                          <Download className="w-3.5 h-3.5 mr-1" /> Unduh
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-3 border-t border-border/40">
                <p className="text-[11px] text-muted-foreground">
                  Menampilkan {items.length} dari {total} arsip
                </p>
                <div className="flex gap-1">
                  <Button
                    size="sm" variant="outline" className="h-7"
                    disabled={page <= 1 || loading}
                    onClick={() => fetchArsip(page - 1, q)}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </Button>
                  <Button
                    size="sm" variant="outline" className="h-7"
                    disabled={page >= totalPages || loading}
                    onClick={() => fetchArsip(page + 1, q)}
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info banner */}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div className="text-[11px] leading-snug text-muted-foreground">
          <span className="font-semibold text-foreground">Tentang Arsip:</span> Setiap permohonan wajib
          mengunggah dokumen arsip surat tanah final sebelum dapat dipindahkan ke status{" "}
          <Badge variant="outline" className="text-[10px] mx-0.5 px-1 py-0">SELESAI</Badge>.
          Klik baris untuk membuka detail permohonan & mengelola metadata arsip (nomor surat, pejabat, lokasi fisik).
          Pemohon dapat mengunduh salinan digital melalui halaman tracking publik setelah status SELESAI.
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, color,
}: { icon: any; label: string; value: any; color: string }) {
  return (
    <Card className="glass-card border-primary/15">
      <CardContent className="p-3 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}1a`, border: `1px solid ${color}40` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">{label}</p>
          <p className="text-sm font-semibold truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
