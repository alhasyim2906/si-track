"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { SectionHeader } from "@/components/app/StatCard";
import { SmallBox } from "@/components/app/SmallBox";
import { AlteInfoBox } from "@/components/app/AlteInfoBox";
import { StatusBadge } from "@/components/app/StatusBadge";
import { RecentActivityWidget } from "@/components/app/shared/RecentActivityWidget";
import { STATUS_BY_KODE } from "@/lib/constants";
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
  PenTool,
  CheckCircle2,
  Loader,
  Clock,
  Loader2,
  ArrowRight,
  Inbox,
  ShieldCheck,
  CalendarClock,
  User,
  Calendar,
  CalendarRange,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

interface PendingItem {
  id: string;
  nomorRegister: string;
  pemohonNama: string;
  statusSaatIni: string;
  jenisSurat: string;
  butuhTtdCamat: boolean;
  creator: string;
  createdAt: string;
  catatan?: string | null;
}

export function AtasanDashboard() {
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

  const { stats, statusDist, pendingApprovals } = data;
  const pending = (pendingApprovals as PendingItem[]) || [];

  const pieData = statusDist
    .filter((s) => s.value > 0)
    .map((s) => ({
      ...s,
      nama: STATUS_BY_KODE[s.kode]?.nama || s.kode,
      color: STATUS_BY_KODE[s.kode]?.warna || "#d4af37",
    }));

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
      <SectionHeader
        title="Dashboard Lurah"
        subtitle="Pantau dan persetujuan permohonan surat tanah"
        icon={ShieldCheck}
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

      {/* Stat Small Box widgets (AdminLTE 4 style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SmallBox
          number={pending.length}
          label="Menunggu Persetujuan Saya"
          icon={PenTool}
          variant="warning"
          footerText="Perlu ditindaklanjuti"
          onClick={() => {
            if (pending[0]) selectPermohonan(pending[0].id);
            else setView("permohonan");
          }}
        />
        <SmallBox
          number={stats.selesai}
          label="Surat Selesai"
          icon={CheckCircle2}
          variant="success"
          footerText="Total selesai"
          onClick={() => setView("permohonan")}
        />
        <SmallBox
          number={stats.diproses}
          label="Total Diproses"
          icon={Loader}
          variant="info"
          footerText="Sedang berjalan"
          onClick={() => setView("permohonan")}
        />
        <SmallBox
          number={`${stats.avgDays}h`}
          label="Rata-rata Penyelesaian"
          icon={Clock}
          variant="gold"
          footerText="Dari pengajuan sampai selesai"
        />
      </div>

      {/* Pending approvals — most important */}
      <Card className="glass-card border-primary/15">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-primary" />
              Permohonan Menunggu Persetujuan
            </CardTitle>
            <CardDescription>
              {pending.length > 0
                ? `${pending.length} permohonan menanti tanda tangan Anda`
                : "Tidak ada permohonan yang menunggu persetujuan"}
            </CardDescription>
          </div>
          {pending.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 gold-text">
              {pending.length} menunggu
            </span>
          )}
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">Tidak ada permohonan yang menunggu persetujuan</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Semua surat telah ditandatangani. Pekerjaan yang baik!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[32rem] overflow-y-auto pr-1 -mr-1">
              {pending.map((p) => (
                <Card
                  key={p.id}
                  className="glass-card border-primary/15 hover:gold-border transition-all cursor-pointer group"
                  onClick={() => selectPermohonan(p.id)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[10px] font-semibold px-2 py-1 rounded bg-primary/10 border border-primary/25 gold-text">
                        {p.nomorRegister}
                      </span>
                      <StatusBadge kode={p.statusSaatIni} size="sm" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm truncate">{p.pemohonNama}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.jenisSurat}</p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {p.creator || "—"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" />
                        {formatDate(p.createdAt)}
                      </span>
                    </div>
                    {p.catatan && (
                      <div className="rounded-md bg-secondary/40 border border-border/60 p-2 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground/80">Catatan: </span>
                        {p.catatan}
                      </div>
                    )}
                    <div className="flex justify-end pt-1">
                      <span className="text-xs gold-text font-semibold inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                        Lihat Detail <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts + service stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="glass-card border-primary/15 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Distribusi Status
            </CardTitle>
            <CardDescription>Sebaran seluruh permohonan berdasarkan status</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                Belum ada data
              </div>
            ) : (
              <>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="nama"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        stroke="var(--background)"
                        strokeWidth={2}
                        label={({ value, percent }: { value: number; percent: number }) => value > 0 ? `${(percent * 100).toFixed(0)}%` : ""}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom legend grid */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-border/40">
                  {pieData.map((entry, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="truncate">{entry.nama}</span>
                      <span className="font-semibold text-foreground ml-auto pl-1">{entry.value}</span>
                    </span>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 sm:space-y-6">
          {/* Lama Penyelesaian — AdminLTE info-box style */}
          <AlteInfoBox
            icon={Clock}
            iconVariant="gold"
            title="Lama Penyelesaian"
            value={`${stats.avgDays} hari`}
            progress={stats.avgDays > 0 ? Math.min(100, Math.round((stats.avgDays / 30) * 100)) : 0}
            progressText="Dari pengajuan hingga surat selesai"
          />

          {/* Statistik Pelayanan — AdminLTE info-box style */}
          <AlteInfoBox
            icon={ShieldCheck}
            iconVariant="success"
            title="Tingkat Penyelesaian"
            value={stats.total > 0 ? `${Math.round((stats.selesai / stats.total) * 100)}%` : "0%"}
            progress={stats.total > 0 ? Math.round((stats.selesai / stats.total) * 100) : 0}
            progressText={`${stats.selesai} dari ${stats.total} permohonan selesai`}
          />

          <Card className="glass-card border-primary/15">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Statistik Pelayanan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 space-y-2">
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-xs text-muted-foreground">Total Permohonan</span>
                <span className="font-bold">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-xs text-muted-foreground">Selesai</span>
                <span className="font-bold text-green-600">{stats.selesai}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-xs text-muted-foreground">Ditolak</span>
                <span className="font-bold text-red-600">{stats.ditolak}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-muted-foreground">Rata-rata</span>
                <span className="font-bold gold-text">{stats.avgDays} hari</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent activity timeline widget (full width) */}
      <RecentActivityWidget limit={5} />
    </div>
  );
}

export default AtasanDashboard;
