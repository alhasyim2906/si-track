"use client";

import { useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Upload, FileCheck2, Download, Trash2, Loader2, FileText, Calendar,
  User, Landmark, Archive, AlertCircle, CheckCircle2, FileWarning,
  RefreshCw, Save, Hash, MapPin, FileArchive, Info, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   ArsipTab — embedded inside PermohonanDetail
   Manages the mandatory final surat tanah archive:
   - If arsip doesn't exist: show upload form (file + metadata)
   - If arsip exists: show arsip card (metadata, download, replace, delete)
   - Gates SELESAI: status route rejects SELESAI when no arsip exists
   ============================================================ */

export interface ArsipData {
  id: string;
  permohonanId: string;
  nomorSurat: string | null;
  tanggalTerbit: string | null;
  pejabatPenerbit: string | null;
  jabatanPejabat: string | null;
  nomorLembar: string | null;
  lokasiArsip: string | null;
  catatan: string | null;
  namaFile: string;
  filePath: string;
  ukuran: number | null;
  mimeType: string | null;
  fileHash: string | null;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
}

interface Props {
  permohonanId: string;
  nomorRegister: string;
  statusSaatIni: string;
  arsip: ArsipData | null;
  /** Called after upload/update/delete to refresh parent state */
  onChanged: () => void;
}

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
  if (!n && n !== 0) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function fileIcon(mime?: string | null) {
  if (mime === "application/pdf") return FileText;
  if (mime?.startsWith("image/")) return FileArchive;
  return FileText;
}

const ACCEPTED = ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx";
const MAX_MB = 25;

export function ArsipTab({ permohonanId, nomorRegister, statusSaatIni, arsip, onChanged }: Props) {
  const [uploading, setUploading] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Metadata form (for initial upload and for editing existing arsip metadata)
  const [meta, setMeta] = useState({
    nomorSurat: arsip?.nomorSurat || "",
    tanggalTerbit: arsip?.tanggalTerbit ? arsip.tanggalTerbit.slice(0, 10) : "",
    pejabatPenerbit: arsip?.pejabatPenerbit || "",
    jabatanPejabat: arsip?.jabatanPejabat || "",
    nomorLembar: arsip?.nomorLembar || "",
    lokasiArsip: arsip?.lokasiArsip || "",
    catatan: arsip?.catatan || "",
  });

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Whether status is at or past PEMBUATAN_SURAT (surat can be archived now)
  const canArchive = ["PEMBUATAN_SURAT", "TTD_LURAH", "TTD_CAMAT", "SELESAI"].includes(statusSaatIni);
  const isSelesai = statusSaatIni === "SELESAI";

  const onPickFile = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`Ukuran file melebihi ${MAX_MB}MB`);
      return;
    }
    setPendingFile(f);
  };

  const handleUpload = useCallback(async () => {
    if (!pendingFile) {
      toast.error("Pilih file arsip terlebih dahulu");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", pendingFile);
      fd.append("nomorSurat", meta.nomorSurat);
      fd.append("tanggalTerbit", meta.tanggalTerbit);
      fd.append("pejabatPenerbit", meta.pejabatPenerbit);
      fd.append("jabatanPejabat", meta.jabatanPejabat);
      fd.append("nomorLembar", meta.nomorLembar);
      fd.append("lokasiArsip", meta.lokasiArsip);
      fd.append("catatan", meta.catatan);
      await api.uploadArsip(permohonanId, fd);
      toast.success("Arsip surat tanah berhasil diunggah. Permohonan sekarang dapat diselesaikan.");
      setPendingFile(null);
      onChanged();
    } catch (e: any) {
      toast.error(e?.message || "Gagal mengunggah arsip");
    } finally {
      setUploading(false);
    }
  }, [pendingFile, meta, permohonanId, onChanged]);

  const handleReplaceFile = useCallback(async (f: File) => {
    setReplacing(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      // Keep existing metadata (pass empty strings = unchanged)
      await api.replaceArsipFile(permohonanId, fd);
      toast.success("File arsip berhasil diganti");
      onChanged();
    } catch (e: any) {
      toast.error(e?.message || "Gagal mengganti file arsip");
    } finally {
      setReplacing(false);
    }
  }, [permohonanId, onChanged]);

  const handleSaveMetadata = useCallback(async () => {
    setSavingMeta(true);
    try {
      await api.updateArsipMetadata(permohonanId, {
        nomorSurat: meta.nomorSurat || null,
        tanggalTerbit: meta.tanggalTerbit || null,
        pejabatPenerbit: meta.pejabatPenerbit || null,
        jabatanPejabat: meta.jabatanPejabat || null,
        nomorLembar: meta.nomorLembar || null,
        lokasiArsip: meta.lokasiArsip || null,
        catatan: meta.catatan || null,
      });
      toast.success("Metadata arsip diperbarui");
      onChanged();
    } catch (e: any) {
      toast.error(e?.message || "Gagal memperbarui metadata");
    } finally {
      setSavingMeta(false);
    }
  }, [meta, permohonanId, onChanged]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await api.deleteArsip(permohonanId);
      toast.success("Arsip dihapus. Permohonan tidak dapat diselesaikan sampai arsip diunggah ulang.");
      setConfirmDelete(false);
      onChanged();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus arsip");
    } finally {
      setDeleting(false);
    }
  }, [permohonanId, onChanged]);

  /* ---------- Render: not yet archivable ---------- */
  if (!canArchive && !arsip) {
    return (
      <Card className="glass-card border-primary/15">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/40 border border-border/60 flex items-center justify-center mx-auto mb-3">
            <Archive className="w-5 h-5 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-sm">Arsip Belum Tersedia</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Pengunggahan arsip surat tanah akan tersedia setelah permohonan mencapai tahap{" "}
            <Badge variant="outline" className="text-[10px] mx-0.5">Pembuatan Surat Tanah</Badge>
            atau lebih lanjut. Saat ini permohonan berada di tahap{" "}
            <Badge variant="outline" className="text-[10px] mx-0.5">{statusSaatIni}</Badge>.
          </p>
        </CardContent>
      </Card>
    );
  }

  /* ---------- Render: arsip exists ---------- */
  if (arsip) {
    const FileIcon = fileIcon(arsip.mimeType);
    return (
      <div className="space-y-4">
        {/* Compliance banner — green when SELESAI, amber when pending */}
        {isSelesai ? (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-[11px] leading-snug">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">Arsip Lengkap — Surat Selesai</span>
              <p className="text-muted-foreground mt-0.5">
                Dokumen final surat tanah telah diarsipkan. Pemohon dapat mengunduh salinan digital melalui halaman
                pelacakan publik menggunakan Nomor Register.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-[11px] leading-snug">
              <span className="font-semibold text-amber-700 dark:text-amber-400">Arsip Sudah Diunggah</span>
              <p className="text-muted-foreground mt-0.5">
                Dokumen final surat tanah sudah diarsipkan. Permohonan sekarang siap untuk diselesaikan (status{" "}
                <Badge variant="outline" className="text-[10px] mx-0.5 px-1 py-0">SELESAI</Badge>).
              </p>
            </div>
          </div>
        )}

        {/* Arsip card */}
        <Card className="glass-card border-primary/15">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center shrink-0">
                  <FileIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    Arsip Surat Tanah
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] px-1.5 py-0">
                      <CheckCircle2 className="w-3 h-3 mr-0.5" /> Aktif
                    </Badge>
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {arsip.namaFile} · {formatBytes(arsip.ukuran)}
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="shrink-0 h-8">
                <a href={arsip.filePath} download={arsip.namaFile} target="_blank" rel="noopener noreferrer">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Unduh
                </a>
              </Button>
            </div>

            {/* Metadata grid */}
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2 p-3 rounded-lg bg-background/40 border border-border/40">
              <MetaRow icon={Hash} label="Nomor Surat" value={arsip.nomorSurat} mono />
              <MetaRow icon={Calendar} label="Tanggal Terbit" value={formatDate(arsip.tanggalTerbit)} />
              <MetaRow icon={User} label="Pejabat Penerbit" value={arsip.pejabatPenerbit} />
              <MetaRow icon={Landmark} label="Jabatan" value={arsip.jabatanPejabat} />
              <MetaRow icon={Hash} label="Nomor Lembar" value={arsip.nomorLembar} mono />
              <MetaRow icon={MapPin} label="Lokasi Arsip Fisik" value={arsip.lokasiArsip} />
            </div>

            {arsip.catatan && (
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">Catatan Arsip</p>
                <p className="text-xs leading-relaxed">{arsip.catatan}</p>
              </div>
            )}

            {/* Integrity / audit info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                SHA-256: <code className="font-mono text-[10px]">{arsip.fileHash?.slice(0, 16)}…</code>
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Diunggah: {formatDateTime(arsip.uploadedAt)}
              </span>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                disabled={replacing}
                onClick={() => replaceInputRef.current?.click()}
              >
                {replacing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                Ganti File
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={deleting || isSelesai}
                onClick={() => setConfirmDelete(true)}
                title={isSelesai ? "Tidak dapat menghapus arsip setelah permohonan selesai" : "Hapus arsip"}
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
                Hapus
              </Button>
              <input
                ref={replaceInputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleReplaceFile(f);
                  e.target.value = "";
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Metadata editor */}
        <Card className="glass-card border-primary/15">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Save className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Edit Metadata Arsip</h3>
                <p className="text-[10px] text-muted-foreground">Perbarui nomor surat, pejabat, lokasi arsip fisik, dll.</p>
              </div>
            </div>
            <Separator />
            <MetadataForm meta={meta} setMeta={setMeta} />
            <div className="flex justify-end pt-1">
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold"
                disabled={savingMeta}
                onClick={handleSaveMetadata}
              >
                {savingMeta ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                Simpan Metadata
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delete confirmation */}
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Arsip Surat Tanah?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini akan menghapus file arsip <strong>{arsip.namaFile}</strong> beserta seluruh metadata.
                Permohonan <strong>{nomorRegister}</strong> tidak akan dapat diselesaikan (status SELESAI) sampai arsip
                diunggah ulang. Aksi ini dicatat di audit log.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
                Hapus Arsip
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  /* ---------- Render: no arsip yet, show upload form ---------- */
  return (
    <div className="space-y-4">
      {/* Mandatory warning */}
      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
        <div className="text-[11px] leading-snug">
          <span className="font-semibold text-rose-700 dark:text-rose-400">Wajib Diunggah Sebelum Selesai</span>
          <p className="text-muted-foreground mt-0.5">
            Dokumen arsip surat tanah yang sudah jadi (file final yang sudah ditandatangani) wajib diunggah di sini
            sebelum permohonan <strong>{nomorRegister}</strong> dapat dipindahkan ke status{" "}
            <Badge variant="outline" className="text-[10px] mx-0.5 px-1 py-0">SELESAI</Badge>.
            Tanpa arsip, pemohon tidak dapat mengunduh salinan digital surat tanahnya.
          </p>
        </div>
      </div>

      <Card className="glass-card border-primary/15">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <FileArchive className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Unggah Arsip Surat Tanah</h3>
              <p className="text-[11px] text-muted-foreground">File final surat tanah yang sudah ditandatangani + metadata</p>
            </div>
          </div>
          <Separator />

          {/* Drop zone */}
          <div
            className={cn(
              "relative rounded-lg border-2 border-dashed transition-all overflow-hidden",
              "flex items-center justify-center min-h-[140px]",
              dragOver ? "border-primary/60 bg-primary/5 ring-2 ring-primary/20" : "border-border/60 bg-background/40",
              pendingFile && "border-primary/40 bg-primary/5"
            )}
            onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (uploading) return;
              const f = e.dataTransfer.files?.[0];
              if (f) onPickFile(f);
            }}
            onClick={() => !uploading && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            {pendingFile ? (
              <div className="flex items-center gap-3 p-4 w-full">
                <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{pendingFile.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatBytes(pendingFile.size)} · {pendingFile.type || "tipe tidak diketahui"}
                  </p>
                </div>
                <Button
                  size="sm" variant="ghost" className="h-7 px-2 shrink-0"
                  onClick={(e) => { e.stopPropagation(); setPendingFile(null); }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Tarik & lepas file di sini</p>
                  <p className="text-[11px] text-muted-foreground">atau klik untuk memilih · Maks {MAX_MB}MB</p>
                </div>
                <p className="text-[10px] text-muted-foreground">Diterima: PDF, PNG, JPEG, WEBP, DOC, DOCX</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickFile(f);
                e.target.value = "";
              }}
            />
          </div>

          {/* Metadata form */}
          <MetadataForm meta={meta} setMeta={setMeta} />

          {/* Upload action */}
          <div className="flex justify-end pt-1">
            <Button
              className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold"
              disabled={uploading || !pendingFile}
              onClick={handleUpload}
            >
              {uploading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
              Unggah & Arsipkan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============== Sub-components ============== */

function MetaRow({
  icon: Icon, label, value, mono,
}: { icon: any; label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2 py-1">
      <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-medium break-words", mono && "font-mono")}>
          {value || <span className="text-muted-foreground">-</span>}
        </p>
      </div>
    </div>
  );
}

function MetadataForm({
  meta, setMeta,
}: {
  meta: {
    nomorSurat: string; tanggalTerbit: string; pejabatPenerbit: string;
    jabatanPejabat: string; nomorLembar: string; lokasiArsip: string; catatan: string;
  };
  setMeta: (m: any) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Info className="w-3 h-3" /> Metadata Surat
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Hash className="w-3 h-3" /> Nomor Surat</Label>
            <Input
              value={meta.nomorSurat}
              onChange={(e) => setMeta({ ...meta, nomorSurat: e.target.value })}
              placeholder="cth: 470/001/SKT/2026"
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Calendar className="w-3 h-3" /> Tanggal Terbit</Label>
            <Input
              type="date"
              value={meta.tanggalTerbit}
              onChange={(e) => setMeta({ ...meta, tanggalTerbit: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><User className="w-3 h-3" /> Pejabat Penerbit</Label>
            <Input
              value={meta.pejabatPenerbit}
              onChange={(e) => setMeta({ ...meta, pejabatPenerbit: e.target.value })}
              placeholder="cth: Budi Santoso, S.Sos"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Landmark className="w-3 h-3" /> Jabatan Pejabat</Label>
            <Input
              value={meta.jabatanPejabat}
              onChange={(e) => setMeta({ ...meta, jabatanPejabat: e.target.value })}
              placeholder="cth: Lurah Kuala Pembuang II"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Hash className="w-3 h-3" /> Nomor Lembar Arsip</Label>
            <Input
              value={meta.nomorLembar}
              onChange={(e) => setMeta({ ...meta, nomorLembar: e.target.value })}
              placeholder="cth: LM-2026-001"
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> Lokasi Arsip Fisik</Label>
            <Input
              value={meta.lokasiArsip}
              onChange={(e) => setMeta({ ...meta, lokasiArsip: e.target.value })}
              placeholder="cth: Lemari A-3, Rak 2"
            />
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Catatan (opsional)</Label>
        <Textarea
          value={meta.catatan}
          onChange={(e) => setMeta({ ...meta, catatan: e.target.value })}
          placeholder="Catatan tambahan tentang arsip ini..."
          className="text-xs min-h-[60px]"
        />
      </div>
    </div>
  );
}
