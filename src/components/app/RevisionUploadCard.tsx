"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  UploadCloud, X, FileText, ImageIcon, Loader2, Trash2, AlertCircle, CheckCircle2,
  RefreshCw, Info, FileCheck2, MessageSquare, FolderOpen,
} from "lucide-react";
import { JENIS_DOKUMEN, KATEGORI_DOKUMEN, DOKUMEN_BY_KATEGORI } from "@/lib/constants";
import type { RevisiDokumenItem } from "@/lib/types";

/* ============================================================
   RevisionUploadCard

   Public component shown on the tracking page when status
   === "REVISI". Lets the pemohon (citizen) upload the
   requested documents directly without logging in.

   Props:
   - registerNumber: the permohonan's nomorRegister
   - initialDocs: already-uploaded revision docs (from tracking API)
   - onRefresh: optional callback to re-fetch tracking data
   ============================================================ */

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 20;

interface QueueItem {
  id: string;
  file: File;
  preview?: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

function formatBytes(n: number | null | undefined): string {
  if (n == null) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function isImage(mime?: string | null): boolean {
  return !!mime && mime.startsWith("image/");
}

function formatDate(d?: string | null): string {
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

export function RevisionUploadCard({
  registerNumber,
  pemohonNama,
  catatanPerbaikan,
  initialDocs = [],
  onRefresh,
}: {
  registerNumber: string;
  pemohonNama: string;
  catatanPerbaikan?: string | null;
  initialDocs?: RevisiDokumenItem[];
  onRefresh?: () => void;
}) {
  // Group jenisDokumen options by kategori for nicer UI
  const [selectedJenis, setSelectedJenis] = useState<string>(JENIS_DOKUMEN[0].kode);
  const [catatan, setCatatan] = useState("");

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<RevisiDokumenItem[]>(initialDocs);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync docs when parent passes new initial docs
  useEffect(() => {
    setUploadedDocs(initialDocs);
  }, [initialDocs]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      queue.forEach((q) => q.preview && URL.revokeObjectURL(q.preview));
    };
  }, [queue]);

  const selectedJenisDef = JENIS_DOKUMEN.find((j) => j.kode === selectedJenis);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    const items: QueueItem[] = [];
    for (const file of arr) {
      if (file.size > MAX_SIZE) {
        toast.error(`"${file.name}" melebihi 10 MB dan tidak ditambahkan`);
        continue;
      }
      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      items.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        preview,
        status: "pending",
      });
    }
    if (items.length) {
      setQueue((q) => {
        const next = [...q, ...items];
        if (next.length > MAX_FILES) {
          toast.error(`Maksimal ${MAX_FILES} file dalam antrian. File berlebih diabaikan.`);
          return next.slice(0, MAX_FILES);
        }
        return next;
      });
    }
  }, []);

  const removeQueueItem = (id: string) => {
    setQueue((q) => {
      const item = q.find((x) => x.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return q.filter((x) => x.id !== id);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = "";
  };

  const uploadAll = async () => {
    const pending = queue.filter((q) => q.status === "pending");
    if (pending.length === 0) {
      toast.info("Tidak ada file baru untuk diunggah");
      return;
    }
    setUploading(true);
    setQueue((q) => q.map((item) => (item.status === "pending" ? { ...item, status: "uploading" } : item)));

    try {
      const fd = new FormData();
      for (const p of pending) fd.append("files", p.file);
      fd.append("jenisDokumen", selectedJenis);
      if (catatan.trim()) fd.append("catatan", catatan.trim());

      const r = await api.publicRevisiUpload(registerNumber, fd);
      const successNames = new Set((r.dokumen || []).map((d: any) => d.namaFile));
      const errorMap = new Map((r.errors || []).map((e: any) => [e.namaFile, e.error]));

      setQueue((q) =>
        q.map((item) => {
          if (item.status !== "uploading") return item;
          if (successNames.has(item.file.name)) {
            return { ...item, status: "done" };
          }
          return { ...item, status: "error", error: errorMap.get(item.file.name) || "Gagal" };
        })
      );

      // Append newly uploaded docs to the uploadedDocs state
      if (r.dokumen?.length) {
        setUploadedDocs((prev) => [...r.dokumen, ...prev]);
      }

      const okCount = r.count || 0;
      const failCount = (r.total || 0) - okCount;
      if (okCount > 0) {
        toast.success(
          `${okCount} file berhasil diunggah. Petugas akan memverifikasi dokumen Anda.`
        );
      }
      if (failCount > 0) {
        toast.error(`${failCount} file gagal diunggah`);
      }
      // Clear catatan after successful upload
      if (okCount > 0) setCatatan("");
      onRefresh?.();
      // remove done items after short delay
      setTimeout(() => {
        setQueue((q) => {
          q.filter((x) => x.status === "done").forEach((x) => x.preview && URL.revokeObjectURL(x.preview));
          return q.filter((x) => x.status !== "done");
        });
      }, 1800);
    } catch (e: any) {
      toast.error(e.message || "Gagal mengunggah dokumen");
      setQueue((q) =>
        q.map((item) => (item.status === "uploading" ? { ...item, status: "error", error: e.message } : item))
      );
    } finally {
      setUploading(false);
    }
  };

  const pendingCount = queue.filter((q) => q.status === "pending").length;
  const uploadingCount = queue.filter((q) => q.status === "uploading").length;

  return (
    <Card className="glass-card border-orange-500/40 overflow-hidden animate-fade-in-up">
      {/* Amber gradient header bar */}
      <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300" />
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-500/15 border border-orange-500/40 flex items-center justify-center shrink-0">
            <UploadCloud className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2 flex-wrap">
              Unggah Dokumen Perbaikan
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-orange-500/40 text-orange-400 bg-orange-500/10">
                Pemohon
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Yth. <span className="font-medium text-foreground/80">{pemohonNama}</span> — Silakan unggah dokumen
              yang diminta petugas. Dokumen akan diteruskan untuk diverifikasi.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Petugas's revision note */}
        {catatanPerbaikan && (
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3">
            <p className="text-xs font-semibold text-orange-300 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Catatan dari Petugas
            </p>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{catatanPerbaikan}</p>
          </div>
        )}

        {/* Already uploaded docs summary */}
        {uploadedDocs.length > 0 && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
            <p className="text-xs font-semibold text-emerald-300 mb-2 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5" /> Dokumen Sudah Diunggah ({uploadedDocs.length})
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1 notif-scroll">
              {uploadedDocs.map((d) => {
                const img = isImage(d.mimeType) || (d.filePath && /\.(jpg|jpeg|png|gif|webp)$/i.test(d.filePath));
                const jd = JENIS_DOKUMEN.find((j) => j.kode === d.jenisDokumen);
                return (
                  <div
                    key={d.id}
                    className="group relative rounded-lg overflow-hidden border border-border/50 bg-secondary/30 hover:border-emerald-500/40 transition-colors"
                  >
                    <a
                      href={d.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                      title={d.namaFile}
                    >
                      <div className="aspect-square bg-background flex items-center justify-center overflow-hidden">
                        {img && d.filePath ? (
                          <img
                            src={d.filePath}
                            alt={d.namaFile}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        ) : (
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                    </a>
                    <div className="p-1.5">
                      <p className="text-[10px] font-medium truncate" title={d.namaFile}>{d.namaFile}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {jd?.nama || d.jenisDokumen} · {formatBytes(d.ukuran)}
                      </p>
                      <p className="text-[9px] text-muted-foreground/70">{formatDate(d.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {uploadedDocs.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-300/80">
                <Info className="w-3 h-3" />
                <span>
                  Total {uploadedDocs.length} dokumen perbaikan sudah diterima. Petugas akan memverifikasi dan
                  melanjutkan proses permohonan Anda.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Upload form */}
        <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 space-y-3">
          {/* Jenis dokumen selector */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5" /> Jenis Dokumen
            </Label>
            <Select value={selectedJenis} onValueChange={setSelectedJenis}>
              <SelectTrigger className="h-10 bg-background/60">
                <SelectValue placeholder="Pilih jenis dokumen" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {KATEGORI_DOKUMEN.map((kat) => {
                  const jenisInKat = DOKUMEN_BY_KATEGORI[kat.kode] || [];
                  if (jenisInKat.length === 0) return null;
                  return (
                    <div key={kat.kode}>
                      <div
                        className="px-2 py-1.5 text-[10px] uppercase tracking-wider font-semibold"
                        style={{ color: kat.warna }}
                      >
                        {kat.label}
                      </div>
                      {jenisInKat.map((j) => (
                        <SelectItem key={j.kode} value={j.kode}>
                          <span className="flex items-center gap-2">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: kat.warna }}
                            />
                            {j.nama}
                            {j.multi && (
                              <span className="text-[9px] text-muted-foreground">(multi)</span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </div>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedJenisDef && (
              <p className="text-[10px] text-muted-foreground">
                Format: {selectedJenisDef.accept.includes("image") && selectedJenisDef.accept.includes("pdf")
                  ? "Gambar (JPG/PNG) atau PDF"
                  : selectedJenisDef.accept.includes("image")
                  ? "Gambar (JPG/PNG)"
                  : "PDF"}{" "}
                · Maks 10 MB/file
              </p>
            )}
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
            className={`group relative cursor-pointer rounded-xl border-2 border-dashed transition-all p-5 text-center ${
              dragging
                ? "border-orange-500 bg-orange-500/10 scale-[1.01]"
                : "border-border/60 hover:border-orange-500/50 hover:bg-orange-500/5"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={selectedJenisDef?.accept || "image/*,application/pdf"}
              multiple
              onChange={handleSelect}
              className="hidden"
            />
            <div className="mx-auto w-11 h-11 rounded-full flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 bg-orange-500/10 border border-orange-500/30">
              <UploadCloud className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-sm font-medium">
              Tarik &amp; lepas file di sini, atau{" "}
              <span className="text-orange-400 font-semibold">klik untuk memilih</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Bisa pilih banyak file sekaligus · Maks {MAX_FILES} file · 10 MB/file
            </p>
          </div>

          {/* Optional catatan from pemohon */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Catatan untuk Petugas{" "}
              <span className="text-muted-foreground/60 font-normal">(opsional)</span>
            </Label>
            <Textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Berikut KTP dan SPPT PBB yang diminta..."
              rows={2}
              maxLength={500}
              className="text-sm resize-none bg-background/60"
            />
            <p className="text-[10px] text-muted-foreground text-right">{catatan.length}/500</p>
          </div>

          {/* Queue */}
          {queue.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground font-medium">Antrian unggahan:</p>
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-secondary/30"
                >
                  <div className="w-10 h-10 rounded-md overflow-hidden border border-border/50 bg-background flex items-center justify-center shrink-0">
                    {item.preview ? (
                      <img src={item.preview} alt={item.file.name} className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.file.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatBytes(item.file.size)}</p>
                  </div>
                  {item.status === "uploading" && (
                    <Loader2 className="w-4 h-4 animate-spin text-orange-400 shrink-0" />
                  )}
                  {item.status === "done" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                  {item.status === "error" && (
                    <span className="flex items-center gap-1 text-[10px] text-destructive shrink-0" title={item.error}>
                      <AlertCircle className="w-3.5 h-3.5" /> Gagal
                    </span>
                  )}
                  {item.status === "pending" && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeQueueItem(item.id); }}
                      className="text-muted-foreground hover:text-destructive shrink-0 p-1"
                      title="Hapus dari antrian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {pendingCount > 0 && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <p className="text-[11px] text-muted-foreground">
                    {pendingCount} file siap diunggah
                    {uploadingCount > 0 ? ` · ${uploadingCount} sedang diunggah...` : ""}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={uploadAll}
                    disabled={uploading}
                    className="h-8 text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90 border-0"
                  >
                    {uploading ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Unggah {pendingCount} File
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info / help */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-[11px] text-foreground/70 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p>
              Setelah unggahan diterima, petugas akan memverifikasi dokumen Anda dan melanjutkan proses permohonan.
              Anda dapat memantau perkembangannya melalui halaman ini.
            </p>
            <p className="text-muted-foreground">
              Butuh bantuan? Hubungi kelurahan dengan membawa tanda terima dan dokumen asli Anda.
            </p>
          </div>
        </div>

        {onRefresh && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Muat ulang data
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RevisionUploadCard;
