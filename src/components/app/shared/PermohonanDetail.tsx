"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import {
  STATUS_BY_KODE, JENIS_DOKUMEN, DOKUMEN_BY_KATEGORI, KATEGORI_DOKUMEN, buildStages, nextStatus,
} from "@/lib/constants";
import { SectionHeader } from "@/components/app/StatCard";
import { StatusBadge, PriorityBadge } from "@/components/app/StatusBadge";
import { Timeline, ProgressBar } from "@/components/app/Timeline";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft, Hash, FileText, User, MapPin, Calendar, Clock, Ruler, Stamp,
  AlertCircle, AlertTriangle, XCircle, Loader2, Download, Trash2, Save,
  Upload, QrCode, Copy, CheckCircle2, PenTool, History, RotateCcw, ShieldAlert,
  ChevronRight, FileCheck, FileWarning, Files, MessageSquare,
  Phone, MapPinned, Tag, Gauge, ScanLine, FileType2, Printer,
  ChevronDown, FileImage, IdCard, Home, Compass, Paperclip,
} from "lucide-react";
import { TandaTerima } from "@/components/app/shared/TandaTerima";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlteInfoBox } from "@/components/app/AlteInfoBox";
import { MultiUploadZone, type UploadedDoc } from "@/components/app/shared/MultiUploadZone";

interface DokumenItem {
  id: string;
  jenisDokumen: string;
  namaFile: string;
  filePath?: string;
  ukuran?: number;
  mimeType?: string | null;
  createdAt: string;
}

interface RiwayatEntry {
  id: string;
  statusKode: string;
  statusNama: string;
  catatan: string | null;
  petugas: { name: string; position?: string | null };
  tanggal: string;
}

interface PermohonanDetail {
  id: string;
  nomorRegister: string;
  statusSaatIni: string;
  statusNama?: string;
  statusWarna?: string;
  prioritas: string;
  keperluan: string | null;
  catatan: string | null;
  alasanDitolak: string | null;
  tanggalSelesai: string | null;
  createdAt: string;
  updatedAt: string;
  jenisSurat: {
    id: string; kode: string; nama: string; deskripsi?: string;
    butuhPengukuran: boolean; butuhTtdCamat: boolean;
  };
  creator: { id: string; name: string; position?: string | null } | null;
  // pemohon
  pemohonNik: string;
  pemohonNama: string;
  pemohonTempatLahir: string | null;
  pemohonTanggalLahir: string | null;
  pemohonAlamat: string | null;
  pemohonRt: string | null;
  pemohonRw: string | null;
  pemohonHp: string | null;
  // tanah
  lokasiTanah: string | null;
  tanahRt: string | null;
  tanahRw: string | null;
  luasTanah: string | number | null;
  batasUtara: string | null;
  batasSelatan: string | null;
  batasTimur: string | null;
  batasBarat: string | null;
  statusPenguasaan: string | null;
  dokumen: DokumenItem[];
  riwayat: RiwayatEntry[];
}

const STATUS_PENGUASAAN_OPTIONS = ["Milik Sendiri", "Warisan", "Girik", "Sewa", "Lainnya"];

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

function formatBytes(n?: number | null): string {
  if (!n) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return FileType2;
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return FileImage;
  return Files;
}

function DLRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value || <span className="text-muted-foreground">-</span>}</p>
      </div>
    </div>
  );
}

