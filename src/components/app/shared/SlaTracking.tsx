"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { SectionHeader } from "@/components/app/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, RefreshCw, AlertTriangle, Timer, CheckCircle2, Clock, TrendingUp, Gauge, ArrowRight, Filter } from "lucide-react";
import { toast } from "sonner";
import type { SlaItem, SlaSummary } from "@/lib/types";

type FilterKey = "all" | "warning" | "breach";

const FILTER_CHIPS: { key: FilterKey; label: string; color: string }[] = [
  { key: "all", label: "Semua", color: "#d4af37" },
  { key: "warning", label: "Mendekati Terlambat", color: "#f59e0b" },
  { key: "breach", label: "Terlambat (Breach)", color: "#dc2626" },
];

function formatHours(h: number): string {
  if (h <= 0) return "0 jam";
  const days = Math.floor(h / 24);
  const rem = Math.round(h % 24);
  if (days > 0 && rem > 0) return `${days}h ${rem}j`;
  if (days > 0) return `${days} hari`;
  return `${rem} jam`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days} hari ${hours}j lalu`;
  if (hours > 0) return `${hours} jam lalu`;
  const mins = Math.floor(diff / (1000 * 60));
  return `${mins} menit lalu`;
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  on_track: {
    label: "On-Track",
    color: "#16a34a",
    bg: "rgba(22,163,74,0.10)",
    border: "rgba(22,163,74,0.40)",
    icon: CheckCircle2,
  },
  warning: {
    label: "Mendekati Terlambat",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(245,158,11,0.40)",
    icon: AlertTriangle,
  },
  breach: {
    label: "Terlambat",
    color: "#dc2626",
    bg: "rgba(220,38,38,0.10)",
    border: "rgba(220,38,38,0.40)",
    icon: AlertTriangle,
  },
};

export function SlaTracking() {
  const { selectPermohonan, setView } = useAppStore();
  const allowed = useAppStore((s) => s.can("view_laporan"));

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [summary, setSummary] = useState<SlaSummary | null>(null);
  const [items, setItems] = useState<SlaItem[]>([]);

  const fetchData = useCallback(async (f: FilterKey, silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const r = await api.sla(f);
      setSummary(r.summary);
      setItems(r.items);
    } catch (e: any) {
      toast.error("Gagal memuat data SLA", { description: e?.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) fetchData(filter);
  }, [allowed, filter, fetchData]);

  if (!allowed) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <Card className="glass-card border-primary/15">
          <CardContent className="p-8 text-center text-muted-foreground">
            Akses ditolak. Hanya Administrator atau Lurah (Atasan) yang dapat mengakses Pelacakan SLA.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
      <SectionHeader
        title="Pelacakan SLA"
        subtitle="Pantau permohonan yang mendekati atau melebihi batas waktu pelayanan"
        icon={Timer}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(filter, true)}
            disabled={refreshing}
            className="glass-card border-primary/15"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Muat Ulang
          </Button>
        }
      />

      {/* Summary cards */}
      {loading || !summary ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Top KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard
              icon={TrendingUp}
              label="Total Permohonan Aktif"
              value={summary.total}
              hint="Sedang dalam proses"
              color="#d4af37"
            />
            <SummaryCard
              icon={CheckCircle2}
              label="On-Track"
              value={summary.onTrack}
              hint="Masih dalam SLA"
              color="#16a34a"
            />
            <SummaryCard
              icon={AlertTriangle}
              label="Mendekati Terlambat"
              value={summary.warning}
              hint="≥ 80% SLA terpakai"
              color="#f59e0b"
            />
            <SummaryCard
              icon={AlertTriangle}
              label="Terlambat (Breach)"
              value={summary.breach}
              hint="Melebihi target SLA"
              color="#dc2626"
              pulse={summary.breach > 0}
            />
          </div>

          {/* Breach alert banner */}
          {summary.breach > 0 && (
            <Card className="border-red-500/40 bg-red-500/[0.06]">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-red-700 dark:text-red-400">
                      {summary.breach} permohonan melebihi SLA!
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Mohon segera tindak lanjuti permohonan di bawah ini. Tingkat pelanggaran SLA saat ini:{" "}
                      <span className="font-semibold text-red-600">{summary.breachRate}%</span>.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setFilter("breach")}
                    className="bg-red-600 hover:bg-red-700 text-white shrink-0"
                  >
                    Lihat yang Terlambat <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Secondary stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="glass-card border-primary/15">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Rata-rata Usia</p>
                  <p className="text-xl font-bold gold-text">{summary.avgDays} hari</p>
                  <p className="text-[10px] text-muted-foreground">dari pengajuan hingga kini</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/15">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <Gauge className="w-5 h-5 text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Tingkat Pelanggaran SLA</p>
                  <p className="text-xl font-bold text-red-600">{summary.breachRate}%</p>
                  <p className="text-[10px] text-muted-foreground">{summary.breach} dari {summary.total} aktif</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/15">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Perlu Perhatian</p>
                  <p className="text-xl font-bold text-amber-600">{summary.warning + summary.breach}</p>
                  <p className="text-[10px] text-muted-foreground">warning + breach</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter chips */}
          <Card className="glass-card border-primary/15">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide mr-1">
                  <Filter className="w-3.5 h-3.5" /> Filter:
                </span>
                {FILTER_CHIPS.map((chip) => {
                  const active = filter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setFilter(chip.key)}
                      aria-pressed={active}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                      style={
                        active
                          ? { backgroundColor: `${chip.color}1a`, color: chip.color, borderColor: `${chip.color}80` }
                          : { backgroundColor: "transparent", color: "var(--muted-foreground)", borderColor: "var(--border)" }
                      }
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: chip.color }} />
                      {chip.label}
                      {chip.key === "warning" && summary.warning > 0 && (
                        <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${chip.color}22`, color: chip.color }}>
                          {summary.warning}
                        </span>
                      )}
                      {chip.key === "breach" && summary.breach > 0 && (
                        <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${chip.color}22`, color: chip.color }}>
                          {summary.breach}
                        </span>
                      )}
                    </button>
                  );
                })}
                <span className="ml-auto text-[11px] text-muted-foreground hidden sm:inline-flex items-center gap-1">
                  Menampilkan: <span className="font-semibold text-foreground">{items.length}</span> dari{" "}
                  <span className="font-semibold text-foreground">{summary.total}</span> permohonan aktif
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Items list */}
          {items.length === 0 ? (
            <Card className="glass-card border-primary/15">
              <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-semibold text-lg">
                  {filter === "breach"
                    ? "Tidak ada permohonan terlambat"
                    : filter === "warning"
                    ? "Tidak ada permohonan mendekati terlambat"
                    : "Tidak ada permohonan aktif"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {filter === "breach"
                    ? "Semua permohonan dalam proses masih dalam batas SLA."
                    : filter === "warning"
                    ? "Tidak ada permohonan yang mendekati batas SLA."
                    : "Belum ada permohonan yang sedang diproses."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <SlaRow key={item.id} item={item} onOpen={() => selectPermohonan(item.id)} />
              ))}
            </div>
          )}

          {/* Info box */}
          <Card className="glass-card border-primary/15">
            <CardContent className="p-4">
              <div className="flex items-start gap-2.5">
                <Timer className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="text-[11px] leading-snug text-muted-foreground">
                  <span className="font-semibold text-foreground">Tentang SLA:</span> Service Level Agreement (SLA)
                  adalah target waktu maksimum yang ditetapkan per tahapan proses. Pengaturan target SLA dapat
                  dikonfigurasi di <button className="text-primary underline" onClick={() => setView("pengaturan")}>Pengaturan &gt; SLA</button>.
                  <br />
                  <span className="mt-1 inline-block">
                    Status SLA:
                    <span className="text-green-500 font-semibold mx-1">On-Track</span> (≤ 80% terpakai) ·
                    <span className="text-amber-500 font-semibold mx-1">Warning</span> (80–100%) ·
                    <span className="text-red-500 font-semibold mx-1">Breach</span> (&gt; 100%).
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  color,
  pulse = false,
}: {
  icon: any;
  label: string;
  value: number;
  hint: string;
  color: string;
  pulse?: boolean;
}) {
  return (
    <Card className="glass-card border-primary/15 overflow-hidden relative">
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: `linear-gradient(to right, ${color}, ${color}55)` }}
      />
      <CardContent className="p-4 flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${pulse ? "animate-pulse" : ""}`}
          style={{ backgroundColor: `${color}1a`, border: `1px solid ${color}55` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold leading-tight" style={{ color }}>{value}</p>
          <p className="text-[10px] text-muted-foreground leading-snug">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SlaRow({ item, onOpen }: { item: SlaItem; onOpen: () => void }) {
  const style = STATUS_STYLE[item.slaStatus];
  const StatusIcon = style.icon;
  const progress = Math.min(100, item.progressPct);

  return (
    <Card
      className={`glass-card hover:gold-border transition-all cursor-pointer group`}
      onClick={onOpen}
      style={{ borderLeft: `4px solid ${style.color}` }}
    >
      <CardContent className="p-4 space-y-3">
        {/* Top row: register + status badge + priority */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-semibold px-2 py-1 rounded bg-primary/10 border border-primary/25 gold-text">
            {item.nomorRegister}
          </span>
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-full border inline-flex items-center gap-1"
            style={{ color: style.color, backgroundColor: style.bg, borderColor: style.border }}
          >
            <StatusIcon className="w-3 h-3" />
            {style.label}
          </span>
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-full border"
            style={{
              color: item.statusWarna,
              backgroundColor: `${item.statusWarna}1a`,
              borderColor: `${item.statusWarna}55`,
            }}
          >
            {item.statusNama}
          </span>
          {item.prioritas !== "NORMAL" && (
            <Badge
              variant="outline"
              className={`text-[9px] ${
                item.prioritas === "MENDESAK"
                  ? "border-red-500/40 text-red-500"
                  : "border-amber-500/40 text-amber-500"
              }`}
            >
              {item.prioritas}
            </Badge>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> Dibuat {relativeTime(item.createdAt)}
          </span>
        </div>

        {/* Pemohon + jenis surat */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pemohon</p>
            <p className="font-semibold truncate">{item.pemohonNama}</p>
            <p className="text-[10px] text-muted-foreground font-mono">{item.pemohonNik}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Jenis Surat</p>
            <p className="font-medium truncate">{item.jenisSurat}</p>
            <p className="text-[10px] text-muted-foreground">Petugas: {item.petugas || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Masuk Tahap Ini</p>
            <p className="font-medium">{formatDate(item.statusEnteredAt)}</p>
            <p className="text-[10px] text-muted-foreground">{relativeTime(item.statusEnteredAt)}</p>
          </div>
        </div>

        {/* SLA progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Timer className="w-3 h-3" />
              Progres SLA Tahapan
            </span>
            <span className="font-semibold" style={{ color: style.color }}>
              {item.progressPct}% terpakai
            </span>
          </div>
          <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden relative">
            <div
              className="h-full transition-all"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(to right, ${style.color}, ${style.color}aa)`,
                boxShadow: `0 0 8px ${style.color}66`,
              }}
            />
            {/* Warning threshold marker */}
            <div
              className="absolute top-0 bottom-0 w-px bg-foreground/40"
              style={{ left: "80%", opacity: 0.4 }}
              title="Ambang peringatan 80%"
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>
              Berlalu: <span className="font-mono font-semibold text-foreground">{formatHours(item.elapsedHours)}</span>
              {" / "}
              Target: <span className="font-mono">{formatHours(item.slaHours)}</span>
            </span>
            <span>
              {item.remainingHours >= 0 ? (
                <>Sisa: <span className="font-mono font-semibold text-green-500">{formatHours(item.remainingHours)}</span></>
              ) : (
                <>Terlambat: <span className="font-mono font-semibold text-red-500">{formatHours(Math.abs(item.remainingHours))}</span></>
              )}
            </span>
          </div>
        </div>

        {/* Last catatan */}
        {item.lastCatatan && (
          <div className="text-[11px] text-muted-foreground bg-muted/20 border border-border/40 rounded-md p-2 line-clamp-2">
            <span className="font-semibold text-foreground/80">Catatan terakhir:</span> {item.lastCatatan}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <span className="text-xs gold-text font-semibold inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
            Lihat Detail <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default SlaTracking;
