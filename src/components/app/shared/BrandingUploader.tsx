"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Upload,
  Trash2,
  Loader2,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   BrandingUploader
   A single-asset upload card used in the Settings → Branding
   section. Supports drag-and-drop, click-to-select, file type
   & size validation, live preview, and delete.
   ============================================================ */

export interface BrandingAssetSpec {
  type: string;                 // logo | favicon | app_icon_192 | ...
  label: string;
  description: string;
  recommended: string;
  accept: string;               // HTML accept attr, e.g. "image/png,image/svg+xml"
  maxMb: number;
  previewClass?: string;        // tailwind classes for preview wrapper (size/aspect)
  iconBg?: string;              // tailwind bg class for placeholder icon
}

interface Props {
  spec: BrandingAssetSpec;
  url?: string;                 // current uploaded URL (e.g. /branding/logo-xxxx.png)
  onChange: (newBranding: Record<string, string>) => void;
}

export function BrandingUploader({ spec, url, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const maxBytes = spec.maxMb * 1024 * 1024;

  // Validate file before upload
  const validate = (file: File): string | null => {
    if (file.size > maxBytes) {
      return `Ukuran file ${(file.size / 1024 / 1024).toFixed(2)}MB melebihi batas ${spec.maxMb}MB`;
    }
    // accept attr is comma-separated MIME types or extensions
    const accepts = spec.accept.split(",").map((s) => s.trim().toLowerCase());
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    const ext = fileName.match(/\.([a-z0-9]+)$/)?.[1];
    const ok = accepts.some((a) => {
      if (a.startsWith(".")) return ext === a.slice(1);
      if (a.endsWith("/*")) return fileType.startsWith(a.slice(0, -1));
      return fileType === a;
    });
    if (!ok) return `Tipe file tidak didukung. Diterima: ${spec.accept}`;
    return null;
  };

  const handleUpload = async (file: File) => {
    const err = validate(file);
    if (err) {
      toast.error(err);
      return;
    }
    setUploading(true);
    try {
      const r = await api.uploadBranding(spec.type, file);
      toast.success(`${spec.label} berhasil diperbarui`);
      onChange(r.branding);
      setPendingFile(null);
    } catch (e: any) {
      toast.error(e?.message || `Gagal mengunggah ${spec.label}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!url) return;
    if (!confirm(`Hapus ${spec.label}? Aset akan kembali ke default.`)) return;
    setDeleting(true);
    try {
      const r = await api.deleteBranding(spec.type);
      toast.success(`${spec.label} berhasil dihapus`);
      onChange(r.branding);
    } catch (e: any) {
      toast.error(e?.message || `Gagal menghapus ${spec.label}`);
    } finally {
      setDeleting(false);
    }
  };

  const onFileSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setPendingFile(file);
    void handleUpload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected({ 0: file, length: 1, item: () => file } as unknown as FileList);
  };

  const hasAsset = !!url;

  return (
    <Card
      className={cn(
        "glass-card border-primary/15 overflow-hidden transition-all",
        dragOver && "border-primary/60 ring-2 ring-primary/30"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        if (!uploading) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header: label + recommended */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-sm font-semibold leading-tight">{spec.label}</h4>
            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{spec.description}</p>
          </div>
          {hasAsset && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-600 border border-green-500/30 shrink-0">
              <CheckCircle2 className="w-3 h-3" /> Aktif
            </span>
          )}
        </div>

        {/* Preview / Drop zone */}
        <div
          className={cn(
            "relative rounded-lg border-2 border-dashed border-border/60 bg-background/40",
            "flex items-center justify-center overflow-hidden",
            spec.previewClass || "aspect-square w-full"
          )}
          onClick={() => !uploading && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !uploading) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          {hasAsset ? (
            <img
              src={url}
              alt={spec.label}
              className="w-full h-full object-contain"
            />
          ) : uploading && pendingFile ? (
            <div className="flex flex-col items-center gap-2 p-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-[10px] text-muted-foreground text-center">Mengunggah {pendingFile.name}…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 p-3 text-center">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", spec.iconBg || "bg-primary/10 border border-primary/20")}>
                <ImageIcon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground leading-tight">
                Tarik & lepas atau klik untuk memilih
              </span>
            </div>
          )}

          {/* Upload overlay on hover when there is an existing asset */}
          {hasAsset && !uploading && (
            <div className="absolute inset-0 bg-black/55 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Ganti
              </span>
            </div>
          )}
        </div>

        {/* Specs hint */}
        <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-snug">
          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0 text-amber-500" />
          <span>
            <span className="font-medium">Rekomendasi:</span> {spec.recommended}
            <br />
            <span className="font-medium">Maks:</span> {spec.maxMb}MB · <span className="font-medium">Tipe:</span> {spec.accept}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5 mr-1.5" />
            )}
            {hasAsset ? "Ganti File" : "Unggah File"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            disabled={!hasAsset || deleting}
            onClick={handleDelete}
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={spec.accept}
          className="hidden"
          onChange={(e) => onFileSelected(e.target.files)}
        />
      </CardContent>
    </Card>
  );
}
