"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Wallet, Loader2, Save, CheckCircle2, XCircle, Clock, AlertCircle,
  Printer, Banknote, CreditCard, QrCode, RefreshCw, Plus, Edit3, Info,
  Calendar, FileText, Receipt, ShieldCheck,
} from "lucide-react";
import { formatRupiah, parseRupiah, terbilang } from "@/lib/terbilang";
import { KwitansiPembayaran, type KwitansiData } from "@/components/app/shared/KwitansiPembayaran";

/* ============================================================
   BiayaTab — embedded inside PermohonanDetail
   Manages the operational cost (biaya operasional) for a permohonan:
   - If no biaya exists: show "create biaya" form (nominal, keterangan, jatuh tempo)
   - If biaya exists and BELUM_LUNAS: show details + "Tandai Sudah Dibayar" action
   - If biaya exists and LUNAS: show "Lunas" success card + "Cetak Kwitansi" button
     + "Batal Pembayaran" (admin only — frees the kwitansi number)
   ============================================================ */

export interface BiayaData {
  id: string;
  permohonanId: string;
  nominal: number;
  keterangan: string | null;
  statusPembayaran: string; // BELUM_LUNAS | LUNAS
  metodePembayaran: string | null;
  tanggalJatuhTempo: string | null;
  tanggalBayar: string | null;
  nomorKwitansi: string | null;
  diterimaOleh: string | null;
  catatan: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  permohonanId: string;
  nomorRegister: string;
  statusSaatIni: string;
  pemohonNama: string;
  pemohonNik: string;
  pemohonAlamat: string | null;
  pemohonHp: string | null;
  jenisSuratNama: string;
  keperluan: string | null;
  biaya: BiayaData | null;
  canEdit: boolean; // PETUGAS or ADMIN
  isAdmin: boolean;
  petugasNama?: string | null;
  petugasJabatan?: string | null;
  /** Called after create/update/bayar/batal to refresh parent state */
  onChanged: () => void;
}

const METODE_OPTIONS = [
  { value: "TUNAI", label: "Tunai", icon: Banknote },
  { value: "TRANSFER", label: "Transfer Bank", icon: CreditCard },
  { value: "QRIS", label: "QRIS / QR Code", icon: QrCode },
  { value: "LAINNYA", label: "Lainnya", icon: Wallet },
];

function formatDate(d?: string | null): string {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return d;
  }
}

function formatDateTime(d?: string | null): string {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return d;
  }
}

