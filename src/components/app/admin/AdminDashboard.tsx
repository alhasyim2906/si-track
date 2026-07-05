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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import {
  FileText,
  Loader,
  Ruler,
  PenTool,
  Stamp,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  Users,
  History,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";

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

type RangeKey = "today" | "7d" | "30d" | "year" | "all";

const RANGE_CHIPS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Hari Ini" },
  { key: "7d", label: "7 Hari" },
  { key: "30d", label: "30 Hari" },
  { key: "year", label: "Tahun Ini" },
  { key: "all", label: "Semua" },
];

export function AdminDashboard() {
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

  const { stats, monthly, statusDist, perPetugas, recent } = data;

  function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 11) return "Selamat pagi";
    if (h < 15) return "Selamat siang";
    if (h < 18) return "Selamat sore";
    return "Selamat malam";
  }

  const pieData = statusDist
    .filter((s) => s.value > 0)
    .map((s) => ({
      ...s,
      nama: STATUS_BY_KODE[s.kode]?.nama || s.kode,
      color: STATUS_BY_KODE[s.kode]?.warna || "#d4af37",
    }));

  // Last 6 months trend (total permohonan + selesai) — passed to SmallBox as sparkline.
  const last6Total = monthly.slice(-6).map((m) => m.total);
  const last6Selesai = monthly.slice(-6).map((m) => m.selesai);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
      <SectionHeader
        title="Dashboard Administrator"
        subtitle={`Selamat datang kembali, ${user?.name || "Admin"}. Berikut ringkasan operasional kelurahan.`}
        icon={FileText}
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

      {/* Welcome summary card */}
      <Card className="glass-card border-primary/15 overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f]" />
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f5d77a] via-[#d4af37] to-[#b8941f] flex items-center justify-center shrink-0 shadow-md">
                <span className="text-xl font-extrabold text-[#0a1628]">
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </span>
              </div>
              <div>
                <p className="font-semibold text-sm">
                  Selamat datang, <span className="gold-text">{user?.name || "Admin"}</span>!
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {getGreeting()} — Berikut ringkasan operasional kelurahan Anda hari ini.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="text-center px-3 py-1.5 rounded-lg bg-primary/8 border border-primary/15">
                <p className="text-lg font-bold gold-text">{stats.diproses}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Perlu Tindakan</p>
              </div>
              <div className="text-center px-3 py-1.5 rounded-lg bg-green-500/8 border border-green-500/15">
                <p className="text-lg font-bold text-green-600">{stats.selesai}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Selesai</p>
              </div>
              <div className="text-center px-3 py-1.5 rounded-lg bg-amber-500/8 border border-amber-500/15">
                <p className="text-lg font-bold text-amber-600">{stats.menungguLurah + stats.menungguCamat}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Menunggu TTD</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat widgets — AdminLTE 4 small-box style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SmallBox
          number={stats.total}
          label="Total Permohonan"
          icon={FileText}
          variant="primary"
          trend={last6Total}
          onClick={() => setView("permohonan")}
        />
        <SmallBox
          number={stats.diproses}
          label="Diproses"
          icon={Loader}
          variant="info"
          onClick={() => setView("permohonan")}
        />
        <SmallBox
          number={stats.menungguPengukuran}
          label="Menunggu Pengukuran"
          icon={Ruler}
          variant="warning"
          onClick={() => setView("permohonan")}
        />
        <SmallBox
          number={stats.menungguLurah}
          label="Menunggu Lurah"
          icon={PenTool}
          variant="gold"
          onClick={() => setView("permohonan")}
        />
        <SmallBox
          number={stats.menungguCamat}
          label="Menunggu Camat"
          icon={Stamp}
          variant="warning"
          onClick={() => setView("permohonan")}
        />
        <SmallBox
          number={stats.selesai}
          label="Selesai"
          icon={CheckCircle2}
          variant="success"
          trend={last6Selesai}
          onClick={() => setView("permohonan")}
        />
        <SmallBox
          number={stats.ditolak}
          label="Ditolak"
          icon={XCircle}
          variant="danger"
          onClick={() => setView("permohonan")}
        />
        <SmallBox
          number={`${stats.avgDays}h`}
          label="Rata-rata Penyelesaian"
          icon={Clock}
          variant="primary"
        />
      </div>

      {/* KPI Info-boxes row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <AlteInfoBox
          icon={CheckCircle2}
          iconVariant="success"
          title="Tingkat Penyelesaian"
          value={stats.total > 0 ? `${Math.round((stats.selesai / stats.total) * 100)}%` : "0%"}
          progress={stats.total > 0 ? Math.round((stats.selesai / stats.total) * 100) : 0}
          progressText={`${stats.selesai} dari ${stats.total} permohonan`}
        />
        <AlteInfoBox
          icon={Clock}
          iconVariant="gold"
          title="Rata-rata Waktu"
          value={`${stats.avgDays} hari`}
          progress={Math.min(100, Math.round((stats.avgDays / 30) * 100))}
          progressText="Target: 30 hari maksimal"
        />
        <AlteInfoBox
          icon={XCircle}
          iconVariant="danger"
          title="Tingkat Penolakan"
          value={stats.total > 0 ? `${Math.round((stats.ditolak / stats.total) * 100)}%` : "0%"}
          progress={stats.total > 0 ? Math.round((stats.ditolak / stats.total) * 100) : 0}
          progressText={`${stats.ditolak} permohonan ditolak`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="glass-card border-primary/15">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Tren Permohonan Bulanan
            </CardTitle>
            <CardDescription>
              Jumlah permohonan masuk dan selesai per bulan — tahun {year}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
                  <Bar dataKey="total" name="Total Permohonan" fill="#d4af37" radius={[4, 4, 0, 0]} maxBarSize={26} label={{ position: "top", fill: "#d4af37", fontSize: 10, fontWeight: 600 }} />
                  <Bar dataKey="selesai" name="Selesai" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={26} label={{ position: "top", fill: "#16a34a", fontSize: 10, fontWeight: 600 }} />
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
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/15">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Distribusi Status
            </CardTitle>
            <CardDescription>Sebaran permohonan berdasarkan status saat ini</CardDescription>
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
                        label={({ nama, value, percent }) => value > 0 ? `${(percent * 100).toFixed(0)}%` : ""}
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
      </div>

      {/* Per petugas + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="glass-card border-primary/15">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Kinerja Petugas
            </CardTitle>
            <CardDescription>Total penanganan dan tingkat penyelesaian per petugas</CardDescription>
          </CardHeader>
          <CardContent>
            {perPetugas.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Belum ada data petugas.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Nama Petugas</TableHead>
                    <TableHead className="text-xs text-center">Total</TableHead>
                    <TableHead className="text-xs text-center">Selesai</TableHead>
                    <TableHead className="text-xs">Penyelesaian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perPetugas.map((p) => {
                    const pct = p.total > 0 ? Math.round((p.selesai / p.total) * 100) : 0;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-center">{p.total}</TableCell>
                        <TableCell className="text-center text-green-600 font-semibold">{p.selesai}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <div className="flex-1 h-2 rounded-full bg-secondary/60 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  background: "linear-gradient(90deg, #f5d77a, #d4af37, #b8941f)",
                                }}
                              />
                            </div>
                            <span className="text-[10px] font-semibold gold-text w-9 text-right">{pct}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/15">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Permohonan Terbaru
              </CardTitle>
              <CardDescription>6 permohonan dengan aktivitas terakhir</CardDescription>
            </div>
            <button
              onClick={() => setView("permohonan")}
              className="text-xs gold-text font-semibold inline-flex items-center gap-1 hover:gap-1.5 transition-all"
            >
              Lihat semua <ArrowRight className="w-3 h-3" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1 -mr-1">
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
      </div>

      {/* Recent activity timeline widget (full width) */}
      <RecentActivityWidget limit={5} />
    </div>
  );
}

export default AdminDashboard;