export function PermohonanDetail() {
  const { selectedPermohonanId, setView, selectPermohonan, can, user } = useAppStore();
  const [permohonan, setPermohonan] = useState<PermohonanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");
  const [revisiOpen, setRevisiOpen] = useState(false);
  const [revisiCatatan, setRevisiCatatan] = useState("");
  const [tolakOpen, setTolakOpen] = useState(false);
  const [alasanTolak, setAlasanTolak] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  // qr state
  const [qrData, setQrData] = useState<{ qr: string; url: string; nomorRegister: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);

  // edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [editSaving, setEditSaving] = useState(false);

  // tanda terima (printable receipt) state
  const [tandaTerimaOpen, setTandaTerimaOpen] = useState(false);

  // collapsible section state
  const [pemohonOpen, setPemohonOpen] = useState(true);
  const [tanahOpen, setTanahOpen] = useState(true);
  const [keperluanOpen, setKeperluanOpen] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!selectedPermohonanId) return;
    setLoading(true);
    setError("");
    try {
      const r = await api.getPermohonan(selectedPermohonanId);
      setPermohonan(r);
    } catch (e: any) {
      setError(e.message || "Gagal memuat detail permohonan");
      toast.error(e.message || "Gagal memuat detail permohonan");
    } finally {
      setLoading(false);
    }
  }, [selectedPermohonanId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const fetchQr = useCallback(async () => {
    if (!selectedPermohonanId || qrData) return;
    setQrLoading(true);
    try {
      const r = await api.getQr(selectedPermohonanId);
      setQrData(r);
    } catch (e: any) {
      toast.error(e.message || "Gagal memuat QR code");
    } finally {
      setQrLoading(false);
    }
  }, [selectedPermohonanId, qrData]);

  const role = user?.role;
  const isPetugasOrAdmin = role === "PETUGAS" || role === "ADMIN";
  const isAtasanOrAdmin = role === "ATASAN" || role === "ADMIN";
  const isAdmin = role === "ADMIN";

  const handleChangeStatus = async (
    body: { statusKode?: string; catatan?: string; alasanDitolak?: string },
    key: string,
    successMsg: string,
  ) => {
    if (!selectedPermohonanId) return;
    setActionLoading(key);
    try {
      await api.changeStatus(selectedPermohonanId, body);
      toast.success(successMsg);
      setCatatan("");
      setRevisiCatatan("");
      setAlasanTolak("");
      setRevisiOpen(false);
      setTolakOpen(false);
      // invalidate qr (status changed → qr may update)
      setQrData(null);
      await fetchDetail();
    } catch (e: any) {
      toast.error(e.message || "Gagal memperbarui status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePermohonan = async () => {
    if (!selectedPermohonanId) return;
    setActionLoading("delete");
    try {
      await api.deletePermohonan(selectedPermohonanId);
      toast.success("Permohonan berhasil dihapus");
      setDeleteOpen(false);
      setView("permohonan");
    } catch (e: any) {
      toast.error(e.message || "Gagal menghapus permohonan");
    } finally {
      setActionLoading(null);
    }
  };

  const openEdit = () => {
    if (!permohonan) return;
    setEditForm({
      pemohonNik: permohonan.pemohonNik || "",
      pemohonNama: permohonan.pemohonNama || "",
      pemohonTempatLahir: permohonan.pemohonTempatLahir || "",
      pemohonTanggalLahir: permohonan.pemohonTanggalLahir || "",
      pemohonAlamat: permohonan.pemohonAlamat || "",
      pemohonRt: permohonan.pemohonRt || "",
      pemohonRw: permohonan.pemohonRw || "",
      pemohonHp: permohonan.pemohonHp || "",
      lokasiTanah: permohonan.lokasiTanah || "",
      tanahRt: permohonan.tanahRt || "",
      tanahRw: permohonan.tanahRw || "",
      luasTanah: permohonan.luasTanah ?? "",
      batasUtara: permohonan.batasUtara || "",
      batasSelatan: permohonan.batasSelatan || "",
      batasTimur: permohonan.batasTimur || "",
      batasBarat: permohonan.batasBarat || "",
      statusPenguasaan: permohonan.statusPenguasaan || "Milik Sendiri",
      keperluan: permohonan.keperluan || "",
      prioritas: permohonan.prioritas || "NORMAL",
    });
    setEditOpen(true);
  };

  const openTandaTerima = () => {
    setTandaTerimaOpen(true);
    // Lazily fetch QR for the receipt if not already cached.
    if (!qrData && selectedPermohonanId) fetchQr();
  };

  const handleEditSave = async () => {
    if (!selectedPermohonanId) return;
    if (!editForm.pemohonNik || !editForm.pemohonNama) {
      toast.error("NIK dan Nama pemohon wajib diisi");
      return;
    }
    setEditSaving(true);
    try {
      const body: Record<string, any> = { ...editForm };
      if (body.luasTanah === "" || body.luasTanah == null) delete body.luasTanah;
      else body.luasTanah = Number(body.luasTanah);
      await api.updatePermohonan(selectedPermohonanId, body);
      toast.success("Data permohonan diperbarui");
      setEditOpen(false);
      await fetchDetail();
    } catch (e: any) {
      toast.error(e.message || "Gagal memperbarui data");
    } finally {
      setEditSaving(false);
    }
  };

  const downloadQr = () => {
    if (!qrData) return;
    const a = document.createElement("a");
    a.href = qrData.qr;
    a.download = `QR-${qrData.nomorRegister}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("QR Code diunduh");
  };

  const copyUrl = async () => {
    if (!qrData) return;
    try {
      await navigator.clipboard.writeText(qrData.url);
      setQrCopied(true);
      toast.success("URL tracking disalin");
      setTimeout(() => setQrCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin URL");
    }
  };

  // ===== Loading state =====
  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-6 space-y-5">
        <Button variant="outline" size="sm" onClick={() => setView("permohonan")}>
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Button>
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !permohonan) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-6 space-y-5">
        <Button variant="outline" size="sm" onClick={() => setView("permohonan")}>
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Button>
        <Card className="glass-card border-destructive/30">
          <CardContent className="p-10 text-center">
            <XCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <h3 className="font-semibold">Gagal Memuat</h3>
            <p className="text-sm text-muted-foreground mt-1">{error || "Permohonan tidak ditemukan"}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchDetail}>
              Coba lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const p = permohonan;
  const stages = buildStages({
    butuhPengukuran: !!p.jenisSurat.butuhPengukuran,
    butuhTtdCamat: !!p.jenisSurat.butuhTtdCamat,
  });
  const currentIndex = stages.indexOf(p.statusSaatIni);
  const safeCurrentIndex = currentIndex < 0 ? 0 : currentIndex;
  const canAdvance = nextStatus(p.statusSaatIni, {
    butuhPengukuran: !!p.jenisSurat.butuhPengukuran,
    butuhTtdCamat: !!p.jenisSurat.butuhTtdCamat,
  }) !== null;

  const isRejected = p.statusSaatIni === "DITOLAK";
  const isRevisi = p.statusSaatIni === "REVISI";
  const isFinal = p.statusSaatIni === "SELESAI" || isRejected;
  const isTtdLurah = p.statusSaatIni === "TTD_LURAH";
  const isTtdCamat = p.statusSaatIni === "TTD_CAMAT";

  // Derived values for AdminLTE info-box widgets on the page header
  const stageProgress =
    stages.length > 0
      ? Math.round(((Math.min(safeCurrentIndex + 1, stages.length)) / stages.length) * 100)
      : 0;
  // Days since the permohonan was created — if already selesai, count up to tanggalSelesai
  const refDateMs = p.tanggalSelesai
    ? new Date(p.tanggalSelesai).getTime()
    : Date.now();
  const daysSinceDibuat = Math.max(
    0,
    Math.floor((refDateMs - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-5">
      <Button variant="outline" size="sm" onClick={() => setView("permohonan")}>
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
      </Button>

      {/* ===== AdminLTE info-box widgets (signature AdminLTE 4 widget) ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <AlteInfoBox
          icon={Clock}
          iconVariant="primary"
          title="Tahap Saat Ini"
          value={p.statusNama || p.statusSaatIni}
          progress={stageProgress}
          progressText={`Tahap ${Math.min(safeCurrentIndex + 1, stages.length)} dari ${stages.length}`}
        />
        <AlteInfoBox
          icon={Files}
          iconVariant="info"
          title="Dokumen"
          value={`${p.dokumen.length} file`}
          progressText="Total dokumen terunggah"
        />
        <AlteInfoBox
          icon={Calendar}
          iconVariant="warning"
          title="Hari Berjalan"
          value={`${daysSinceDibuat} hari`}
          progressText={`Didaftar ${formatDate(p.createdAt)}`}
        />
      </div>

      {/* ===== Header card ===== */}
      <Card className="glass-card border-primary/20 navy-glow overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f]" />
        <CardContent className="p-5 sm:p-6 space-y-5">
          <div className="grid lg:grid-cols-[1fr_auto] gap-5">
            <div className="space-y-3 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-md border border-primary/40 bg-primary/10 text-primary font-bold">
                  <Hash className="w-3.5 h-3.5" />
                  {p.nomorRegister}
                </span>
                <StatusBadge kode={p.statusSaatIni} nama={p.statusNama} size="lg" />
                {p.prioritas && p.prioritas !== "NORMAL" && <PriorityBadge prioritas={p.prioritas} />}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
                  <User className="w-6 h-6 text-primary" />
                  {p.pemohonNama}
                </h1>
                <p className="text-sm text-muted-foreground mt-1 font-mono">{p.pemohonNik}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="truncate">{p.jenisSurat.nama}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Didaftar {formatDate(p.createdAt)}</span>
                </div>
                {p.keperluan && (
                  <div className="flex items-start gap-2 text-muted-foreground sm:col-span-2">
                    <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{p.keperluan}</span>
                  </div>
                )}
                {p.creator && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileCheck className="w-4 h-4 text-primary" />
                    <span>Oleh: {p.creator.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: progress */}
            <div className="lg:w-80 lg:border-l lg:pl-5 lg:border-border/40 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Progress Pemrosesan</p>
              <ProgressBar stages={stages} currentIndex={safeCurrentIndex} />
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted-foreground">Tahap {Math.min(safeCurrentIndex + 1, stages.length)} dari {stages.length}</span>
                {p.tanggalSelesai && (
                  <span className="flex items-center gap-1 text-green-400">
                    <CheckCircle2 className="w-3 h-3" /> Selesai {formatDate(p.tanggalSelesai)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Alert boxes */}
          {isRejected && p.alasanDitolak && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-red-800">Permohonan Ditolak</p>
                <p className="text-sm text-red-700 mt-0.5">{p.alasanDitolak}</p>
              </div>
            </div>
          )}
          {isRevisi && p.catatan && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-800">Perlu Perbaikan</p>
                <p className="text-sm text-amber-700 mt-0.5">{p.catatan}</p>
              </div>
            </div>
          )}

          {/* Action buttons row */}
          {isPetugasOrAdmin && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={openTandaTerima}
                className="gold-border text-primary hover:bg-primary/10"
              >
                <Printer className="w-4 h-4" /> Cetak Tanda Terima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== Tabs ===== */}
      <Tabs defaultValue="linimasa" className="w-full" onValueChange={(v) => { if (v === "qr") fetchQr(); }}>
        <TabsList className="w-full sm:w-auto flex-wrap h-auto p-1">
          <TabsTrigger value="linimasa"><Clock className="w-4 h-4" /> Linimasa</TabsTrigger>
          <TabsTrigger value="data"><FileText className="w-4 h-4" /> Data</TabsTrigger>
          <TabsTrigger value="dokumen">
            <Files className="w-4 h-4" /> Dokumen
            {p.dokumen.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{p.dokumen.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="qr"><QrCode className="w-4 h-4" /> QR Code</TabsTrigger>
          <TabsTrigger value="riwayat"><History className="w-4 h-4" /> Riwayat</TabsTrigger>
        </TabsList>

        {/* ===== Linimasa tab ===== */}
        <TabsContent value="linimasa" className="space-y-4">
          <div className="grid lg:grid-cols-[1fr_360px] gap-4">
            <Card className="glass-card border-primary/15">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Linimasa Proses
                </h3>
                <ScrollArea className="max-h-[480px] pr-3">
                  <Timeline
                    stages={stages}
                    currentIndex={safeCurrentIndex}
                    riwayat={p.riwayat.map((r) => ({ statusKode: r.statusKode, tanggal: r.tanggal }))}
                  />
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Aksi Proses card */}
            {!isFinal && (
              <Card className="glass-card border-primary/15 border-l-4 border-l-primary lg:sticky lg:top-20 h-fit">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <PenTool className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Aksi Proses</h3>
                      <p className="text-[11px] text-muted-foreground">Lanjutkan atau revisi permohonan</p>
                    </div>
                  </div>
                  <Separator />

                  {/* Advance action */}
                  {canAdvance && isPetugasOrAdmin && !isRevisi && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Catatan (opsional)</Label>
                      <Input
                        value={catatan}
                        onChange={(e) => setCatatan(e.target.value)}
                        placeholder="Catatan untuk tahap berikutnya..."
                      />
                      <Button
                        className="w-full bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
                        disabled={actionLoading !== null}
                        onClick={() =>
                          handleChangeStatus(
                            { catatan: catatan.trim() || undefined },
                            "advance",
                            "Permohonan dilanjutkan ke tahap berikutnya",
                          )
                        }
                      >
                        {actionLoading === "advance" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        Lanjut ke Tahap Berikutnya
                      </Button>
                    </div>
                  )}

                  {/* TTD LURAH (Atasan/Admin) */}
                  {isTtdLurah && isAtasanOrAdmin && (
                    <Button
                      className="w-full bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
                      disabled={actionLoading !== null}
                      onClick={() =>
                        handleChangeStatus({}, "approve-lurah", "Permohonan disetujui dan ditandatangani")
                      }
                    >
                      {actionLoading === "approve-lurah" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <PenTool className="w-4 h-4" />
                      )}
                      Setujui & Tanda Tangani
                    </Button>
                  )}

                  {/* TTD CAMAT (Atasan/Admin) */}
                  {isTtdCamat && isAtasanOrAdmin && (
                    <Button
                      className="w-full bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
                      disabled={actionLoading !== null}
                      onClick={() =>
                        handleChangeStatus({}, "approve-camat", "Permohonan disahkan dan diselesaikan")
                      }
                    >
                      {actionLoading === "approve-camat" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Stamp className="w-4 h-4" />
                      )}
                      Sahkan & Selesaikan
                    </Button>
                  )}

                  {/* REVISI: kembalikan ke proses */}
                  {isRevisi && isPetugasOrAdmin && (
                    <Button
                      className="w-full bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
                      disabled={actionLoading !== null}
                      onClick={() =>
                        handleChangeStatus(
                          { statusKode: "CEK_ADMIN" },
                          "restore",
                          "Permohonan dikembalikan ke proses",
                        )
                      }
                    >
                      {actionLoading === "restore" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      Kembalikan ke Proses
                    </Button>
                  )}

                  {/* Revisi & Tolak (PETUGAS/ADMIN) */}
                  {isPetugasOrAdmin && !isFinal && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Button
                          className="w-full alte-btn-warning font-semibold"
                          disabled={actionLoading !== null}
                          onClick={() => setRevisiOpen(true)}
                        >
                          <AlertTriangle className="w-4 h-4" /> Minta Perbaikan (Revisi)
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
                          disabled={actionLoading !== null}
                          onClick={() => setTolakOpen(true)}
                        >
                          <XCircle className="w-4 h-4" /> Tolak Permohonan
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Delete (ADMIN only) */}
                  {isAdmin && (
                    <>
                      <Separator />
                      <Button
                        variant="ghost"
                        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={actionLoading !== null}
                        onClick={() => setDeleteOpen(true)}
                      >
                        <Trash2 className="w-4 h-4" /> Hapus Permohonan
                      </Button>
                    </>
                  )}

                  {isFinal && !isPetugasOrAdmin && !isAtasanOrAdmin && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Permohonan telah mencapai status final.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {isFinal && (
              <Card className="glass-card border-primary/15 h-fit">
                <CardContent className="p-5 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3"
                    style={{
                      backgroundColor: `${STATUS_BY_KODE[p.statusSaatIni]?.warna}20`,
                      border: `1px solid ${STATUS_BY_KODE[p.statusSaatIni]?.warna}50`,
                    }}
                  >
                    {isRejected ? (
                      <XCircle className="w-6 h-6" style={{ color: STATUS_BY_KODE[p.statusSaatIni]?.warna }} />
                    ) : (
                      <CheckCircle2 className="w-6 h-6" style={{ color: STATUS_BY_KODE[p.statusSaatIni]?.warna }} />
                    )}
                  </div>
                  <h3 className="font-semibold">{p.statusNama}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Permohonan telah mencapai status final.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ===== Data tab ===== */}
        <TabsContent value="data" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Data Pemohon */}
            <Collapsible open={pemohonOpen} onOpenChange={setPemohonOpen}>
              <Card className="glass-card border-primary/15">
                <CardContent className="p-5">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between mb-3 cursor-pointer select-none group">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" /> Data Pemohon
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${pemohonOpen ? "rotate-180" : "rotate-0"}`} />
                      </h3>
                      {can("edit_permohonan") && (
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(); }}>
                          <FileWarning className="w-3.5 h-3.5" /> Edit
                        </Button>
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <Separator className="mb-3" />
                  <CollapsibleContent>
                    <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                      <DLRow label="NIK" value={<span className="font-mono">{p.pemohonNik}</span>} icon={Tag} />
                      <DLRow label="Nama Lengkap" value={p.pemohonNama} icon={User} />
                      <DLRow label="Tempat Lahir" value={p.pemohonTempatLahir} icon={MapPin} />
                      <DLRow label="Tanggal Lahir" value={formatDate(p.pemohonTanggalLahir)} icon={Calendar} />
                      <div className="sm:col-span-2">
                        <DLRow label="Alamat" value={p.pemohonAlamat} icon={MapPinned} />
                      </div>
                      <DLRow label="RT" value={p.pemohonRt} icon={MapPin} />
                      <DLRow label="RW" value={p.pemohonRw} icon={MapPin} />
                      <DLRow label="No. HP" value={p.pemohonHp} icon={Phone} />
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>

            {/* Data Tanah */}
            <Collapsible open={tanahOpen} onOpenChange={setTanahOpen}>
              <Card className="glass-card border-primary/15">
                <CardContent className="p-5">
                  <CollapsibleTrigger asChild>
                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-3 cursor-pointer select-none">
                      <MapPin className="w-4 h-4 text-primary" /> Data Tanah
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${tanahOpen ? "rotate-180" : "rotate-0"}`} />
                    </h3>
                  </CollapsibleTrigger>
                  <Separator className="mb-3" />
                  <CollapsibleContent>
                    <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                      <div className="sm:col-span-2">
                        <DLRow label="Lokasi Tanah" value={p.lokasiTanah} icon={MapPin} />
                      </div>
                      <DLRow label="RT" value={p.tanahRt} icon={MapPin} />
                      <DLRow label="RW" value={p.tanahRw} icon={MapPin} />
                      <DLRow
                        label="Luas Tanah"
                        value={p.luasTanah ? `${p.luasTanah} m²` : null}
                        icon={Ruler}
                      />
                      <DLRow label="Status Penguasaan" value={p.statusPenguasaan} icon={ShieldAlert} />
                      <div className="sm:col-span-2 mt-2">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                          <Gauge className="w-3 h-3" /> Batas-batas
                        </p>
                      </div>
                      <DLRow label="Batas Utara" value={p.batasUtara} />
                      <DLRow label="Batas Selatan" value={p.batasSelatan} />
                      <DLRow label="Batas Timur" value={p.batasTimur} />
                      <DLRow label="Batas Barat" value={p.batasBarat} />
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>

            {/* Keperluan & Jenis Surat */}
            <Card className="glass-card border-primary/15 lg:col-span-2">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-primary" /> Keperluan & Jenis Surat
                </h3>
                <Separator className="mb-3" />
                <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                  <DLRow label="Jenis Surat" value={p.jenisSurat.nama} icon={FileText} />
                  <DLRow label="Kode" value={<span className="font-mono text-xs">{p.jenisSurat.kode}</span>} icon={Tag} />
                  {p.jenisSurat.deskripsi && (
                    <div className="sm:col-span-2">
                      <DLRow label="Deskripsi Jenis Surat" value={p.jenisSurat.deskripsi} />
                    </div>
                  )}
                  <DLRow
                    label="Butuh Pengukuran"
                    value={
                      <Badge variant="outline" className={p.jenisSurat.butuhPengukuran
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-400 text-[10px]"
                        : "border-muted-foreground/30 text-muted-foreground text-[10px]"}>
                        <Ruler className="w-3 h-3 mr-1" />
                        {p.jenisSurat.butuhPengukuran ? "Ya" : "Tidak"}
                      </Badge>
                    }
                  />
                  <DLRow
                    label="Butuh TTD Camat"
                    value={
                      <Badge variant="outline" className={p.jenisSurat.butuhTtdCamat
                        ? "border-orange-500/40 bg-orange-500/10 text-orange-400 text-[10px]"
                        : "border-muted-foreground/30 text-muted-foreground text-[10px]"}>
                        <Stamp className="w-3 h-3 mr-1" />
                        {p.jenisSurat.butuhTtdCamat ? "Ya" : "Tidak"}
                      </Badge>
                    }
                  />
                  <div className="sm:col-span-2">
                    <DLRow label="Keperluan" value={p.keperluan} icon={MessageSquare} />
                  </div>
                  <DLRow label="Prioritas" value={
                    p.prioritas && p.prioritas !== "NORMAL"
                      ? <PriorityBadge prioritas={p.prioritas} />
                      : <Badge variant="outline" className="text-[10px]">Normal</Badge>
                  } icon={AlertCircle} />
                  <DLRow label="Dibuat" value={formatDateTime(p.createdAt)} icon={Clock} />
                  <DLRow label="Diperbarui" value={formatDateTime(p.updatedAt)} icon={Clock} />
                  {p.tanggalSelesai && (
                    <DLRow label="Tanggal Selesai" value={formatDate(p.tanggalSelesai)} icon={CheckCircle2} />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== Dokumen tab ===== */}
        <TabsContent value="dokumen" className="space-y-4">
          {/* Summary bar */}
          <Card className="glass-card border-primary/15">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <Files className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Total Dokumen Terunggah</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.dokumen.length} file · {p.dokumen.filter((d) => (d.mimeType || "").startsWith("image")).length} foto · {p.dokumen.filter((d) => (d.mimeType || "").includes("pdf")).length} PDF
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {KATEGORI_DOKUMEN.map((k) => {
                    const count = p.dokumen.filter((d) => {
                      const jd = JENIS_DOKUMEN.find((j) => j.kode === d.jenisDokumen);
                      return jd?.kategori === k.kode;
                    }).length;
                    return (
                      <Badge
                        key={k.kode}
                        variant="outline"
                        className="text-[10px] px-2 py-1"
                        style={{ borderColor: `${k.warna}55`, color: k.warna, backgroundColor: `${k.warna}10` }}
                      >
                        {k.label}: {count}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categorized multi-upload zones */}
          {KATEGORI_DOKUMEN.map((kat) => {
            const jenisInKat = DOKUMEN_BY_KATEGORI[kat.kode] || [];
            const docsInKat = p.dokumen.filter((d) => {
              const jd = JENIS_DOKUMEN.find((j) => j.kode === d.jenisDokumen);
              return jd?.kategori === kat.kode;
            });
            const katIcon = kat.kode === "PEMOHON" ? IdCard : kat.kode === "TANAH" ? Home : kat.kode === "BATAS" ? Compass : Paperclip;
            const KatIcon = katIcon;
            return (
              <Card key={kat.kode} className="glass-card border-primary/15">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2.5 mb-1">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${kat.warna}1a`, border: `1px solid ${kat.warna}40` }}
                    >
                      <KatIcon className="w-4 h-4" style={{ color: kat.warna }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        {kat.label}
                        <Badge variant="secondary" className="text-[10px]">{docsInKat.length}</Badge>
                      </h3>
                      <p className="text-[11px] text-muted-foreground">{kat.deskripsi}</p>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {jenisInKat.map((j) => {
                      const docs = p.dokumen.filter((d) => d.jenisDokumen === j.kode);
                      return (
                        <div
                          key={j.kode}
                          className="rounded-lg border border-border/50 bg-secondary/20 p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs font-medium flex items-center gap-1.5">
                              {j.nama}
                              {j.multi && (
                                <span className="text-[9px] text-primary/70 font-normal">(multi)</span>
                              )}
                            </Label>
                            {docs.length > 0 && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0" style={{ borderColor: `${kat.warna}40`, color: kat.warna }}>
                                {docs.length} file
                              </Badge>
                            )}
                          </div>
                          <MultiUploadZone
                            permohonanId={p.id}
                            jenisDokumen={j.kode}
                            jenisLabel={j.nama}
                            accept={j.accept}
                            accent={kat.warna}
                            uploaded={docs as UploadedDoc[]}
                            canEdit={can("upload_dokumen")}
                            onChanged={fetchDetail}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ===== QR Code tab ===== */}
        <TabsContent value="qr" className="space-y-4">
          <Card className="glass-card border-primary/15">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-1">
                <QrCode className="w-4 h-4 text-primary" /> QR Code Tracking
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Pindai QR code untuk membuka halaman tracking publik permohonan ini.
              </p>
              <Separator className="mb-4" />
              <div className="grid md:grid-cols-[260px_1fr] gap-5 items-start">
                {/* QR image */}
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 rounded-xl bg-white border border-primary/30">
                    {qrLoading ? (
                      <div className="w-48 h-48 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : qrData ? (
                      <img
                        src={qrData.qr}
                        alt={`QR ${p.nomorRegister}`}
                        className="w-48 h-48"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-muted-foreground">
                        <QrCode className="w-16 h-16 opacity-30" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-mono text-center text-muted-foreground">{p.nomorRegister}</p>
                </div>

                {/* Info & actions */}
                <div className="space-y-4">
                  <div className="rounded-lg bg-primary/5 border border-primary/15 p-3">
                    <p className="text-xs font-medium flex items-center gap-1.5 mb-1">
                      <ScanLine className="w-3.5 h-3.5 text-primary" /> URL Tracking Publik
                    </p>
                    <p className="text-sm font-mono break-all">
                      {qrData?.url || "..."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={downloadQr}
                      disabled={!qrData || qrLoading}
                      className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
                    >
                      <Download className="w-4 h-4" /> Download QR
                    </Button>
                    <Button
                      variant="outline"
                      onClick={copyUrl}
                      disabled={!qrData || qrLoading}
                    >
                      {qrCopied ? (
                        <><CheckCircle2 className="w-4 h-4 text-green-400" /> Tersalin</>
                      ) : (
                        <><Copy className="w-4 h-4" /> Salin URL</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={fetchQr}
                      disabled={qrLoading}
                    >
                      <RotateCcw className="w-4 h-4" /> Muat ulang
                    </Button>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 text-xs text-muted-foreground flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p>
                      Catatan: Memindai QR code ini akan membuka halaman tracking publik.
                      Pemohon dapat memantau status surat tanpa perlu login.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Riwayat tab ===== */}
        <TabsContent value="riwayat" className="space-y-4">
          <Card className="glass-card border-primary/15">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-primary" /> Riwayat Pemrosesan
                <Badge variant="secondary" className="ml-1 text-[10px]">{p.riwayat.length}</Badge>
              </h3>
              <Separator className="mb-3" />
              {p.riwayat.length === 0 ? (
                <div className="text-center py-10">
                  <History className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Belum ada riwayat pemrosesan.</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[520px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/60 hover:bg-transparent">
                        <TableHead>Waktu</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Petugas</TableHead>
                        <TableHead>Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {p.riwayat.map((r) => (
                        <TableRow key={r.id} className="border-border/40">
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap align-top">
                            {formatDateTime(r.tanggal)}
                          </TableCell>
                          <TableCell className="align-top">
                            <StatusBadge kode={r.statusKode} nama={r.statusNama} size="sm" />
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{r.petugas?.name || "—"}</span>
                              {r.petugas?.position && (
                                <span className="text-[10px] text-muted-foreground">{r.petugas.position}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs align-top">
                            {r.catatan || <span className="text-muted-foreground/50">—</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== Revisi Dialog ===== */}
      <Dialog open={revisiOpen} onOpenChange={setRevisiOpen}>
        <DialogContent className="glass-card navy-glow border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" /> Minta Perbaikan Dokumen
            </DialogTitle>
            <DialogDescription>
              Permohonan akan dikembalikan ke pemohon untuk diperbaiki. Berikan catatan yang jelas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Catatan Perbaikan (wajib)</Label>
            <Textarea
              value={revisiCatatan}
              onChange={(e) => setRevisiCatatan(e.target.value)}
              placeholder="Contoh: Mohon lengkapi fotokopi KTP dan SPPT PBB..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevisiOpen(false)} disabled={actionLoading === "revisi"}>
              Batal
            </Button>
            <Button
              className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
              disabled={!revisiCatatan.trim() || actionLoading !== null}
              onClick={() =>
                handleChangeStatus(
                  { statusKode: "REVISI", catatan: revisiCatatan.trim() },
                  "revisi",
                  "Permohonan dikembalikan untuk perbaikan",
                )
              }
            >
              {actionLoading === "revisi" ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              Kirim Permintaan Revisi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Tolak Dialog ===== */}
      <Dialog open={tolakOpen} onOpenChange={setTolakOpen}>
        <DialogContent className="glass-card navy-glow border-destructive/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" /> Tolak Permohonan
            </DialogTitle>
            <DialogDescription>
              Tindakan ini bersifat final. Permohonan yang ditolak tidak dapat diproses lagi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Alasan Penolakan (wajib)</Label>
            <Textarea
              value={alasanTolak}
              onChange={(e) => setAlasanTolak(e.target.value)}
              placeholder="Contoh: Dokumen tidak valid, tanah dalam sengketa..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTolakOpen(false)} disabled={actionLoading === "tolak"}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={!alasanTolak.trim() || actionLoading !== null}
              onClick={() =>
                handleChangeStatus(
                  { statusKode: "DITOLAK", alasanDitolak: alasanTolak.trim() },
                  "tolak",
                  "Permohonan ditolak",
                )
              }
            >
              {actionLoading === "tolak" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Tolak Permohonan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete AlertDialog ===== */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="glass-card navy-glow border-destructive/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" /> Hapus Permohonan?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Permohonan dengan nomor register{" "}
              <span className="font-mono font-semibold">{p.nomorRegister}</span> beserta seluruh
              dokumen dan riwayatnya akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading === "delete"}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePermohonan}
              disabled={actionLoading !== null}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {actionLoading === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Ya, Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== Edit Dialog ===== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="glass-card navy-glow border-primary/20 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-primary" /> Edit Data Permohonan
            </DialogTitle>
            <DialogDescription>
              Perbarui data pemohon dan data tanah. Nomor register tidak dapat diubah.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Data Pemohon</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">NIK</Label>
                  <Input value={editForm.pemohonNik || ""} onChange={(e) => setEditForm({ ...editForm, pemohonNik: e.target.value.replace(/[^0-9]/g, "").slice(0, 16) })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nama Lengkap</Label>
                  <Input value={editForm.pemohonNama || ""} onChange={(e) => setEditForm({ ...editForm, pemohonNama: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tempat Lahir</Label>
                  <Input value={editForm.pemohonTempatLahir || ""} onChange={(e) => setEditForm({ ...editForm, pemohonTempatLahir: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tanggal Lahir</Label>
                  <Input type="date" value={editForm.pemohonTanggalLahir || ""} onChange={(e) => setEditForm({ ...editForm, pemohonTanggalLahir: e.target.value })} />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Alamat</Label>
                  <Input value={editForm.pemohonAlamat || ""} onChange={(e) => setEditForm({ ...editForm, pemohonAlamat: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">RT</Label>
                  <Input value={editForm.pemohonRt || ""} onChange={(e) => setEditForm({ ...editForm, pemohonRt: e.target.value.replace(/[^0-9]/g, "").slice(0, 3) })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">RW</Label>
                  <Input value={editForm.pemohonRw || ""} onChange={(e) => setEditForm({ ...editForm, pemohonRw: e.target.value.replace(/[^0-9]/g, "").slice(0, 3) })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">No. HP</Label>
                  <Input value={editForm.pemohonHp || ""} onChange={(e) => setEditForm({ ...editForm, pemohonHp: e.target.value.replace(/[^0-9+]/g, "").slice(0, 15) })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Prioritas</Label>
                  <Select value={editForm.prioritas || "NORMAL"} onValueChange={(v) => setEditForm({ ...editForm, prioritas: v })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="TINGGI">Tinggi</SelectItem>
                      <SelectItem value="MENDESAK">Mendesak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Data Tanah</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Lokasi Tanah</Label>
                  <Input value={editForm.lokasiTanah || ""} onChange={(e) => setEditForm({ ...editForm, lokasiTanah: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">RT (Lokasi)</Label>
                  <Input value={editForm.tanahRt || ""} onChange={(e) => setEditForm({ ...editForm, tanahRt: e.target.value.replace(/[^0-9]/g, "").slice(0, 3) })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">RW (Lokasi)</Label>
                  <Input value={editForm.tanahRw || ""} onChange={(e) => setEditForm({ ...editForm, tanahRw: e.target.value.replace(/[^0-9]/g, "").slice(0, 3) })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Luas Tanah (m²)</Label>
                  <Input type="number" min="0" step="0.01" value={editForm.luasTanah ?? ""} onChange={(e) => setEditForm({ ...editForm, luasTanah: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Status Penguasaan</Label>
                  <Select value={editForm.statusPenguasaan || "Milik Sendiri"} onValueChange={(v) => setEditForm({ ...editForm, statusPenguasaan: v })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_PENGUASAAN_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Batas Utara</Label>
                  <Input value={editForm.batasUtara || ""} onChange={(e) => setEditForm({ ...editForm, batasUtara: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Batas Selatan</Label>
                  <Input value={editForm.batasSelatan || ""} onChange={(e) => setEditForm({ ...editForm, batasSelatan: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Batas Timur</Label>
                  <Input value={editForm.batasTimur || ""} onChange={(e) => setEditForm({ ...editForm, batasTimur: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Batas Barat</Label>
                  <Input value={editForm.batasBarat || ""} onChange={(e) => setEditForm({ ...editForm, batasBarat: e.target.value })} />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Keperluan</Label>
                  <Textarea value={editForm.keperluan || ""} onChange={(e) => setEditForm({ ...editForm, keperluan: e.target.value })} rows={3} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editSaving}>Batal</Button>
            <Button
              className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
              disabled={editSaving}
              onClick={handleEditSave}
            >
              {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Floating Quick-Action Bar (bottom sticky) ===== */}
      {!isFinal && p && (
        <div className="sticky bottom-0 z-30 mt-4 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-white/95 backdrop-blur-sm border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.06)] no-print animate-fade-in-up">
          <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <FileCheck className="w-4 h-4" />
              <span>{p.nomorRegister}</span>
              <StatusBadge kode={p.statusSaatIni} size="sm" />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {isPetugasOrAdmin && !isRevisi && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  disabled={actionLoading !== null}
                  onClick={() => setTolakOpen(true)}
                >
                  <XCircle className="w-3.5 h-3.5" /> Tolak
                </Button>
              )}
              {/* Primary action button based on current status */}
              {canAdvance && isPetugasOrAdmin && !isRevisi && (
                <Button
                  className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90 shadow-md"
                  disabled={actionLoading !== null}
                  onClick={() => handleChangeStatus(
                    { catatan: catatan.trim() || undefined }, "advance",
                    "Permohonan dilanjutkan ke tahap berikutnya"
                  )}
                >
                  {actionLoading === "advance" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  Lanjut ke Tahap Berikutnya
                </Button>
              )}
              {isTtdLurah && isAtasanOrAdmin && (
                <Button
                  className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90 shadow-md"
                  disabled={actionLoading !== null}
                  onClick={() => handleChangeStatus({}, "approve-lurah", "Permohonan disetujui dan ditandatangani")}
                >
                  {actionLoading === "approve-lurah" ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
                  Setujui & Tanda Tangani
                </Button>
              )}
              {isTtdCamat && isAtasanOrAdmin && (
                <Button
                  className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90 shadow-md"
                  disabled={actionLoading !== null}
                  onClick={() => handleChangeStatus({}, "approve-camat", "Permohonan disahkan dan diselesaikan")}
                >
                  {actionLoading === "approve-camat" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stamp className="w-4 h-4" />}
                  Sahkan & Selesaikan
                </Button>
              )}
              {isRevisi && isPetugasOrAdmin && (
                <Button
                  className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90 shadow-md"
                  disabled={actionLoading !== null}
                  onClick={() => handleChangeStatus(
                    { statusKode: "CEK_ADMIN" }, "restore",
                    "Permohonan dikembalikan ke proses"
                  )}
                >
                  {actionLoading === "restore" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  Kembalikan ke Proses
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Tanda Terima (Printable Receipt) Dialog ===== */}
      <Dialog open={tandaTerimaOpen} onOpenChange={setTandaTerimaOpen}>
        <DialogContent
          className="glass-card navy-glow border-primary/20 max-w-[900px] w-full max-h-[95vh] overflow-y-auto tanda-terima-printable print:!max-h-[999999px] print:!overflow-visible print:!max-w-full print:!w-full print:!p-0 print:!static print:!block print:!transform-none print:!bg-white print:!text-black print:!border-0 print:!shadow-none"
          showCloseButton={false}
        >
          <DialogHeader className="no-print">
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-primary" /> Tanda Terima Permohonan
            </DialogTitle>
            <DialogDescription>
              Pratinjau tanda terima. Klik &quot;Cetak / Print&quot; untuk mencetak
              atau menyimpan sebagai PDF.
            </DialogDescription>
          </DialogHeader>

          {qrLoading && !qrData && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground no-print">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              Memuat QR code untuk tanda terima...
            </div>
          )}

          <TandaTerima permohonan={p} qrDataUrl={qrData?.qr || null} />

          <DialogFooter className="no-print">
            <Button variant="outline" onClick={() => setTandaTerimaOpen(false)}>
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

export default PermohonanDetail;
