"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CheckCheck,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { SectionHeader } from "@/components/app/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ---------- types ---------- */
type TipeNotifikasi = "INFO" | "SUCCESS" | "WARNING" | "DANGER";

interface NotifItem {
  id: string;
  permohonanId?: string | null;
  userId?: string | null;
  judul: string;
  pesan: string;
  tipe: TipeNotifikasi;
  dibaca: boolean;
  createdAt: string;
}

/* ---------- constants ---------- */
const TIPE_COLORS: Record<TipeNotifikasi, string> = {
  INFO: "#3b82f6",
  SUCCESS: "#16a34a",
  WARNING: "#f59e0b",
  DANGER: "#dc2626",
};

const TIPE_ICONS: Record<TipeNotifikasi, any> = {
  INFO: Info,
  SUCCESS: CheckCircle2,
  WARNING: AlertTriangle,
  DANGER: XCircle,
};

const TIPE_LABELS: Record<TipeNotifikasi, string> = {
  INFO: "Info",
  SUCCESS: "Sukses",
  WARNING: "Peringatan",
  DANGER: "Bahaya",
};

/* ---------- helpers ---------- */
function relativeTimeId(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return "baru saja";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} jam lalu`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} hari lalu`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk} minggu lalu`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo} bulan lalu`;
  return `${Math.floor(day / 365)} tahun lalu`;
}

function getDayGroup(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = startOfToday.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Hari Ini";
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return "7 Hari Terakhir";
  return "Lebih Lama";
}

/* ---------- skeleton ---------- */
function SkeletonCard() {
  return (
    <div className="glass-card border-primary/15 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-muted/40 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/5 rounded bg-muted/40" />
          <div className="h-3 w-4/5 rounded bg-muted/30" />
          <div className="h-3 w-1/4 rounded bg-muted/20" />
        </div>
      </div>
    </div>
  );
}

