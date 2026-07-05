"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  UploadCloud, X, FileText, ImageIcon, Loader2, Plus, Trash2, AlertCircle, CheckCircle2,
} from "lucide-react";

/* ============================================================
   MultiUploadZone
   Drag-and-drop multi-file upload for a specific jenisDokumen.
   Shows selected file queue with per-file upload progress,
   image thumbnails, and a list of already-uploaded docs.

   Props:
   - permohonanId
   - jenisDokumen: kode (e.g. "KTP", "FOTO_BATAS_UTARA")
   - jenisLabel: display label
   - accept: HTML accept attribute
   - accent: hex color for theming the zone
   - uploaded: existing DokumenItem[] for this jenis
   - onChanged: callback after upload/delete to refresh parent
   ============================================================ */

export interface UploadedDoc {
  id: string;
  jenisDokumen: string;
  namaFile: string;
  filePath: string | null;
  ukuran: number | null;
  mimeType: string | null;
  createdAt: string;
}

interface QueueItem {
  id: string;
  file: File;
  preview?: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function formatBytes(n: number | null | undefined): string {
  if (n == null) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function isImage(mime?: string | null): boolean {
  return !!mime && mime.startsWith("image/");
}

export function MultiUploadZone({
  permohonanId,
  jenisDokumen,
  jenisLabel,
  accept = "image/*,application/pdf",
  accent = "#d4af37",
  uploaded = [],
  canEdit = false,
  onChanged,
}: {
  permohonanId: string;
  jenisDokumen: string;
  jenisLabel: string;
  accept?: string;
  accent?: string;
  uploaded?: UploadedDoc[];
  canEdit?: boolean;
  onChanged?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      queue.forEach((q) => q.preview && URL.revokeObjectURL(q.preview));
    };
  }, [queue]);

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
    if (items.length) setQueue((q) => [...q, ...items]);
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
    // reset so same file can be re-selected
    e.target.value = "";
  };

  const uploadAll = async () => {
    const pending = queue.filter((q) => q.status === "pending");
    if (pending.length === 0) return;
    setUploading(true);
    // mark all pending as uploading
    setQueue((q) => q.map((item) => (item.status === "pending" ? { ...item, status: "uploading" } : item)));
    try {
      const files = pending.map((p) => p.file);
      const r = await api.uploadDokumenBatch(permohonanId, files, jenisDokumen);
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

      const okCount = r.count || 0;
      const failCount = (r.total || 0) - okCount;
      if (okCount > 0) {
        toast.success(`${okCount} file ${jenisLabel} berhasil diunggah`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} file gagal diunggah`);
      }
      onChanged?.();
      // remove done items after short delay
      setTimeout(() => {
        setQueue((q) => {
          q.filter((x) => x.status === "done").forEach((x) => x.preview && URL.revokeObjectURL(x.preview));
          return q.filter((x) => x.status !== "done");
        });
      }, 1500);
    } catch (e: any) {
      toast.error(e.message || "Gagal mengunggah");
      setQueue((q) => q.map((item) => (item.status === "uploading" ? { ...item, status: "error", error: e.message } : item)));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (dokId: string, namaFile: string) => {
    try {
      await api.deleteDokumen(permohonanId, dokId);
      toast.success(`"${namaFile}" dihapus`);
      onChanged?.();
    } catch (e: any) {
      toast.error(e.message || "Gagal menghapus");
    }
  };

  const pendingCount = queue.filter((q) => q.status === "pending").length;
  const uploadingCount = queue.filter((q) => q.status === "uploading").length;

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {canEdit && (
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
              ? "border-primary bg-primary/10 scale-[1.01]"
              : "border-border/60 hover:border-primary/50 hover:bg-primary/5"
          }`}
          style={dragging ? { borderColor: accent, backgroundColor: `${accent}14` } : undefined}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            onChange={handleSelect}
            className="hidden"
          />
          <div
            className="mx-auto w-11 h-11 rounded-full flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110"
            style={{ backgroundColor: `${accent}1a`, border: `1px solid ${accent}40` }}
          >
            <UploadCloud className="w-5 h-5" style={{ color: accent }} />
          </div>
          <p className="text-sm font-medium">
            Tarik &amp; lepas file di sini, atau <span style={{ color: accent }} className="font-semibold">klik untuk memilih</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Bisa pilih banyak file sekaligus · Maks 10 MB/file · {accept.includes("image") && accept.includes("pdf") ? "Gambar atau PDF" : accept.includes("image") ? "Gambar (JPG/PNG)" : "PDF"}
          </p>
        </div>
      )}

      {/* Queue (selected files being uploaded) */}
      {queue.length > 0 && (
        <div className="space-y-2">
          {queue.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-secondary/30"
            >
              {/* Thumbnail / icon */}
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
              {/* Status */}
              {item.status === "uploading" && (
                <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
              )}
              {item.status === "done" && (
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              )}
              {item.status === "error" && (
                <span className="flex items-center gap-1 text-[10px] text-destructive shrink-0" title={item.error}>
                  <AlertCircle className="w-3.5 h-3.5" /> Gagal
                </span>
              )}
              {item.status === "pending" && canEdit && (
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

          {/* Upload button */}
          {canEdit && pendingCount > 0 && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-[11px] text-muted-foreground">
                {pendingCount} file siap diunggah{uploadingCount > 0 ? ` · ${uploadingCount} sedang diunggah...` : ""}
              </p>
              <Button
                type="button"
                size="sm"
                onClick={uploadAll}
                disabled={uploading}
                className="h-8 text-xs"
                style={{ backgroundColor: accent, color: "#0a1628" }}
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5 mr-1.5" />}
                Unggah {pendingCount} File
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Already uploaded files */}
      {uploaded.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <ImageIcon className="w-3 h-3" />
            Terunggah ({uploaded.length}):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {uploaded.map((d) => {
              const img = isImage(d.mimeType) || (d.filePath && /\.(jpg|jpeg|png|gif|webp)$/i.test(d.filePath));
              return (
                <div
                  key={d.id}
                  className="group relative rounded-lg overflow-hidden border border-border/50 bg-secondary/30 hover:border-primary/40 transition-colors"
                >
                  <a
                    href={d.filePath || "#"}
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
                    <p className="text-[9px] text-muted-foreground">{formatBytes(d.ukuran)}</p>
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleDelete(d.id, d.namaFile)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/90 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                      title="Hapus file ini"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {uploaded.length === 0 && queue.length === 0 && (
        <p className="text-[11px] text-muted-foreground/60 italic text-center py-1">
          Belum ada file {jenisLabel.toLowerCase()} terunggah
        </p>
      )}
    </div>
  );
}

export default MultiUploadZone;
