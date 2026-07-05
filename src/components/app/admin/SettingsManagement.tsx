"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { SectionHeader } from "@/components/app/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Settings,
  Building2,
  Phone,
  Mail,
  Hash,
  Cog,
  Bell,
  Ruler,
  Stamp,
  HardDriveUpload,
  FileDigit,
  LayoutTemplate,
  Type,
  Save,
  Loader2,
  Eye,
  Globe,
  ShieldCheck,
  Shuffle,
} from "lucide-react";

/* ============================================================
   Default values for all settings keys
   ============================================================ */
const DEFAULTS: Record<string, string> = {
  nama_kelurahan: "Kelurahan Kuala Pembuang II",
  alamat_kelurahan: "Jl. Raya Kuala Pembuang, Seruyan Hilir, Kalimantan Tengah",
  telepon_kelurahan: "(0532) 123456",
  email_kelurahan: "kppi@seruyankab.go.id",
  kode_pos: "74214",
  maintenance_mode: "false",
  auto_notify: "true",
  require_pengukuran: "true",
  require_ttd_camat: "false",
  max_upload_size_mb: "10",
  register_prefix: "KPII-TNH",
  register_digit_count: "8",
  register_use_random: "true",
  app_name: "SI-TRACK TANAH",
  app_subtitle: "Kelurahan Kuala Pembuang II",
};

/* ============================================================
   Field definitions for each section
   ============================================================ */
interface FieldDef {
  key: string;
  label: string;
  description?: string;
  icon: any;
  type: "text" | "number" | "switch";
  placeholder?: string;
}

const KELURAHAN_FIELDS: FieldDef[] = [
  { key: "nama_kelurahan", label: "Nama Kelurahan", icon: Building2, type: "text", placeholder: "Nama kelurahan" },
  { key: "alamat_kelurahan", label: "Alamat", icon: Globe, type: "text", placeholder: "Alamat lengkap" },
  { key: "telepon_kelurahan", label: "Telepon", icon: Phone, type: "text", placeholder: "Nomor telepon" },
  { key: "email_kelurahan", label: "Email", icon: Mail, type: "text", placeholder: "Alamat email" },
  { key: "kode_pos", label: "Kode Pos", icon: Hash, type: "text", placeholder: "Kode pos" },
];

const SYSTEM_FIELDS: FieldDef[] = [
  { key: "maintenance_mode", label: "Mode Maintenance", description: "Aktifkan mode maintenance untuk menonaktifkan akses publik", icon: Cog, type: "switch" },
  { key: "auto_notify", label: "Notifikasi Otomatis", description: "Kirim notifikasi otomatis saat status permohonan berubah", icon: Bell, type: "switch" },
  { key: "require_pengukuran", label: "Wajib Pengukuran Tanah", description: "Wajibkan proses pengukuran tanah sebelum pembuatan surat", icon: Ruler, type: "switch" },
  { key: "require_ttd_camat", label: "Wajib TTD Camat", description: "Wajibkan tanda tangan Camat sebelum surat selesai", icon: Stamp, type: "switch" },
  { key: "max_upload_size_mb", label: "Batas Upload (MB)", description: "Ukuran maksimum file yang dapat diunggah", icon: HardDriveUpload, type: "number", placeholder: "10" },
];

const REGISTER_FIELDS: FieldDef[] = [
  { key: "register_prefix", label: "Prefix Nomor Register", description: "Awalan nomor register surat", icon: FileDigit, type: "text", placeholder: "KPII-TNH" },
  { key: "register_use_random", label: "Mode Acak (Anti-Tebak)", description: "Gunakan token acak alfanumerik agar nomor register tidak mudah ditebak/ditebus. Disarankan AKTIF untuk privasi pemohon.", icon: ShieldCheck, type: "switch" },
  { key: "register_digit_count", label: "Panjang Token / Serial", description: "Jumlah karakter token acak (mode acak) atau digit nomor urut (mode berurutan). Min 4, maks 16. Disarankan 8+ untuk mode acak.", icon: Hash, type: "number", placeholder: "8" },
];

