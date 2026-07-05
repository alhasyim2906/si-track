"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { SectionHeader } from "@/components/app/StatCard";
import { SmallBox } from "@/components/app/SmallBox";
import { AlteInfoBox } from "@/components/app/AlteInfoBox";
import { StatusBadge } from "@/components/app/StatusBadge";
import { RecentActivityWidget } from "@/components/app/shared/RecentActivityWidget";
import type { DashboardStats } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  FilePlus2,
  ClipboardCheck,
  Ruler,
  FileText,
  PenTool,
  Loader2,
  ArrowRight,
  History,
  ListChecks,
  Sparkles,
  Calendar,
  CalendarRange,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { toast } from "sonner";

type RangeKey = "today" | "7d" | "30d" | "year" | "all";

const RANGE_CHIPS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Hari Ini" },
  { key: "7d", label: "7 Hari" },
  { key: "30d", label: "30 Hari" },
  { key: "year", label: "Tahun Ini" },
  { key: "all", label: "Semua" },
];

function relativeTime(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "baru saja";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} hari lalu`;
  const mon = Math.floor(day / 30);
  if (mon < 12) return `${mon} bulan lalu`;
  return `${Math.floor(mon / 12)} tahun lalu`;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="glass-card border border-primary/20 rounded-lg px-3 py-2 shadow-xl">
      {label && <p className="text-xs font-semibold mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-xs flex items-center gap-2" style={{ color: entry.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export function PetugasDashboard() {
  const user = useAppStore((s) => s.user);
  const setView = useAppStore((s) => s.setView);
  const selectPermohonan = useAppStore((s) => s.selectPermohonan);

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [range, setRange] = useState<RangeKey>("year");
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (y: number, r: RangeKey) => {
    setLoading(true);
    try {
      const d = await api.dashboard(y, r);
      setData(d as DashboardStats);
    } catch (e: any) {
      toast.error("Gagal memuat dashboard", { description: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(year, range);
  }, [year, range, fetchData]);

  const yearOptions = useMemo(() => {
    const arr: number[] = [];
    for (let y = currentYear; y >= currentYear - 4; y--) arr.push(y);
    return arr;
  }, [currentYear]);

  if (loading || !data) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const { stats, counts, monthly, recent } = data;
  const last6 = monthly.slice(-6);
  const waitingApproval = (counts.TTD_LURAH || 0) + (counts.TTD_CAMAT || 0);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
      <SectionHeader
        title="Dashboard Petugas"
        subtitle={`Halo ${user?.name || "Petugas"}, kelola permohonan surat tanah dengan efisien.`}
        icon={ListChecks}
        action={
          range !== "all" ? (
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-[140px] glass-card border-primary/15">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    Tahun {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : undefined
        }
      />

      {/* Date-range quick filter chips */}
      <Card className="glass-card border-primary/15">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mr-1">
              <CalendarRange className="w-3.5 h-3.5" />
              Rentang:
            </span>
            {RANGE_CHIPS.map((chip) => {
              const active = range === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setRange(chip.key)}
                  aria-pressed={active}
                  className={
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all " +
                    (active
                      ? "bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] border-transparent shadow-sm"
                      : "bg-background/60 text-foreground/80 border-border hover:border-primary/40 hover:text-foreground")
                  }
                >
                  <Calendar className="w-3 h-3" />
                  {chip.label}
                </button>
              );
            })}
            <span className="ml-auto text-[11px] text-muted-foreground hidden sm:inline-flex items-center gap-1">
              Menampilkan:
              <span className="font-semibold text-foreground">
                {data.rangeLabel || "Tahun Ini"}
              </span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions — AdminLTE info-box style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AlteInfoBox
          icon={FilePlus2}
          iconVariant="gold"
          title="Permohonan Baru"
          value={counts.PENGAJUAN || 0}
          progress={stats.total > 0 ? Math.round(((counts.PENGAJUAN || 0) / stats.total) * 100) : 0}
          progressText="Perlu didaftarkan"
        />
        <AlteInfoBox
          icon={ClipboardCheck}
          iconVariant="info"
          title="Cek Administrasi"
          value={counts.CEK_ADMIN || 0}
          progress={stats.total > 0 ? Math.round(((counts.CEK_ADMIN || 0) / stats.total) * 100) : 0}
          progressText="Verifikasi dokumen"
        />
        <AlteInfoBox
          icon={PenTool}
          iconVariant="warning"
          title="Menunggu Persetujuan"
          value={waitingApproval}
          progress={stats.total > 0 ? Math.round((waitingApproval / stats.total) * 100) : 0}
          progressText="TTD Lurah/Camat"
        />
      </div>

      {/* Quick action buttons */}
      <Card className="glass-card border-primary/15 overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f]" />
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Tugas Saya</p>
                <p className="text-sm text-muted-foreground">Mulai dari sini untuk menyelesaikan tugas harian Anda</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setView("permohonan-baru")}
                className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-2"
              >
                <FilePlus2 className="w-4 h-4" />
                Daftar Permohonan Baru
              </button>
              <button
                onClick={() => setView("permohonan")}
                className="glass-card border border-primary/25 text-sm px-4 py-2 rounded-lg hover:gold-border transition-all inline-flex items-center gap-2"
              >
                <ListChecks className="w-4 h-4 text-primary" />
                Lihat Semua Permohonan
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Small Box widgets (AdminLTE 4 style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <SmallBox
          number={counts.PENGAJUAN || 0}
          label="Permohonan Baru"
          icon={FilePlus2}
          variant="primary"
          footerText="Perlu didaftarkan"
          onClick={() => setView("permohonan")}
        />
        <SmallBox
          number={counts.CEK_ADMIN || 0}
          label="Cek Administrasi"
          icon={ClipboardCheck}
          variant="info"
          footerText="Verifikasi dokumen"
          onClick={() => setView("permohonan")}
        />
        <SmallBox
          number={counts.PENGUKURAN || 0}
          label="Pengukuran"
          icon={Ruler}
          variant="warning"
          footerText="Ukur bidang tanah"
          onClick={() => setView("permohonan")}
        />
        <SmallBox
          number={counts.PEMBUATAN_SURAT || 0}
          label="Draft Surat"
          icon={FileText}
          variant="gold"
          footerText="Penyusunan surat"
          onClick={() => setView("permohonan")}
        />
        <SmallBox
          number={waitingApproval}
          label="Menunggu Persetujuan"
          icon={PenTool}
          variant="warning"
          footerText="TTD Lurah/Camat"
          onClick={() => setView("permohonan")}
        />
      </div>

      {/* Recent + chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="glass-card border-primary/15">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Permohonan Terbaru
              </CardTitle>
              <CardDescription>Aktivitas terbaru yang perlu perhatian Anda</CardDescription>
            </div>
            <button
              onClick={() => setView("permohonan")}
              className="text-xs gold-text font-semibold inline-flex items-center gap-1 hover:gap-1.5 transition-all"
            >
              Lihat semua <ArrowRight className="w-3 h-3" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-[26rem] overflow-y-auto pr-1 -mr-1">
              {recent.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Belum ada permohonan.
                </div>
              ) : (
                recent.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => selectPermohonan(r.id)}
                    className="w-full text-left rounded-lg p-2.5 hover:bg-secondary/40 transition-colors border border-transparent hover:border-primary/20 flex items-center gap-3"
                  >
                    <span className="font-mono text-[10px] font-semibold px-2 py-1 rounded bg-primary/10 border border-primary/25 gold-text shrink-0">
                      {r.nomorRegister}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{r.pemohonNama}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{r.jenisSurat}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge kode={r.statusSaatIni} size="sm" />
                      <span className="text-[10px] text-muted-foreground">{relativeTime(r.updatedAt)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/15">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Aktivitas Terakhir
            </CardTitle>
            <CardDescription>Permohonan masuk & selesai — 6 bulan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last6} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" vertical={false} opacity={0.3} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.2 }} />
                  <Bar dataKey="total" name="Total Permohonan" fill="#d4af37" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="selesai" name="Selesai" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Custom legend */}
            <div className="flex items-center justify-center gap-5 mt-3 pt-3 border-t border-border/40">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#d4af37" }} /> Total Permohonan
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#16a34a" }} /> Selesai
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 pt-3 border-t border-border">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Diproses</p>
                <p className="text-lg font-bold text-cyan-600">{stats.diproses}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Selesai</p>
                <p className="text-lg font-bold text-green-600">{stats.selesai}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Rata-rata</p>
                <p className="text-lg font-bold gold-text">{stats.avgDays} hari</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity timeline widget (full width) */}
      <RecentActivityWidget limit={5} />
    </div>
  );
}

export default PetugasDashboard;
