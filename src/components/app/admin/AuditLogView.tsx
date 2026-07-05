"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { SectionHeader } from "@/components/app/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { ROLE_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import {
  ScrollText,
  Search,
  Loader2,
  Inbox,
  ShieldCheck,
  UserCog,
  Crown,
  User,
} from "lucide-react";

interface AuditItem {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  aksi: string;
  modul: string;
  entitasId: string | null;
  detail: string | null;
  ip: string | null;
  createdAt: string;
}

const MODUL_OPTIONS = ["AUTH", "PERMOHONAN", "USER", "JENIS_SURAT", "STATUS", "LAPORAN"] as const;

const roleIcon = (role: string) => {
  if (role === "ADMIN") return ShieldCheck;
  if (role === "ATASAN") return Crown;
  if (role === "PETUGAS") return UserCog;
  return User;
};

const roleColor = (role: string): string => {
  if (role === "ADMIN") return "#d4af37";
  if (role === "ATASAN") return "#f59e0b";
  if (role === "PETUGAS") return "#3b82f6";
  return "#64748b";
};

const aksiStyle = (aksi: string): { color: string; bg: string; border: string } => {
  const a = (aksi || "").toUpperCase();
  let c = "#64748b";
  if (a.includes("LOGIN") || a.includes("LOGOUT")) c = "#3b82f6";
  else if (a.includes("CREATE")) c = "#16a34a";
  else if (a.includes("UPDATE")) c = "#f59e0b";
  else if (a.includes("DELETE")) c = "#dc2626";
  else if (a.includes("STATUS")) c = "#06b6d4";
  else if (a.includes("APPROVE")) c = "#d4af37";
  return { color: c, bg: `${c}1a`, border: `${c}55` };
};

const modulStyle = (modul: string): { color: string; bg: string; border: string } => {
  const map: Record<string, string> = {
    AUTH: "#0891b2",
    PERMOHONAN: "#d4af37",
    USER: "#3b82f6",
    JENIS_SURAT: "#0d9488",
    STATUS: "#06b6d4",
    LAPORAN: "#f59e0b",
  };
  const c = map[(modul || "").toUpperCase()] || "#64748b";
  return { color: c, bg: `${c}1a`, border: `${c}55` };
};

function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AuditLogView() {
  const { can } = useAppStore();
  const allowed = can("view_audit");

  const [q, setQ] = useState("");
  const [modul, setModul] = useState<string>("all");
  const [limit, setLimit] = useState<string>("100");

  const [items, setItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(false);

  // debounce search
  const debTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    if (debTimer.current) clearTimeout(debTimer.current);
    debTimer.current = setTimeout(() => setDebouncedQ(q.trim()), 400);
    return () => {
      if (debTimer.current) clearTimeout(debTimer.current);
    };
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.auditLog({
        limit,
        q: debouncedQ || undefined,
        modul: modul !== "all" ? modul : undefined,
      })) as { items: AuditItem[] };
      setItems(res.items || []);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat audit log");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [limit, debouncedQ, modul]);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  if (!allowed) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <Card className="glass-card border-primary/15">
          <CardContent className="p-8 text-center text-muted-foreground">
            Akses ditolak. Hanya Administrator yang dapat melihat audit log.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-5">
      <SectionHeader
        title="Audit Log"
        subtitle="Catatan seluruh aktivitas pengguna sistem"
        icon={ScrollText}
      />

      {/* Filter card */}
      <Card className="glass-card border-primary/15">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5 lg:col-span-2">
              <Label className="text-xs">Pencarian</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari nama / aksi / detail…"
                  className="pl-8 bg-input/50"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Modul</Label>
              <Select value={modul} onValueChange={setModul}>
                <SelectTrigger className="w-full bg-input/50">
                  <SelectValue placeholder="Semua Modul" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Modul</SelectItem>
                  {MODUL_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Jumlah</Label>
              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger className="w-full bg-input/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 baris</SelectItem>
                  <SelectItem value="100">100 baris</SelectItem>
                  <SelectItem value="200">200 baris</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              Filter diterapkan otomatis. Pencarian ditunda ~400ms.
            </p>
            <Badge variant="outline" className="text-[10px]">
              {items.length} / {limit} baris
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="glass-card border-primary/15">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Riwayat Aktivitas</h3>
            </div>
            <span className="text-[11px] text-muted-foreground">Total: {items.length} entri</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Memuat audit log…</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="w-10 h-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada aktivitas tercatat.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-xs">Waktu</TableHead>
                    <TableHead className="text-xs">Pengguna</TableHead>
                    <TableHead className="text-xs">Aksi</TableHead>
                    <TableHead className="text-xs">Modul</TableHead>
                    <TableHead className="text-xs">Detail</TableHead>
                    <TableHead className="text-xs">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => {
                    const as = aksiStyle(it.aksi);
                    const ms = modulStyle(it.modul);
                    const RoleIcon = roleIcon(it.userRole);
                    const rc = roleColor(it.userRole);
                    return (
                      <TableRow key={it.id} className="border-border/30 align-top">
                        <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {fmtDateTime(it.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border"
                              style={{ backgroundColor: `${rc}1a`, borderColor: `${rc}55` }}
                            >
                              <RoleIcon className="w-3 h-3" style={{ color: rc }} />
                            </span>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{it.userName}</div>
                              <span
                                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border"
                                style={{ color: rc, backgroundColor: `${rc}1a`, borderColor: `${rc}55` }}
                              >
                                {ROLE_LABELS[it.userRole as keyof typeof ROLE_LABELS] || it.userRole}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className="inline-flex items-center rounded-full text-[10px] font-semibold px-2 py-0.5 border whitespace-nowrap"
                            style={{ color: as.color, backgroundColor: as.bg, borderColor: as.border }}
                          >
                            {it.aksi}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className="inline-flex items-center rounded-full text-[10px] font-medium px-2 py-0.5 border whitespace-nowrap"
                            style={{ color: ms.color, backgroundColor: ms.bg, borderColor: ms.border }}
                          >
                            {it.modul}
                          </span>
                        </TableCell>
                        <TableCell
                          className="text-xs max-w-[280px] truncate"
                          title={it.detail || ""}
                        >
                          {it.detail || "—"}
                        </TableCell>
                        <TableCell className="text-[11px] font-mono text-muted-foreground">
                          {it.ip || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
