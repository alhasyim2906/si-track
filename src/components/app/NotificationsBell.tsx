"use client";
import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const tipeColor: Record<string, string> = {
  SUCCESS: "#16a34a",
  WARNING: "#f59e0b",
  DANGER: "#dc2626",
  INFO: "#3b82f6",
};

export function NotificationsBell() {
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      const r = await api.notifikasi();
      setItems(r.items);
      setUnread(r.unread);
    } catch {}
  };
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
        <ScrollArea className="max-h-80">
          <div className="divide-y divide-border/30">
            {items.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">Tidak ada notifikasi</div>
            )}
            {items.map((n) => (
              <div key={n.id} className={cn("px-3 py-2.5 hover:bg-accent/40 transition-colors", !n.dibaca && "bg-primary/5")}>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: tipeColor[n.tipe] || "#3b82f6" }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{n.judul}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.pesan}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {new Date(n.createdAt).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
