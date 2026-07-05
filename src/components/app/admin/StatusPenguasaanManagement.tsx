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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ShieldAlert,
  Plus,
  Loader2,
  Inbox,
  Save,
  Hash,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Trash2,
  Lock,
  Power,
  Star,
  Palette,
  Info,
} from "lucide-react";

interface StatusPenguasaanItem {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string | null;
  urutan: number;
  warna: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Permohonan count is appended client-side via a separate query
// (since the denormalized string field can't use Prisma relations).
interface StatusPenguasaanWithCount extends StatusPenguasaanItem {
  _count?: { permohonan: number };
}

type Mode = "create" | "edit";

export function StatusPenguasaanManagement() {
  const { can } = useAppStore();
  const allowed = can("manage_jenis"); // reuse the same permission as jenis surat

  const [items, setItems] = useState<StatusPenguasaanWithCount[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<StatusPenguasaanWithCount | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    kode: "",
    nama: "",
    deskripsi: "",
    urutan: 0,
    warna: "#d4af37",
    isDefault: false,
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch master rows (include inactive for admin view)
      const res = (await api.statusPenguasaan(true)) as { items: StatusPenguasaanItem[] };
      const masterItems = res.items || [];

      // Fetch all permohonan statusPenguasaan values to compute usage counts client-side
      // (denormalized string field — Prisma can't aggregate via relation count).
      // We pull all permohonan in one shot (admin scope). For very large datasets this
      // could be optimized with a dedicated aggregate endpoint; acceptable for now.
      let countMap: Record<string, number> = {};
      try {
        // Fetch all permohonan (limit high to cover all) — only need statusPenguasaan field
        const list = await api.listPermohonan({ limit: "1000" });
        for (const p of list.items || []) {
          const sp = p.statusPenguasaan;
          if (!sp) continue;
          countMap[sp] = (countMap[sp] || 0) + 1;
        }
      } catch {
        // If count fetch fails, continue without counts (non-fatal)
      }

      const withCounts: StatusPenguasaanWithCount[] = masterItems.map((it) => ({
        ...it,
        _count: { permohonan: countMap[it.nama] || 0 },
      }));

      setItems(withCounts);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat data status penguasaan");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  const openCreate = () => {
    setMode("create");
    setEditingId(null);
    setForm({
      kode: "",
      nama: "",
      deskripsi: "",
      urutan: items.length + 1,
      warna: "#d4af37",
      isDefault: false,
      isActive: true,
    });
    setOpen(true);
  };

  const openEdit = (s: StatusPenguasaanWithCount) => {
    setMode("edit");
    setEditingId(s.id);
    setForm({
      kode: s.kode,
      nama: s.nama,
      deskripsi: s.deskripsi || "",
      urutan: s.urutan,
      warna: s.warna || "#d4af37",
      isDefault: s.isDefault,
      isActive: s.isActive,
    });
    setOpen(true);
  };

  const normalizeKode = (raw: string) =>
    raw.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");

  const handleSubmit = async () => {
    if (mode === "create") {
      const kode = normalizeKode(form.kode);
      if (!kode || !form.nama.trim()) {
        toast.error("Kode dan Nama wajib diisi");
        return;
      }
      setSaving(true);
      try {
        await api.createStatusPenguasaan({
          kode,
          nama: form.nama.trim(),
          deskripsi: form.deskripsi.trim() || undefined,
          urutan: form.urutan,
          warna: form.warna || undefined,
          isDefault: form.isDefault,
          isActive: form.isActive,
        });
        toast.success(`Status penguasaan "${kode}" berhasil ditambahkan`);
        setOpen(false);
        await load();
      } catch (e: any) {
        toast.error(e?.message || "Gagal menambahkan status penguasaan");
      } finally {
        setSaving(false);
      }
    } else {
      if (!editingId) return;
      if (!form.nama.trim()) {
        toast.error("Nama wajib diisi");
        return;
      }
      setSaving(true);
      try {
        await api.updateStatusPenguasaan(editingId, {
          nama: form.nama.trim(),
          deskripsi: form.deskripsi.trim() || null,
          urutan: form.urutan,
          warna: form.warna || null,
          isDefault: form.isDefault,
          isActive: form.isActive,
        });
        toast.success(`Status penguasaan "${form.kode}" berhasil diperbarui`);
        setOpen(false);
        await load();
      } catch (e: any) {
        toast.error(e?.message || "Gagal memperbarui status penguasaan");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleToggleActive = async (s: StatusPenguasaanWithCount) => {
    try {
      await api.updateStatusPenguasaan(s.id, { isActive: !s.isActive });
      toast.success(`Status penguasaan "${s.kode}" ${!s.isActive ? "diaktifkan" : "dinonaktifkan"}`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Gagal mengubah status");
    }
  };

  const handleSetDefault = async (s: StatusPenguasaanWithCount) => {
    if (s.isDefault) return; // already default
    try {
      await api.updateStatusPenguasaan(s.id, { isDefault: true });
      toast.success(`"${s.nama}" dijadikan pilihan default`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Gagal mengatur default");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteStatusPenguasaan(deleteTarget.id);
      toast.success(`Status penguasaan "${deleteTarget.kode}" berhasil dihapus`);
      setDeleteTarget(null);
      await load();
    } catch (e: any) {
      const msg = e?.message || "Gagal menghapus status penguasaan";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (!allowed) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <Card className="glass-card border-primary/15">
          <CardContent className="p-8 text-center text-muted-foreground">
            Akses ditolak. Hanya Administrator yang dapat mengelola status penguasaan.
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeCount = items.filter((i) => i.isActive).length;
  const defaultItem = items.find((i) => i.isDefault);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-5">
      <SectionHeader
        title="Status Penguasaan Tanah"
        subtitle="Master data jenis hak penguasaan tanah untuk dropdown permohonan"
        icon={ShieldAlert}
        action={
          <Button
            onClick={openCreate}
            className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Tambah Status
          </Button>
        }
      />

      {/* Info banner */}
      <Card className="glass-card border-primary/15">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
            <p>
              <span className="text-foreground font-medium">Status Penguasaan Tanah</span> adalah
              jenis hak penguasaan atas bidang tanah (SHM, HGB, Girik, Warisan, dll). Daftar ini
              digunakan pada form <span className="font-medium">Daftar Permohonan Baru</span> dan{" "}
              <span className="font-medium">Edit Permohonan</span>.
            </p>
            <p>
              <AlertTriangle className="inline w-3 h-3 text-amber-500 mr-1" />
              Status yang sudah dipakai oleh permohonan tidak dapat dihapus — nonaktifkan saja.
              Default akan otomatis terpilih saat membuat permohonan baru.
            </p>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
              <span><span className="font-semibold text-foreground">{items.length}</span> total</span>
              <span><span className="font-semibold text-green-400">{activeCount}</span> aktif</span>
              <span><span className="font-semibold text-amber-400">{items.length - activeCount}</span> nonaktif</span>
              {defaultItem && (
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  Default: <span className="font-semibold text-foreground">{defaultItem.nama}</span>
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Memuat status penguasaan…</span>
        </div>
      ) : items.length === 0 ? (
        <Card className="glass-card border-primary/15">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <Inbox className="w-10 h-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Belum ada status penguasaan terdaftar.</p>
            <Button onClick={openCreate} variant="outline" className="mt-3" size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> Tambah Status Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((s) => {
            const permohonanCount = s._count?.permohonan ?? 0;
            return (
              <Card
                key={s.id}
                className={`glass-card border-primary/15 hover:gold-border transition-all flex flex-col ${
                  !s.isActive ? "opacity-60" : ""
                } ${s.isDefault ? "ring-1 ring-amber-400/40" : ""}`}
              >
                <CardContent className="p-5 space-y-3 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex items-start gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 mt-1.5 ring-2 ring-background"
                        style={{
                          backgroundColor: s.warna || "#d4af37",
                          boxShadow: `0 0 8px ${(s.warna || "#d4af37")}88`,
                        }}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-base leading-tight line-clamp-2 break-words">
                          {s.nama}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Hash className="w-3 h-3 text-muted-foreground" />
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary">
                            {s.kode}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground ml-1">
                            #{s.urutan}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {s.isDefault ? (
                        <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-400 bg-amber-500/10">
                          <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" /> Default
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60">&nbsp;</span>
                      )}
                      {s.isActive ? (
                        <Badge variant="outline" className="text-[10px] border-green-500/40 text-green-400">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Aktif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          Nonaktif
                        </Badge>
                      )}
                    </div>
                  </div>

                  {s.deskripsi ? (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{s.deskripsi}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground/60 italic">Tanpa deskripsi</p>
                  )}

                  <Separator className="bg-border/40" />

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Palette className="w-3 h-3" />
                      Warna:
                      <span
                        className="inline-block w-3 h-3 rounded-sm border border-border/60 ml-0.5"
                        style={{ backgroundColor: s.warna || "#d4af37" }}
                      />
                      <span className="font-mono text-[10px] ml-0.5">{s.warna || "-"}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Digunakan:{" "}
                      <span className={`font-semibold ${permohonanCount > 0 ? "text-foreground" : "text-muted-foreground/60"}`}>
                        {permohonanCount}
                      </span>
                    </span>
                  </div>

                  {permohonanCount > 0 && (
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      Digunakan oleh{" "}
                      <span className="font-semibold text-foreground">{permohonanCount}</span>{" "}
                      permohonan — tidak dapat dihapus
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-auto pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(s)}
                      className="h-8 text-xs flex-1 min-w-[5rem]"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetDefault(s)}
                      disabled={s.isDefault}
                      title={s.isDefault ? "Sudah menjadi default" : "Jadikan default"}
                      className="h-8 text-xs px-2.5 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Star className={`w-3.5 h-3.5 ${s.isDefault ? "fill-amber-400 text-amber-400" : ""}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(s)}
                      title={s.isActive ? "Nonaktifkan" : "Aktifkan"}
                      className="h-8 text-xs px-2.5"
                    >
                      <Power className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteTarget(s)}
                      disabled={permohonanCount > 0}
                      title={
                        permohonanCount > 0
                          ? `Tidak dapat dihapus — masih digunakan oleh ${permohonanCount} permohonan`
                          : "Hapus status penguasaan"
                      }
                      className="h-8 text-xs px-2.5 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {permohonanCount > 0 ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent className="glass-card navy-glow border-primary/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" />
              {mode === "create" ? "Tambah Status Penguasaan" : "Edit Status Penguasaan"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Tentukan kode, nama, dan tampilan untuk jenis penguasaan tanah baru."
                : `Perbarui informasi status penguasaan "${form.kode}". Kode tidak dapat diubah.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Kode {mode === "create" ? "*" : "(tidak dapat diubah)"}</Label>
                <div className="relative">
                  <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={form.kode}
                    onChange={(e) =>
                      mode === "create" && setForm({ ...form, kode: e.target.value })
                    }
                    placeholder="SHM"
                    className="pl-8 font-mono bg-input/50 uppercase"
                    disabled={mode === "edit"}
                  />
                </div>
                {mode === "create" ? (
                  <p className="text-[10px] text-muted-foreground">
                    Otomatis kapital &amp; spasi diganti underscore. Contoh: SHM, HGB, GIRIK
                  </p>
                ) : (
                  <p className="text-[10px] text-amber-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Kode merupakan kunci unik dan tidak dapat diubah.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Urutan Tampil</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.urutan}
                  onChange={(e) => setForm({ ...form, urutan: Number(e.target.value) || 0 })}
                  className="bg-input/50"
                />
                <p className="text-[10px] text-muted-foreground">Angka kecil tampil lebih dulu</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Nama Status Penguasaan *</Label>
              <Input
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Milik Sendiri (SHM)"
                className="bg-input/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Deskripsi</Label>
              <Textarea
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                placeholder="Penjelasan singkat jenis penguasaan tanah ini…"
                rows={3}
                className="bg-input/50 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Warna Badge (opsional)
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.warna || "#d4af37"}
                  onChange={(e) => setForm({ ...form, warna: e.target.value })}
                  className="w-10 h-9 rounded-md border border-border/60 bg-input/50 cursor-pointer p-1"
                  aria-label="Pilih warna"
                />
                <Input
                  value={form.warna || ""}
                  onChange={(e) => setForm({ ...form, warna: e.target.value })}
                  placeholder="#d4af37"
                  className="font-mono bg-input/50 flex-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex items-center justify-between rounded-lg border border-border/40 p-3 bg-input/20">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <div>
                    <Label className="text-sm font-medium">Pilihan Default</Label>
                    <p className="text-[10px] text-muted-foreground">Terpilih otomatis di form baru</p>
                  </div>
                </div>
                <Switch
                  checked={form.isDefault}
                  onCheckedChange={(v) => setForm({ ...form, isDefault: v })}
                />
              </div>
              {mode === "edit" ? (
                <div className="flex items-center justify-between rounded-lg border border-border/40 p-3 bg-input/20">
                  <div className="flex items-center gap-2">
                    <Power className="w-4 h-4 text-primary" />
                    <div>
                      <Label className="text-sm font-medium">Status Aktif</Label>
                      <p className="text-[10px] text-muted-foreground">
                        Nonaktif tidak tampil di dropdown
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-border/40 p-3 bg-input/20 opacity-70">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <div>
                      <Label className="text-sm font-medium">Status Aktif</Label>
                      <p className="text-[10px] text-muted-foreground">Default aktif</p>
                    </div>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                  />
                </div>
              )}
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
              {mode === "create" ? "Simpan Status" : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !deleting && !o && setDeleteTarget(null)}>
        <AlertDialogContent className="glass-card navy-glow border-red-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-4 h-4" /> Hapus Status Penguasaan?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus status penguasaan{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.nama}</span>{" "}
              <span className="font-mono text-xs">({deleteTarget?.kode})</span>.
              Tindakan ini tidak dapat dibatalkan. Permohonan yang sudah ada (dengan nilai
              string lama) tidak akan terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