const APPEARANCE_FIELDS: FieldDef[] = [
  { key: "app_name", label: "Nama Aplikasi", icon: Type, type: "text", placeholder: "SI-TRACK TANAH" },
  { key: "app_subtitle", label: "Subjudul", icon: LayoutTemplate, type: "text", placeholder: "Kelurahan Kuala Pembuang II" },
];

/* ============================================================
   Reusable setting row
   ============================================================ */
function SettingRow({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  const Icon = field.icon;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
      <div className="flex items-center gap-2.5 sm:w-56 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight">{field.label}</p>
          {field.description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{field.description}</p>
          )}
        </div>
      </div>
      <div className="flex-1 sm:pt-0.5">
        {field.type === "switch" ? (
          <div className="flex items-center gap-3">
            <Switch
              checked={value === "true"}
              onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
            />
            <span className="text-sm text-muted-foreground">
              {value === "true" ? "Aktif" : "Nonaktif"}
            </span>
          </div>
        ) : (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            value={field.type === "number" ? (value || "") : value}
            onChange={(e) => onChange(e.target.value)}
            className="max-w-xs"
          />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Loading skeleton
   ============================================================ */
function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="glass-card border-primary/15">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-48 mb-5" />
            <div className="space-y-5">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-9 w-48 ml-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ============================================================
   Main SettingsManagement component
   ============================================================ */
export function SettingsManagement() {
  const { can } = useAppStore();
  const allowed = can("manage_settings");

  const [settings, setSettings] = useState<Record<string, string>>(DEFAULTS);
  const [initialSettings, setInitialSettings] = useState<Record<string, string>>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Load settings on mount
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.settings();
      const merged = { ...DEFAULTS, ...r.settings };
      setSettings(merged);
      setInitialSettings(merged);
    } catch {
      toast.error("Gagal memuat pengaturan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Check if settings have changed
  const hasChanges = Object.keys(settings).some(
    (k) => settings[k] !== initialSettings[k]
  );

  // Save handler
  const handleSave = async () => {
    setSaving(true);
    try {
      // Only send changed settings
      const changed: Record<string, string> = {};
      for (const [k, v] of Object.entries(settings)) {
        if (v !== initialSettings[k]) {
          changed[k] = v;
        }
      }
      if (Object.keys(changed).length === 0) {
        toast.info("Tidak ada perubahan untuk disimpan");
        setSaving(false);
        return;
      }
      const r = await api.updateSettings(changed);
      const merged = { ...DEFAULTS, ...r.settings };
      setSettings(merged);
      setInitialSettings(merged);
      toast.success("Pengaturan berhasil disimpan");
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  // Save specific section
  const handleSaveSection = async (sectionKeys: string[]) => {
    setSaving(true);
    setActiveSection(sectionKeys[0]);
    try {
      const changed: Record<string, string> = {};
      for (const k of sectionKeys) {
        if (settings[k] !== initialSettings[k]) {
          changed[k] = settings[k];
        }
      }
      if (Object.keys(changed).length === 0) {
        toast.info("Tidak ada perubahan untuk disimpan");
        setSaving(false);
        setActiveSection(null);
        return;
      }
      const r = await api.updateSettings(changed);
      const merged = { ...DEFAULTS, ...r.settings };
      setSettings(merged);
      setInitialSettings(merged);
      toast.success("Pengaturan berhasil disimpan");
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
      setActiveSection(null);
    }
  };

  // Update a setting value
  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Register preview — reflects current settings (random token if random mode on)
  const registerPreview = useMemo(() => {
    const prefix = (settings.register_prefix || "KPII-TNH").trim().toUpperCase() || "KPII-TNH";
    const year = new Date().getFullYear();
    const digits = Math.max(4, Math.min(16, Number(settings.register_digit_count) || 8));
    const useRandom = (settings.register_use_random ?? "true") === "true";
    if (useRandom) {
      const alphabet = "ABCDEFGHJKMNPQRSTVWXYZ23456789"; // no I, L, O, U, 0, 1
      let token = "";
      for (let i = 0; i < digits; i++) {
        token += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      return `${prefix}-${year}-${token}`;
    }
    return `${prefix}-${year}-${"1".padStart(digits, "0")}`;
  }, [settings.register_prefix, settings.register_digit_count, settings.register_use_random]);

  if (!allowed) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <SectionHeader title="Pengaturan Sistem" subtitle="Konfigurasi sistem SI-TRACK TANAH" icon={Settings} />
        <SettingsSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <SectionHeader
        title="Pengaturan Sistem"
        subtitle="Konfigurasi sistem SI-TRACK TANAH"
        icon={Settings}
        action={
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90 shadow-lg shadow-[#d4af37]/20"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Simpan Semua
          </Button>
        }
      />

      {/* Section 1: Informasi Kelurahan */}
      <Card className="glass-card border-primary/15">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-base">Informasi Kelurahan</h3>
          </div>
          <Separator className="opacity-50" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {KELURAHAN_FIELDS.map((field) => (
              <SettingRow
                key={field.key}
                field={field}
                value={settings[field.key] ?? DEFAULTS[field.key]}
                onChange={(v) => updateSetting(field.key, v)}
              />
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={() => handleSaveSection(KELURAHAN_FIELDS.map((f) => f.key))}
              disabled={saving}
              className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
            >
              {saving && activeSection === "nama_kelurahan" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Simpan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Pengaturan Sistem */}
      <Card className="glass-card border-primary/15">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Cog className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-base">Pengaturan Sistem</h3>
          </div>
          <Separator className="opacity-50" />
          <div className="space-y-5">
            {SYSTEM_FIELDS.map((field) => (
              <SettingRow
                key={field.key}
                field={field}
                value={settings[field.key] ?? DEFAULTS[field.key]}
                onChange={(v) => updateSetting(field.key, v)}
              />
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={() => handleSaveSection(SYSTEM_FIELDS.map((f) => f.key))}
              disabled={saving}
              className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
            >
              {saving && activeSection === "maintenance_mode" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Simpan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Format Nomor Register */}
      <Card className="glass-card border-primary/15">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <FileDigit className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-base">Format Nomor Register</h3>
          </div>
          <Separator className="opacity-50" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {REGISTER_FIELDS.map((field) => (
              <SettingRow
                key={field.key}
                field={field}
                value={settings[field.key] ?? DEFAULTS[field.key]}
                onChange={(v) => updateSetting(field.key, v)}
              />
            ))}
          </div>
          {/* Preview */}
          <div className="mt-2 p-4 rounded-lg bg-primary/5 border border-primary/15">
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Pratinjau Nomor Register</span>
              </div>
              {(settings.register_use_random ?? "true") === "true" ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-600 border border-green-500/30">
                  <ShieldCheck className="w-3 h-3" /> Mode Acak Aktif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30">
                  <Shuffle className="w-3 h-3" /> Mode Berurutan
                </span>
              )}
            </div>
            <p className="text-lg font-mono font-bold gold-gradient-text tracking-wide break-all">
              {registerPreview}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              {(settings.register_use_random ?? "true") === "true" ? (
                <>Format: <span className="font-mono">{settings.register_prefix || "KPII-TNH"}-TAHUN-TOKEN_ACAK</span> · Token dihasilkan acak setiap pendaftaran, tidak berurutan, anti-tebak.</>
              ) : (
                <>Format: <span className="font-mono">{settings.register_prefix || "KPII-TNH"}-TAHUN-SERIAL</span> · Nomor urut berurutan (mudah ditebak, kurang privat).</>
              )}
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={() => handleSaveSection(REGISTER_FIELDS.map((f) => f.key))}
              disabled={saving}
              className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
            >
              {saving && activeSection === "register_prefix" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Simpan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Tampilan */}
      <Card className="glass-card border-primary/15">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <LayoutTemplate className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-base">Tampilan</h3>
          </div>
          <Separator className="opacity-50" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {APPEARANCE_FIELDS.map((field) => (
              <SettingRow
                key={field.key}
                field={field}
                value={settings[field.key] ?? DEFAULTS[field.key]}
                onChange={(v) => updateSetting(field.key, v)}
              />
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={() => handleSaveSection(APPEARANCE_FIELDS.map((f) => f.key))}
              disabled={saving}
              className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
            >
              {saving && activeSection === "app_name" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Simpan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
