"use client";
import { useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const tipeColor: Record<string, string> = {
  SUCCESS: "#16a34a",
  WARNING: "#f59e0b",
  DANGER: "#dc2626",
  INFO: "#3b82f6",
};

const tipeIcons: Record<string, any> = {
  INFO: Info,
  SUCCESS: CheckCircle2,
  WARNING: AlertTriangle,
  DANGER: XCircle,
};

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
  return new Date(date).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function NotificationsBell() {
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const { setView, selectPermohonan } = useAppStore();

  useEffect(() => {
    let active = true;
    const load = () => {
      api.notifikasi()
        .then((r) => {
          if (!active) return;
          setItems(r.items);
          setUnread(r.unread);
        })
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  const markAll = async () => {
    await api.markNotifRead();
    load();
  };

  const load = async () => {
    try {
      const r = await api.notifikasi();
      setItems(r.items);
      setUnread(r.unread);
    } catch {}
  };

  const handleNotifClick = async (n: any) => {
    if (!n.dibaca) {
      await api.markNotifRead(n.id);
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, dibaca: true } : i)));
      setUnread((u) => Math.max(0, u - 1));
    }
    setOpen(false);
    if (n.permohonanId) {
      selectPermohonan(n.permohonanId);
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    setView("notifikasi-center");
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) load(); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-accent">
          <Bell className="w-4.5 h-4.5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center bg-primary text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 glass-card navy-glow" align="end">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
          <span className="font-semibold text-sm">Notifikasi</span>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAll}>
              <CheckCheck className="w-3.5 h-3.5 mr-1" /> Tandai dibaca
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-scroll notif-scroll">
          {items.length === 0 ? (
            <div className="py-8 flex flex-col items-center text-center px-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center mb-2">
                <Bell className="w-5 h-5 text-primary/40" />
              </div>
              <p className="text-sm text-muted-foreground">Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {items.map((n) => {
                const color = tipeColor[n.tipe] || tipeColor.INFO;
                const TipeIcon = tipeIcons[n.tipe] || Info;
                return (
                  <button
                    key={n.id}
                    type="button"
                    className={cn(
                      "w-full text-left px-3 py-2.5 hover:bg-accent/40 transition-colors",
                      !n.dibaca && "bg-primary/5 border-l-[3px]"
                    )}
                    style={{ borderLeftColor: !n.dibaca ? color : undefined }}
                    onClick={() => handleNotifClick(n)}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: `${color}18` }}
                      >
                        <TipeIcon className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className={cn("text-sm leading-tight", !n.dibaca ? "font-semibold" : "font-medium")}>
                            {n.judul}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.pesan}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {relativeTimeId(n.createdAt)}
                        </p>
                      </div>
                      {!n.dibaca && (
                        <span
                          className="w-2 h-2 rounded-full mt-2 shrink-0"
                          style={{ backgroundColor: color }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className="border-t border-border/50">
            <button
              type="button"
              className="w-full px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent/30 transition-colors text-center"
              onClick={handleViewAll}
            >
              Lihat Semua Notifikasi →
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
