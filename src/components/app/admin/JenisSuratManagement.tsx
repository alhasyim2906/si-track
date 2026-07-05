"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { SectionHeader } from "@/components/app/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  FileStack,
  Plus,
  Ruler,
  Stamp,
  Loader2,
  Inbox,
  Save,
  Hash,
  ListChecks,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface JenisSuratItem {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
  butuhPengukuran: boolean;
  butuhTtdCamat: boolean;
  isActive: boolean;
  createdAt: string;
}

interface StatusProsesItem {
  id: string;
  kode: string;
  nama: string;
  urutan: number;
  warna: string;
  icon: string | null;
  keterangan: string | null;
  isKhusus: boolean;
  isFinal: boolean;
  isActive: boolean;
}

export function JenisSuratManagement() {
  const { can } = useAppStore();
  const allowed = can("manage_jenis");

  const [items, setItems] = useState<JenisSuratItem[]>([]);
  const [statusList, setStatusList] = useState<StatusProsesItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    kode: "",
    nama: "",
    deskripsi: "",
    butuhPengukuran: true,
    butuhTtdCamat: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [jRes, sRes] = await Promise.all([api.jenisSurat(), api.statusProses()]);
      setItems((jRes as { items: JenisSuratItem[] }).items || []);
      setStatusList((sRes as { items: StatusProsesItem[] }).items || []);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat data master");
      setItems([]);
      setStatusList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  const openCreate = () => {
    setForm({
      kode: "",
      nama: "",
      deskripsi: "",
      butuhPengukuran: true,
      butuhTtdCamat: false,
    });
    setOpen(true);
  };

  const normalizeKode = (raw: string) => raw.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");

  const handleSubmit = async () => {
    const kode = normalizeKode(form.kode);
    if (!kode || !form.nama.trim()) {
      toast.error("Kode dan Nama wajib diisi");
      return;
    }
    setSaving(true);
    try {
      await api.createJenisSurat({
        kode,
        nama: form.nama.trim(),
        deskripsi: form.deskripsi.trim() || undefined,
        butuhPengukuran: form.butuhPengukuran,
        butuhTtdCamat: form.butuhTtdCamat,
      });
      toast.success(`Jenis surat "${kode}" berhasil ditambahkan`);
      setOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menambahkan jenis surat");
    } finally {
      setSaving(false);
    }
  };

  if (!allowed) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <Card className="glass-card border-primary/15">
          <CardContent className="p-8 text-center text-muted-foreground">
            Akses ditolak. Hanya Administrator yang dapat mengelola jenis surat.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-5">
      <SectionHeader
        title="Jenis Surat Tanah"
        subtitle="Master data jenis surat & konfigurasi alur kerja"
        icon={FileStack}
        action={
          <Button
            onClick={openCreate}
            className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Tambah Jenis
          </Button>
        }
      />

      {/* Jenis Surat cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Memuat jenis surat…</span>
        </div>
      ) : items.length === 0 ? (
        <Card className="glass-card border-primary/15">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <Inbox className="w-10 h-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Belum ada jenis surat terdaftar.</p>
            <Button onClick={openCreate} variant="outline" className="mt-3" size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> Tambah Jenis Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((j) => (
            <Card key={j.id} className="glass-card border-primary/15 hover:gold-border transition-all">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-base leading-tight truncate">{j.nama}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Hash className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary">
                        {j.kode}
                      </span>
                    </div>
                  </div>
                  {j.isActive ? (
                    <Badge variant="outline" className="text-[10px] border-green-500/40 text-green-400 shrink-0">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Aktif
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">
                      Nonaktif
                    </Badge>
                  )}
                </div>

                {j.deskripsi ? (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{j.deskripsi}</p>
                ) : (
                  <p className="text-xs text-muted-foreground/60 italic">Tanpa deskripsi</p>
                )}

                <Separator className="bg-border/40" />

                <div className="flex flex-wrap gap-2">
                  <ToggleBadge
                    icon={Ruler}
                    label="Butuh Pengukuran"
                    on={j.butuhPengukuran}
                  />
                  <ToggleBadge
                    icon={Stamp}
                    label="Butuh TTD Camat"
                    on={j.butuhTtdCamat}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Status Proses reference */}
      <Card className="glass-card border-primary/15">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <ListChecks className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Master Status Proses</h3>
                <p className="text-xs text-muted-foreground">Referensi alur kerja status (read-only)</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {statusList.length} status
            </Badge>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {statusList
                .slice()
                .sort((a, b) => a.urutan - b.urutan)
                .map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-lg border border-border/40 bg-input/20 px-3 py-2.5"
                  >
                    <span className="text-[10px] font-mono text-muted-foreground w-5 shrink-0">
                      {String(s.urutan).padStart(2, "0")}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.warna, boxShadow: `0 0 6px ${s.warna}66` }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{s.nama}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{s.kode}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.isKhusus && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 h-4"
                          style={{ color: "#f97316", borderColor: "#f9731655", backgroundColor: "#f973161a" }}
                        >
                          <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Khusus
                        </Badge>
                      )}
                      {s.isFinal && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 h-4"
                          style={{ color: "#16a34a", borderColor: "#16a34a55", backgroundColor: "#16a34a1a" }}
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Final
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card navy-glow border-primary/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileStack className="w-4 h-4 text-primary" /> Tambah Jenis Surat
            </DialogTitle>
            <DialogDescription>
              Tentukan kode, nama, dan kebutuhan alur kerja untuk jenis surat baru.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Kode *</Label>
              <div className="relative">
                <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={form.kode}
                  onChange={(e) => setForm({ ...form, kode: e.target.value })}
                  placeholder="SURAT_KETERANGAN_TANAH"
                  className="pl-8 font-mono bg-input/50 uppercase"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Otomatis kapital &amp; spasi diganti underscore. Contoh: SURAT_KETERANGAN_TANAH
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Jenis Surat *</Label>
              <Input
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Surat Keterangan Tanah"
                className="bg-input/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Deskripsi</Label>
              <Textarea
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                placeholder="Penjelasan singkat mengenai jenis surat ini…"
                rows={3}
                className="bg-input/50 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex items-center justify-between rounded-lg border border-border/40 p-3 bg-input/20">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-[#ca8a04]" />
                  <div>
                    <Label className="text-sm font-medium">Butuh Pengukuran</Label>
                    <p className="text-[10px] text-muted-foreground">Tahap pengukuran tanah</p>
                  </div>
                </div>
                <Switch
                  checked={form.butuhPengukuran}
                  onCheckedChange={(v) => setForm({ ...form, butuhPengukuran: v })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/40 p-3 bg-input/20">
                <div className="flex items-center gap-2">
                  <Stamp className="w-4 h-4 text-[#f59e0b]" />
                  <div>
                    <Label className="text-sm font-medium">Butuh TTD Camat</Label>
                    <p className="text-[10px] text-muted-foreground">Pengesahan Camat</p>
                  </div>
                </div>
                <Switch
                  checked={form.butuhTtdCamat}
                  onCheckedChange={(v) => setForm({ ...form, butuhTtdCamat: v })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
              Simpan Jenis Surat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToggleBadge({ icon: Icon, label, on }: { icon: any; label: string; on: boolean }) {
  const color = on ? "#16a34a" : "#64748b";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full text-[10px] font-medium px-2 py-1 border"
      style={{ color, backgroundColor: `${color}1a`, borderColor: `${color}55` }}
    >
      <Icon className="w-3 h-3" />
      {label}
      <span className="ml-0.5 font-bold">{on ? "ON" : "OFF"}</span>
    </span>
  );
}