export function BiayaTab({
  permohonanId,
  nomorRegister,
  statusSaatIni,
  pemohonNama,
  pemohonNik,
  pemohonAlamat,
  pemohonHp,
  jenisSuratNama,
  keperluan,
  biaya,
  canEdit,
  isAdmin,
  petugasNama,
  petugasJabatan,
  onChanged,
}: Props) {
  // ===== Form state (create / edit) =====
  const [form, setForm] = useState({
    nominal: biaya ? formatRupiah(biaya.nominal).replace("Rp ", "") : "",
    keterangan: biaya?.keterangan || "",
    tanggalJatuhTempo: biaya?.tanggalJatuhTempo ? biaya.tanggalJatuhTempo.slice(0, 10) : "",
    catatan: biaya?.catatan || "",
  });

  // Keep form synced when biaya prop changes (e.g., after parent refetch)
  useEffect(() => {
    setForm({
      nominal: biaya ? biaya.nominal.toLocaleString("id-ID") : "",
      keterangan: biaya?.keterangan || "",
      tanggalJatuhTempo: biaya?.tanggalJatuhTempo ? biaya.tanggalJatuhTempo.slice(0, 10) : "",
      catatan: biaya?.catatan || "",
    });
  }, [biaya]);

  const [saving, setSaving] = useState(false);

  // ===== Bayar dialog state =====
  const [bayarOpen, setBayarOpen] = useState(false);
  const [bayarMetode, setBayarMetode] = useState<string>("TUNAI");
  const [bayarDiterimaOleh, setBayarDiterimaOleh] = useState<string>("");
  const [bayarCatatan, setBayarCatatan] = useState<string>("");
  const [bayarLoading, setBayarLoading] = useState(false);

  // ===== Batal bayar dialog state =====
  const [batalOpen, setBatalOpen] = useState(false);
  const [batalAlasan, setBatalAlasan] = useState<string>("");
  const [batalLoading, setBatalLoading] = useState(false);

  // ===== Kwitansi print dialog state =====
  const [kwitansiOpen, setKwitansiOpen] = useState(false);
  const [kwitansiQr, setKwitansiQr] = useState<string | null>(null);
  const [kwitansiQrLoading, setKwitansiQrLoading] = useState(false);

  // ===== Edit mode toggle (only when biaya exists) =====
  const [editMode, setEditMode] = useState(false);

  const nominalNum = useMemo(() => parseRupiah(form.nominal) ?? 0, [form.nominal]);
  const terbilangStr = useMemo(() => terbilang(nominalNum), [nominalNum]);

  // ============ Handlers ============
  const handleCreateOrUpdate = async () => {
    if (!canEdit) return;
    const nominal = parseRupiah(form.nominal);
    if (nominal == null || nominal < 0) {
      toast.error("Nominal biaya wajib diisi (angka >= 0)");
      return;
    }
    setSaving(true);
    try {
      const body: any = {
        nominal,
        keterangan: form.keterangan.trim() || null,
        tanggalJatuhTempo: form.tanggalJatuhTempo || null,
        catatan: form.catatan.trim() || null,
      };
      if (biaya) {
        await api.updateBiaya(permohonanId, body);
        toast.success("Biaya operasional diperbarui");
        setEditMode(false);
      } else {
        await api.createBiaya(permohonanId, body);
        toast.success("Biaya operasional dibuat");
      }
      onChanged();
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan biaya operasional");
    } finally {
      setSaving(false);
    }
  };

  const handleBayar = async () => {
    if (!canEdit) return;
    setBayarLoading(true);
    try {
      await api.bayarBiaya(permohonanId, {
        metodePembayaran: bayarMetode,
        diterimaOleh: bayarDiterimaOleh.trim() || undefined,
        catatan: bayarCatatan.trim() || undefined,
      });
      toast.success("Pembayaran berhasil dikonfirmasi. Kwitansi siap dicetak.");
      setBayarOpen(false);
      setBayarCatatan("");
      onChanged();
    } catch (e: any) {
      toast.error(e.message || "Gagal menandai pembayaran");
    } finally {
      setBayarLoading(false);
    }
  };

  const handleBatalBayar = async () => {
    if (!isAdmin) return;
    setBatalLoading(true);
    try {
      await api.batalBayarBiaya(permohonanId, batalAlasan.trim() || undefined);
      toast.success("Pembayaran dibatalkan. Biaya kembali ke status BELUM LUNAS.");
      setBatalOpen(false);
      setBatalAlasan("");
      onChanged();
    } catch (e: any) {
      toast.error(e.message || "Gagal membatalkan pembayaran");
    } finally {
      setBatalLoading(false);
    }
  };

  const openKwitansi = async () => {
    setKwitansiOpen(true);
    setKwitansiQr(null);
    setKwitansiQrLoading(true);
    try {
      const r = await api.kwitansiQr(permohonanId);
      setKwitansiQr(r.qr);
    } catch (e: any) {
      // Non-fatal — kwitansi can still be printed without QR
      console.warn("Failed to load kwitansi QR:", e);
      toast.error("Gagal memuat QR verifikasi kwitansi. Kwitansi tetap dapat dicetak tanpa QR.");
    } finally {
      setKwitansiQrLoading(false);
    }
  };

  // ============ Render: create form (no biaya yet) ============
  if (!biaya) {
    return (
      <div className="space-y-4">
        {!canEdit ? (
          <Card className="glass-card border-primary/15">
            <CardContent className="p-6 text-center">
              <Info className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Belum ada biaya operasional yang dibuat untuk permohonan ini.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Hanya Petugas/Admin yang dapat membuat biaya operasional.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card border-primary/15 border-l-4 border-l-primary">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Buat Biaya Operasional</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Tentukan nominal biaya untuk pemrosesan permohonan {nomorRegister}
                  </p>
                </div>
              </div>
              <Separator />

              <BiayaForm form={form} setForm={setForm} nominalNum={nominalNum} terbilangStr={terbilangStr} />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
                  disabled={saving}
                  onClick={handleCreateOrUpdate}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Buat Biaya Operasional
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ============ Render: biaya exists ============
  const isLunas = biaya.statusPembayaran === "LUNAS";
  const metodeDef = METODE_OPTIONS.find((m) => m.value === biaya.metodePembayaran);
  const MetodeIcon = metodeDef?.icon || Wallet;

  return (
    <div className="space-y-4">
      {/* ===== Status banner ===== */}
      {isLunas ? (
        <div className="rounded-lg border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Biaya Operasional Sudah Dibayar (LUNAS)
            </p>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
              Kwitansi <span className="font-mono font-semibold">{biaya.nomorKwitansi}</span> telah
              diterbitkan. Gunakan tombol &quot;Cetak Kwitansi&quot; untuk mencetak bukti pembayaran resmi.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Menunggu Pembayaran
            </p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
              Biaya operasional belum dibayar. Setelah pemohon melakukan pembayaran, konfirmasi
              dengan menekan tombol &quot;Tandai Sudah Dibayar&quot; untuk menerbitkan kwitansi.
              {biaya.tanggalJatuhTempo && (
                <> Jatuh tempo: <span className="font-semibold">{formatDate(biaya.tanggalJatuhTempo)}</span>.</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* ===== Biaya details card ===== */}
      <Card className="glass-card border-primary/15">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Detail Biaya Operasional</h3>
                <p className="text-[11px] text-muted-foreground">{nomorRegister}</p>
              </div>
            </div>
            <Badge
              className={isLunas
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
              }
            >
              {isLunas ? (
                <><CheckCircle2 className="w-3 h-3 mr-1" /> LUNAS</>
              ) : (
                <><Clock className="w-3 h-3 mr-1" /> BELUM LUNAS</>
              )}
            </Badge>
          </div>
          <Separator />

          {/* Nominal hero */}
          <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-4 space-y-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Nominal Biaya</p>
            <p className="font-mono text-2xl sm:text-3xl font-extrabold gold-gradient-text">
              {formatRupiah(biaya.nominal)}
            </p>
            <p className="text-xs italic text-muted-foreground leading-snug">
              Terbilang: &ldquo;{terbilang(biaya.nominal)}&rdquo;
            </p>
          </div>

          {/* Metadata grid */}
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Keterangan</p>
              <p className="font-medium">{biaya.keterangan || "Pembayaran biaya operasional pendaftaran surat tanah"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Metode Pembayaran</p>
              <p className="font-medium flex items-center gap-1.5">
                {biaya.metodePembayaran ? (
                  <><MetodeIcon className="w-3.5 h-3.5" /> {metodeDef?.label || biaya.metodePembayaran}</>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Jatuh Tempo</p>
              <p className="font-medium">{formatDate(biaya.tanggalJatuhTempo)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Tanggal Pembayaran</p>
              <p className="font-medium">{formatDateTime(biaya.tanggalBayar)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Nomor Kwitansi</p>
              <p className="font-mono font-semibold">{biaya.nomorKwitansi || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Diterima Oleh</p>
              <p className="font-medium">{biaya.diterimaOleh || "-"}</p>
            </div>
            {biaya.catatan && (
              <div className="sm:col-span-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Catatan</p>
                <p className="font-medium">{biaya.catatan}</p>
              </div>
            )}
          </div>

          {/* ===== Action buttons ===== */}
          {canEdit && (
            <>
              <Separator />
              <div className="flex flex-wrap items-center gap-2 justify-end">
                {/* Edit biaya (only when not LUNAS, or admin override) */}
                {(!isLunas || isAdmin) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode((v) => !v)}
                  >
                    <Edit3 className="w-4 h-4" />
                    {editMode ? "Tutup Edit" : "Edit Biaya"}
                  </Button>
                )}

                {/* Tandai lunas */}
                {!isLunas && (
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:opacity-90"
                    onClick={() => {
                      setBayarDiterimaOleh(petugasNama || "");
                      setBayarMetode("TUNAI");
                      setBayarCatatan(biaya.catatan || "");
                      setBayarOpen(true);
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Tandai Sudah Dibayar
                  </Button>
                )}

                {/* Cetak kwitansi */}
                {isLunas && (
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
                    onClick={openKwitansi}
                  >
                    <Printer className="w-4 h-4" />
                    Cetak Kwitansi
                  </Button>
                )}

                {/* Batal pembayaran (admin only) */}
                {isLunas && isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rose-600 border-rose-500/40 hover:bg-rose-500/10"
                    onClick={() => setBatalOpen(true)}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Batal Pembayaran
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ===== Inline edit form ===== */}
      {editMode && canEdit && (!isLunas || isAdmin) && (
        <Card className="glass-card border-primary/15 border-l-4 border-l-primary">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Edit Biaya Operasional</h3>
            </div>
            <Separator />
            <BiayaForm form={form} setForm={setForm} nominalNum={nominalNum} terbilangStr={terbilangStr} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>Batal</Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
                disabled={saving}
                onClick={handleCreateOrUpdate}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Perubahan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== Info card: when payment can be marked ===== */}
      {!isLunas && !canEdit && (
        <Card className="glass-card border-primary/15">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Hanya Petugas atau Admin yang dapat menandai pembayaran. Hubungi petugas kelurahan
              untuk konfirmasi pembayaran setelah biaya operasional dilunasi.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ===== Bayar Dialog ===== */}
      <Dialog open={bayarOpen} onOpenChange={setBayarOpen}>
        <DialogContent className="glass-card navy-glow border-primary/20 max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Konfirmasi Pembayaran
            </DialogTitle>
            <DialogDescription>
              Tandai biaya operasional {nomorRegister} sebagai LUNAS. Tindakan ini akan
              menerbitkan nomor kwitansi resmi yang tidak dapat diubah.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Nominal</p>
              <p className="font-mono text-xl font-bold gold-gradient-text">{formatRupiah(biaya.nominal)}</p>
              <p className="text-[11px] italic text-muted-foreground mt-0.5">{terbilang(biaya.nominal)}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Metode Pembayaran <span className="text-rose-500">*</span></Label>
              <Select value={bayarMetode} onValueChange={setBayarMetode}>
                <SelectTrigger><SelectValue placeholder="Pilih metode" /></SelectTrigger>
                <SelectContent>
                  {METODE_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <span className="flex items-center gap-2">
                        <m.icon className="w-3.5 h-3.5" /> {m.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Diterima Oleh (Nama Petugas Penerima)</Label>
              <Input
                value={bayarDiterimaOleh}
                onChange={(e) => setBayarDiterimaOleh(e.target.value)}
                placeholder={petugasNama || "Nama petugas yang menerima pembayaran"}
              />
              <p className="text-[10px] text-muted-foreground">
                Default: nama Anda. Edit jika diterima oleh petugas lain.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Catatan (opsional)</Label>
              <Textarea
                value={bayarCatatan}
                onChange={(e) => setBayarCatatan(e.target.value)}
                placeholder="Catatan tambahan terkait pembayaran..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBayarOpen(false)}>Batal</Button>
            <Button
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:opacity-90"
              disabled={bayarLoading}
              onClick={handleBayar}
            >
              {bayarLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Konfirmasi & Terbitkan Kwitansi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Batal Bayar Dialog ===== */}
      <AlertDialog open={batalOpen} onOpenChange={setBatalOpen}>
        <AlertDialogContent className="glass-card navy-glow border-rose-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              Batalkan Pembayaran?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan mengubah status biaya kembali ke <strong>BELUM LUNAS</strong>,
              menghapus tanggal pembayaran, dan membebaskan nomor kwitansi
              <span className="font-mono font-semibold"> {biaya.nomorKwitansi}</span>. Nomor
              kwitansi yang dibebaskan tidak akan digunakan kembali (tercatat di audit log).
              Tindakan ini hanya dapat dilakukan oleh Admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 py-2">
            <Label className="text-xs">Alasan Pembatalan (opsional, tercatat di audit log)</Label>
            <Textarea
              value={batalAlasan}
              onChange={(e) => setBatalAlasan(e.target.value)}
              placeholder="Contoh: kesalahan input metode pembayaran, perlu re-input..."
              rows={2}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              disabled={batalLoading}
              onClick={(e) => { e.preventDefault(); handleBatalBayar(); }}
            >
              {batalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Ya, Batalkan Pembayaran
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== Kwitansi (Printable Receipt) Dialog ===== */}
      <Dialog open={kwitansiOpen} onOpenChange={setKwitansiOpen}>
        <DialogContent
          className="glass-card navy-glow border-primary/20 max-w-[900px] w-full max-h-[95vh] overflow-y-auto tanda-terima-printable print:!max-h-[999999px] print:!overflow-visible print:!max-w-full print:!w-full print:!p-0 print:!static print:!block print:!transform-none print:!bg-white print:!text-black print:!border-0 print:!shadow-none"
          showCloseButton={false}
        >
          <DialogHeader className="no-print">
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" /> Kwitansi Pembayaran
            </DialogTitle>
            <DialogDescription>
              Pratinjau kwitansi pembayaran resmi. Klik &quot;Cetak / Print&quot; untuk mencetak
              atau menyimpan sebagai PDF.
            </DialogDescription>
          </DialogHeader>

          {kwitansiQrLoading && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground no-print">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              Memuat QR verifikasi kwitansi...
            </div>
          )}

          <KwitansiPembayaran
            data={{
              nomorKwitansi: biaya.nomorKwitansi,
              nominal: biaya.nominal,
              keterangan: biaya.keterangan,
              metodePembayaran: biaya.metodePembayaran,
              tanggalBayar: biaya.tanggalBayar,
              tanggalJatuhTempo: biaya.tanggalJatuhTempo,
              diterimaOleh: biaya.diterimaOleh,
              catatan: biaya.catatan,
              nomorRegister,
              pemohonNama,
              pemohonNik,
              pemohonAlamat,
              pemohonHp,
              jenisSuratNama,
              keperluan,
              statusSaatIni,
              petugasNama,
              petugasJabatan,
            } as KwitansiData}
            qrDataUrl={kwitansiQr}
          />

          <DialogFooter className="no-print">
            <Button variant="outline" onClick={() => setKwitansiOpen(false)}>
              Tutup
            </Button>
            <Button
              className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" /> Cetak / Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================================================
   BiayaForm — shared between create and edit modes
   ============================================================ */
function BiayaForm({
  form,
  setForm,
  nominalNum,
  terbilangStr,
}: {
  form: { nominal: string; keterangan: string; tanggalJatuhTempo: string; catatan: string };
  setForm: React.Dispatch<React.SetStateAction<{ nominal: string; keterangan: string; tanggalJatuhTempo: string; catatan: string }>>;
  nominalNum: number;
  terbilangStr: string;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Nominal Biaya (Rupiah) <span className="text-rose-500">*</span></Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">Rp</span>
          <Input
            value={form.nominal}
            onChange={(e) => {
              // Strip non-digits, then reformat with thousand separators
              const raw = e.target.value.replace(/[^\d]/g, "");
              if (!raw) {
                setForm((f) => ({ ...f, nominal: "" }));
                return;
              }
              const formatted = parseInt(raw, 10).toLocaleString("id-ID");
              setForm((f) => ({ ...f, nominal: formatted }));
            }}
            inputMode="numeric"
            placeholder="0"
            className="pl-9 font-mono"
          />
        </div>
        {nominalNum > 0 && (
          <p className="text-[11px] italic text-muted-foreground">
            Terbilang: &ldquo;{terbilangStr}&rdquo;
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Keterangan</Label>
        <Textarea
          value={form.keterangan}
          onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
          placeholder="Contoh: Biaya pengukuran, biaya administrasi, biaya materai..."
          rows={2}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Jatuh Tempo (opsional)
          </Label>
          <Input
            type="date"
            value={form.tanggalJatuhTempo}
            onChange={(e) => setForm((f) => ({ ...f, tanggalJatuhTempo: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Catatan (opsional)</Label>
        <Textarea
          value={form.catatan}
          onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
          placeholder="Catatan internal terkait biaya ini..."
          rows={2}
        />
      </div>
    </div>
  );
}