/* ---------- single notification card ---------- */
function NotifCard({
  item,
  onRead,
  onDelete,
}: {
  item: NotifItem;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { selectPermohonan } = useAppStore();
  const TipeIcon = TIPE_ICONS[item.tipe] || Info;
  const color = TIPE_COLORS[item.tipe] || TIPE_COLORS.INFO;

  const handleClick = () => {
    if (!item.dibaca) onRead(item.id);
    if (item.permohonanId) {
      selectPermohonan(item.permohonanId);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(item.id);
  };

  return (
    <div
      className={cn(
        "glass-card border-primary/15 p-4 cursor-pointer transition-all hover:bg-accent/30 group",
        !item.dibaca && "border-l-[3px]",
        item.dibaca && "opacity-60"
      )}
      style={{
        borderLeftColor: !item.dibaca ? color : undefined,
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="flex items-start gap-3">
        {/* type icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}18` }}
        >
          <TipeIcon className="w-4.5 h-4.5" style={{ color }} />
        </div>

        {/* content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold leading-tight">{item.judul}</p>
            <Badge
              variant="outline"
              className="text-[10px] h-5 px-1.5 font-medium"
              style={{ color, borderColor: `${color}40` }}
            >
              {TIPE_LABELS[item.tipe] || item.tipe}
            </Badge>
          </div>
          <p className="text-sm text-foreground/70 mt-1 line-clamp-2">{item.pesan}</p>
          <p className="text-xs text-muted-foreground/70 mt-1.5">{relativeTimeId(item.createdAt)}</p>
        </div>

        {/* delete button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          aria-label="Hapus notifikasi"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
   NotificationCenter — main component
   ============================================================ */
export function NotificationCenter() {
  const { setView } = useAppStore();
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipeFilter, setTipeFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const r = await api.notifikasi();
      setItems(r.items as NotifItem[]);
      setUnread(r.unread);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  /* filtered list */
  const filtered = useMemo(() => {
    let list = items;
    if (tipeFilter !== "all") list = list.filter((n) => n.tipe === tipeFilter);
    if (readFilter === "unread") list = list.filter((n) => !n.dibaca);
    if (readFilter === "read") list = list.filter((n) => n.dibaca);
    return list;
  }, [items, tipeFilter, readFilter]);

  /* grouped */
  const groups = useMemo(() => {
    const map = new Map<string, NotifItem[]>();
    for (const n of filtered) {
      const g = getDayGroup(n.createdAt);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(n);
    }
    return Array.from(map.entries());
  }, [filtered]);

  /* actions */
  const markAllRead = async () => {
    try {
      await api.markNotifRead();
      toast.success("Semua notifikasi ditandai sudah dibaca");
      load();
    } catch {
      toast.error("Gagal menandai notifikasi");
    }
  };

  const handleRead = async (id: string) => {
    try {
      await api.markNotifRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, dibaca: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      /* silent */
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteNotifikasi(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
      setUnread((u) => Math.max(0, u - 1));
      toast.success("Notifikasi dihapus");
    } catch {
      toast.error("Gagal menghapus notifikasi");
    }
  };

  const handleClearAll = async () => {
    try {
      await api.clearAllNotifikasi();
      setItems([]);
      setUnread(0);
      toast.success("Semua notifikasi dihapus");
    } catch {
      toast.error("Gagal menghapus semua notifikasi");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto animate-fade-in-up">
      {/* back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 text-muted-foreground hover:text-foreground"
        onClick={() => setView("dashboard")}
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Dashboard
      </Button>

      {/* header */}
      <SectionHeader
        title="Pusat Notifikasi"
        subtitle="Kelola semua notifikasi sistem Anda"
        icon={Bell}
        action={
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs">
                {unread} belum dibaca
              </Badge>
            )}
          </div>
        }
      />

      {/* filter bar */}
      <div className="glass-card border-primary/15 p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        {/* type filter */}
        <Select value={tipeFilter} onValueChange={setTipeFilter}>
          <SelectTrigger className="w-[160px]" size="sm">
            <SelectValue placeholder="Filter tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="INFO">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TIPE_COLORS.INFO }} />
                Info
              </span>
            </SelectItem>
            <SelectItem value="SUCCESS">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TIPE_COLORS.SUCCESS }} />
                Sukses
              </span>
            </SelectItem>
            <SelectItem value="WARNING">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TIPE_COLORS.WARNING }} />
                Peringatan
              </span>
            </SelectItem>
            <SelectItem value="DANGER">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TIPE_COLORS.DANGER }} />
                Bahaya
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* read status filter */}
        <div className="flex items-center gap-1 rounded-lg border border-border/50 p-0.5">
          {(
            [
              { key: "all", label: "Semua" },
              { key: "unread", label: "Belum Dibaca" },
              { key: "read", label: "Sudah Dibaca" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                readFilter === opt.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
              onClick={() => setReadFilter(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* action buttons */}
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-destructive"
              onClick={handleClearAll}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus Semua
            </Button>
            {unread > 0 && (
              <Button
                size="sm"
                className="text-xs bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
                onClick={markAllRead}
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" /> Tandai Semua Dibaca
              </Button>
            )}
          </div>
        )}
      </div>

      {/* notification list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card border-primary/15 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center mb-4">
            <Bell className="w-7 h-7 text-primary/50" />
          </div>
          <p className="text-lg font-semibold text-foreground/80">Tidak ada notifikasi</p>
          <p className="text-sm text-muted-foreground mt-1">
            {readFilter === "unread"
              ? "Semua notifikasi telah dibaca"
              : tipeFilter !== "all"
                ? "Tidak ada notifikasi dengan tipe ini"
                : "Belum ada notifikasi untuk Anda"}
          </p>
        </div>
      ) : (
        <ScrollArea className="max-h-[600px] pr-1">
          <div className="space-y-5">
            {groups.map(([label, groupItems]) => (
              <div key={label}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 px-1">
                  {label}
                </p>
                <div className="space-y-2">
                  {groupItems.map((n) => (
                    <NotifCard key={n.id} item={n} onRead={handleRead} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
