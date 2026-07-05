"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { StatCard, SectionHeader } from "@/components/app/StatCard";
import { StatusBadge } from "@/components/app/StatusBadge";
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
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { toast } from "sonner";

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

  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.dashboard();
      setData(d as DashboardStats);
    } catch (e: any) {
      toast.error("Gagal memuat dashboard", { description: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Menunggu Persetujuan Saya"
          value={pending.length}
          icon={PenTool}
          accent="#eab308"
          hint="Perlu ditindaklanjuti"
          onClick={() => {
            if (pending[0]) selectPermohonan(pending[0].id);
            else setView("permohonan");
          }}
        />
        <StatCard
          label="Surat Selesai"
          value={stats.selesai}
          icon={CheckCircle2}
          accent="#16a34a"
          onClick={() => setView("permohonan")}
        />
        <StatCard
          label="Total Diproses"
          value={stats.diproses}
          icon={Loader}
          accent="#0891b2"
          onClick={() => setView("permohonan")}
        />
        <StatCard
          label="Rata-rata Penyelesaian"
          value={`${stats.avgDays} hari`}
          icon={Clock}
          accent="#d4af37"
          hint="Dari pengajuan sampai selesai"
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
                <CheckCircle2 className="w-7 h-7 text-green-400" />
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
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="nama"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                      stroke="var(--background)"
                      strokeWidth={2}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 sm:space-y-6">
          <Card className="glass-card border-primary/15 overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f]" />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4 text-primary" />
                Lama Penyelesaian
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-center py-2">
                <p className="text-5xl font-extrabold gold-gradient-text leading-none">
                  {stats.avgDays}
                </p>
                <p className="text-sm font-semibold text-muted-foreground mt-2">hari rata-rata</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1">
                  Dari pengajuan hingga surat selesai
                </p>
              </div>
            </CardContent>
          </Card>

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
                <span className="font-bold text-green-400">{stats.selesai}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-xs text-muted-foreground">Ditolak</span>
                <span className="font-bold text-red-400">{stats.ditolak}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-muted-foreground">Rata-rata</span>
                <span className="font-bold gold-text">{stats.avgDays} hari</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AtasanDashboard;
