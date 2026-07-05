"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { STATUS_DEFINITIONS, STATUS_BY_KODE, type StatusDef } from "@/lib/constants";
import { StatCard, SectionHeader } from "@/components/app/StatCard";
import { StatusBadge, PriorityBadge } from "@/components/app/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  FileText,
  CheckCircle2,
  Loader,
  XCircle,
  Clock,
  BarChart3,
  CalendarDays,
  Filter,
  RotateCcw,
  Download,
  Printer,
  Eye,
  Inbox,
  Loader2,
} from "lucide-react";

interface LaporanItem {
  id: string;
  nomorRegister: string;
  pemohonNama: string;
  pemohonNik: string;
  jenisSurat: string;
  keperluan: string | null;
  statusSaatIni: string;
  prioritas: string;
  petugas: string | null;
  createdAt: string;
  tanggalSelesai: string | null;
  alasanDitolak: string | null;
  lokasiTanah: string | null;
  luasTanah: string | null;
}

interface LaporanSummary {
  total: number;
  selesai: number;
  diproses: number;
  ditolak: number;
  avgDays: number;
}

interface LaporanResponse {
  summary: LaporanSummary;
  items: LaporanItem[];
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function Reports() {
  const { user, selectPermohonan, can } = useAppStore();
  const canView = can("view_laporan");

  // Default: current month range
  const [from, setFrom] = useState<string>(() => {
    const now = new Date();
    return toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [to, setTo] = useState<string>(() => toISODate(new Date()));
  const [status, setStatus] = useState<string>("all");
  const [petugas, setPetugas] = useState<string>("");

  // applied filter (only changes on submit)
  const [applied, setApplied] = useState<{ from: string; to: string; status: string; petugas: string }>({
    from: from,
    to: to,
    status: "all",
    petugas: "",
  });

  const [data, setData] = useState<LaporanResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | undefined> = {
        from: applied.from || undefined,
        to: applied.to || undefined,
        status: applied.status !== "all" ? applied.status : undefined,
        petugas: applied.petugas || undefined,
      };
      const res = (await api.laporan(params)) as LaporanResponse;
      setData(res);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat laporan");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    if (canView) load();
  }, [canView, load]);

  const handleApply = () => {
    setApplied({ from, to, status, petugas });
  };

  const handleReset = () => {
    const now = new Date();
    const f = toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
    const t = toISODate(now);
    setFrom(f);
    setTo(t);
    setStatus("all");
    setPetugas("");
    setApplied({ from: f, to: t, status: "all", petugas: "" });
  };

  const setPeriode = (key: "hari" | "bulan" | "tahun") => {
    const now = new Date();
    let f: string;
    if (key === "hari") f = toISODate(now);
    else if (key === "bulan") f = toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
    else f = toISODate(new Date(now.getFullYear(), 0, 1));
    const t = toISODate(now);
    setFrom(f);
    setTo(t);
    setApplied({ from: f, to: t, status, petugas });
  };

  const items = data?.items || [];
  const summary = data?.summary || { total: 0, selesai: 0, diproses: 0, ditolak: 0, avgDays: 0 };

  // ===== CSV Export =====
  const exportCSV = () => {
    if (!items.length) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const header = [
      "Nomor Register",
      "Nama Pemohon",
      "NIK",
      "Jenis Surat",
      "Keperluan",
      "Status",
      "Prioritas",
      "Petugas",
      "Dibuat",
      "Selesai",
      "Alasan Ditolak",
      "Lokasi Tanah",
      "Luas Tanah",
    ];
    const esc = (v: string | null | undefined) => {
      const s = v == null ? "" : String(v);
      if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const rows = items.map((it) =>
      [
        it.nomorRegister,
        it.pemohonNama,
        it.pemohonNik,
        it.jenisSurat,
        it.keperluan,
        STATUS_BY_KODE[it.statusSaatIni]?.nama || it.statusSaatIni,
        it.prioritas,
        it.petugas || "",
        fmtDate(it.createdAt),
        fmtDate(it.tanggalSelesai),
        it.alasanDitolak || "",
        it.lokasiTanah || "",
        it.luasTanah || "",
      ]
        .map(esc)
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-permohonan-${toISODate(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV berhasil diunduh");
  };

  // ===== PDF Print =====
  const exportPDF = () => {
    if (!items.length) {
      toast.error("Tidak ada data untuk dicetak");
      return;
    }
    const periodeLabel = `${fmtDate(applied.from)} — ${fmtDate(applied.to)}`;
    const rowsHtml = items
      .map(
        (it, i) => `
        <tr>
          <td>${i + 1}</td>
          <td style="font-family:monospace">${it.nomorRegister}</td>
          <td>${it.pemohonNama}<br/><span style="font-size:10px;color:#666">${it.pemohonNik}</span></td>
          <td>${it.jenisSurat}</td>
          <td>${STATUS_BY_KODE[it.statusSaatIni]?.nama || it.statusSaatIni}</td>
          <td>${it.prioritas}</td>
          <td>${it.petugas || "-"}</td>
          <td>${fmtDate(it.createdAt)}</td>
          <td>${fmtDate(it.tanggalSelesai)}</td>
        </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Laporan Permohonan - SI-TRACK TANAH</title>
<style>
  @page { size: A4 landscape; margin: 1.2cm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0a1628; }
  .head { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #d4af37; padding-bottom:10px; margin-bottom:14px; }
  .head h1 { margin:0; font-size:20px; color:#0a1628; }
  .head p { margin:2px 0; font-size:11px; color:#555; }
  .brand { font-weight:bold; color:#b8941f; letter-spacing:1px; font-size:12px; }
  .summary { display:flex; gap:14px; margin-bottom:14px; }
  .sum-box { flex:1; border:1px solid #e0d9b8; border-radius:6px; padding:8px 10px; background:#faf8ee; }
  .sum-box .l { font-size:10px; color:#777; text-transform:uppercase; }
  .sum-box .v { font-size:18px; font-weight:bold; color:#0a1628; }
  table { width:100%; border-collapse:collapse; font-size:10px; }
  th { background:#0a1628; color:#d4af37; padding:6px 5px; text-align:left; border:1px solid #0a1628; }
  td { padding:5px; border:1px solid #d9d9d9; vertical-align:top; }
  tr:nth-child(even) td { background:#f7f7f7; }
  .foot { margin-top:14px; font-size:10px; color:#777; border-top:1px solid #ccc; padding-top:6px; display:flex; justify-content:space-between; }
</style></head>
<body>
  <div class="head">
    <div>
      <div class="brand">SI-TRACK TANAH</div>
      <h1>Laporan Permohonan Surat Tanah</h1>
      <p>Kelurahan Kuala Pembuang II</p>
    </div>
    <div style="text-align:right">
      <p><strong>Periode:</strong> ${periodeLabel}</p>
      <p><strong>Status:</strong> ${applied.status === "all" ? "Semua" : STATUS_BY_KODE[applied.status]?.nama || applied.status}</p>
      <p><strong>Dicetak:</strong> ${fmtDateTime(new Date().toISOString())}</p>
    </div>
  </div>
  <div class="summary">
    <div class="sum-box"><div class="l">Total</div><div class="v">${summary.total}</div></div>
    <div class="sum-box"><div class="l">Selesai</div><div class="v">${summary.selesai}</div></div>
    <div class="sum-box"><div class="l">Diproses</div><div class="v">${summary.diproses}</div></div>
    <div class="sum-box"><div class="l">Ditolak</div><div class="v">${summary.ditolak}</div></div>
    <div class="sum-box"><div class="l">Rata-rata (hari)</div><div class="v">${summary.avgDays}</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>No. Register</th><th>Pemohon</th><th>Jenis Surat</th>
        <th>Status</th><th>Prioritas</th><th>Petugas</th><th>Dibuat</th><th>Selesai</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="foot">
    <span>SI-TRACK TANAH — Sistem Informasi Tracking Pendaftaran Surat Tanah</span>
    <span>Halaman 1</span>
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); }</script>
</body></html>`;

    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) {
      toast.error("Pop-up diblokir. Izinkan pop-up untuk mencetak PDF.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  if (!canView) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <Card className="glass-card border-primary/15">
          <CardContent className="p-8 text-center text-muted-foreground">
            Anda tidak memiliki akses ke laporan.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-5">
      <SectionHeader
        title="Laporan Permohonan"
        subtitle="Rekap dan analisis pelayanan surat tanah"
        icon={BarChart3}
      />

      {/* Filter card */}
      <Card className="glass-card border-primary/15">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="w-4 h-4 text-primary" /> Filter Laporan
          </div>

          {/* Quick periode */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Periode cepat:</span>
            <Button size="sm" variant="outline" onClick={() => setPeriode("hari")} className="h-7 text-xs">
              <CalendarDays className="w-3.5 h-3.5 mr-1" /> Hari Ini
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPeriode("bulan")} className="h-7 text-xs">
              Bulan Ini
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPeriode("tahun")} className="h-7 text-xs">
              Tahun Ini
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Dari Tanggal</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-input/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sampai Tanggal</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-input/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full bg-input/50">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {STATUS_DEFINITIONS.map((s: StatusDef) => (
                    <SelectItem key={s.kode} value={s.kode}>
                      {s.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Petugas (opsional)</Label>
              <Input
                value={petugas}
                onChange={(e) => setPetugas(e.target.value)}
                placeholder="Nama petugas"
                className="bg-input/50"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              onClick={handleApply}
              className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
            >
              <Filter className="w-4 h-4 mr-1.5" /> Terapkan Filter
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" /> Reset
            </Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={exportCSV} disabled={!items.length}>
              <Download className="w-4 h-4 mr-1.5" /> Export CSV
            </Button>
            <Button variant="outline" onClick={exportPDF} disabled={!items.length}>
              <Printer className="w-4 h-4 mr-1.5" /> Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total Permohonan" value={summary.total} icon={FileText} accent="#3b82f6" compact />
        <StatCard label="Selesai" value={summary.selesai} icon={CheckCircle2} accent="#16a34a" compact />
        <StatCard label="Diproses" value={summary.diproses} icon={Loader} accent="#0891b2" compact />
        <StatCard label="Ditolak" value={summary.ditolak} icon={XCircle} accent="#dc2626" compact />
        <StatCard
          label="Rata-rata Waktu"
          value={`${summary.avgDays} hari`}
          icon={Clock}
          accent="#d4af37"
          compact
        />
      </div>

      {/* Results table */}
      <Card className="glass-card border-primary/15">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Daftar Permohonan</h3>
              <Badge variant="outline" className="text-[10px]">
                {items.length} record
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground hidden sm:block">
              Periode: {fmtDate(applied.from)} — {fmtDate(applied.to)}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Memuat data…</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="w-10 h-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Tidak ada data pada periode/filter ini.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Coba ubah rentang tanggal atau status.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-xs">No. Register</TableHead>
                    <TableHead className="text-xs">Pemohon</TableHead>
                    <TableHead className="text-xs">Jenis Surat</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Prioritas</TableHead>
                    <TableHead className="text-xs">Petugas</TableHead>
                    <TableHead className="text-xs">Dibuat</TableHead>
                    <TableHead className="text-xs">Selesai</TableHead>
                    <TableHead className="text-xs text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.id} className="border-border/30">
                      <TableCell>
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary">
                          {it.nomorRegister}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{it.pemohonNama}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{it.pemohonNik}</div>
                      </TableCell>
                      <TableCell className="text-xs max-w-[160px] truncate" title={it.jenisSurat}>
                        {it.jenisSurat}
                      </TableCell>
                      <TableCell>
                        <StatusBadge kode={it.statusSaatIni} size="sm" />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge prioritas={it.prioritas} />
                        {!it.prioritas || it.prioritas === "NORMAL" ? (
                          <span className="text-[10px] text-muted-foreground">Normal</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs">{it.petugas || "—"}</TableCell>
                      <TableCell className="text-xs">{fmtDate(it.createdAt)}</TableCell>
                      <TableCell className="text-xs">
                        {it.tanggalSelesai ? fmtDate(it.tanggalSelesai) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => selectPermohonan(it.id)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
