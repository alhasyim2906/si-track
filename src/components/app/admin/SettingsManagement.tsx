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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Image as ImageIcon,
  Palette,
  Monitor,
  Smartphone,
  Star,
  Mountain,
  Sparkles,
  RefreshCw,
  Send,
  MessageCircle,
  Key,
  Server,
  TestTube2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { BrandingUploader, type BrandingAssetSpec } from "@/components/app/shared/BrandingUploader";
import { Logo } from "@/components/app/Logo";

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
  // ===== Notification defaults (Task 15) =====
  notify_email_enabled: "true",
  notify_wa_enabled: "true",
  notify_fonnte_token: "",
  notify_email_provider: "log",
  notify_email_from: "",
  notify_email_api_url: "",
  notify_email_api_key: "",
  notify_tpl_selesai_subject: "Surat Tanah Anda Telah Selesai — {nomor_register}",
  notify_tpl_selesai_email:
    "Yth. {pemohon_nama},\n\nKabar baik! Permohonan surat tanah Anda dengan Nomor Register {nomor_register} telah SELESAI diproses.\n\nJenis Surat: {jenis_surat}\nStatus: {status_nama}\nTanggal: {tanggal}\n\nSilakan mengunjungi {kelurahan_nama} untuk mengambil surat Anda. Bawalah tanda terima permohonan dan dokumen identitas asli.\n\nAlamat: {kelurahan_alamat}\nTelepon: {kelurahan_telepon}\nEmail: {kelurahan_email}\n\nTerima kasih atas kepercayaan Anda.\n\nHormat kami,\n{kelurahan_nama}",
  notify_tpl_selesai_wa:
    "*{kelurahan_nama}*\n\nYth. {pemohon_nama},\n\nKabar baik! Permohonan surat tanah Anda dengan Nomor Register *{nomor_register}* telah *SELESAI* diproses.\n\nJenis Surat: {jenis_surat}\nTanggal: {tanggal}\n\nSilakan ambil surat Anda di {kelurahan_alamat}. Bawa tanda terima & KTP asli.\n\nTerima kasih. 🙏",
  notify_tpl_revisi_subject: "Permohonan Surat Tanah Memerlukan Kelengkapan Dokumen — {nomor_register}",
  notify_tpl_revisi_email:
    "Yth. {pemohon_nama},\n\nPermohonan surat tanah Anda dengan Nomor Register {nomor_register} memerlukan kelengkapan dokumen.\n\nJenis Surat: {jenis_surat}\nStatus: {status_nama}\nCatatan: {catatan}\nTanggal: {tanggal}\n\nMohon segera melengkapi dokumen yang diminta dengan mengunjungi {kelurahan_nama} atau menghubungi petugas kami.\n\nAlamat: {kelurahan_alamat}\nTelepon: {kelurahan_telepon}\nEmail: {kelurahan_email}\n\nTerima kasih.\n\nHormat kami,\n{kelurahan_nama}",
  notify_tpl_revisi_wa:
    "*{kelurahan_nama}*\n\nYth. {pemohon_nama},\n\nPermohonan surat tanah Anda dengan Nomor Register *{nomor_register}* memerlukan *kelengkapan dokumen*.\n\nCatatan: {catatan}\nTanggal: {tanggal}\n\nMohon segera lengkapi dokumen yang diminta. Hubungi {kelurahan_telepon} untuk info lebih lanjut.\n\nTerima kasih. 🙏",
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
   Branding asset specs — drives the Branding section UI
   ============================================================ */
const BRANDING_SPECS: BrandingAssetSpec[] = [
  {
    type: "logo",
    label: "Logo Aplikasi",
    description: "Logo utama yang tampil di sidebar, header, dan tanda terima.",
    recommended: "SVG / PNG transparan, rasio 1:1, min 64×64px",
    accept: "image/svg+xml,image/png,image/jpeg,image/webp,image/gif",
    maxMb: 2,
    previewClass: "aspect-square w-full",
    iconBg: "bg-primary/10 border border-primary/20",
  },
  {
    type: "favicon",
    label: "Favicon",
    description: "Ikon kecil pada tab browser dan bookmark.",
    recommended: "ICO / PNG / SVG, 16×16 atau 32×32px",
    accept: "image/svg+xml,image/png,image/x-icon,image/vnd.microsoft.icon,image/jpeg,image/webp",
    maxMb: 1,
    previewClass: "aspect-square w-full max-w-[120px] mx-auto",
    iconBg: "bg-amber-500/10 border border-amber-500/30",
  },
  {
    type: "app_icon_192",
    label: "Ikon PWA 192×192",
    description: "Ikon aplikasi saat diinstal di Android / desktop (kecil).",
    recommended: "PNG 192×192px",
    accept: "image/png,image/jpeg,image/webp",
    maxMb: 1,
    previewClass: "aspect-square w-full max-w-[150px] mx-auto",
    iconBg: "bg-blue-500/10 border border-blue-500/30",
  },
  {
    type: "app_icon_512",
    label: "Ikon PWA 512×512",
    description: "Ikon aplikasi resolusi tinggi (splash screen, Play Store).",
    recommended: "PNG 512×512px",
    accept: "image/png,image/jpeg,image/webp",
    maxMb: 2,
    previewClass: "aspect-square w-full",
    iconBg: "bg-emerald-500/10 border border-emerald-500/30",
  },
  {
    type: "login_bg",
    label: "Background Halaman Login",
    description: "Gambar latar untuk modal login petugas (opsional).",
    recommended: "Lanskap, min 1280×720px",
    accept: "image/png,image/jpeg,image/webp",
    maxMb: 5,
    previewClass: "aspect-video w-full",
    iconBg: "bg-purple-500/10 border border-purple-500/30",
  },
  {
    type: "hero_banner",
    label: "Banner Landing Publik",
    description: "Banner besar di halaman pelacakan publik (opsional).",
    recommended: "Lanskap, min 1600×500px",
    accept: "image/png,image/jpeg,image/webp",
    maxMb: 5,
    previewClass: "aspect-[3/1] w-full",
    iconBg: "bg-rose-500/10 border border-rose-500/30",
  },
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
  const { can, setBranding, setAppName } = useAppStore();
  const allowed = can("manage_settings");

  const [settings, setSettings] = useState<Record<string, string>>(DEFAULTS);
  const [initialSettings, setInitialSettings] = useState<Record<string, string>>(DEFAULTS);
  const [branding, setBrandingState] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Load settings on mount
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [r, b] = await Promise.all([api.settings(), api.getBranding()]);
      const merged = { ...DEFAULTS, ...r.settings };
      setSettings(merged);
      setInitialSettings(merged);
      setBrandingState(b.branding || {});
      setBranding(b.branding || {});
      // sync app name to global store so LogoFull uses the latest
      setAppName(merged.app_name, merged.app_subtitle);
    } catch {
      toast.error("Gagal memuat pengaturan");
    } finally {
      setLoading(false);
    }
  }, [setBranding, setAppName]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Called whenever a branding asset is uploaded / deleted
  const handleBrandingChange = useCallback(
    (newBranding: Record<string, string>) => {
      setBrandingState(newBranding);
      setBranding(newBranding);
    },
    [setBranding]
  );

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
      setAppName(merged.app_name, merged.app_subtitle);
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
      setAppName(merged.app_name, merged.app_subtitle);
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

      {/* Section 5: Branding & Media */}
      <Card className="glass-card border-primary/15">
        <CardContent className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Palette className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base leading-tight">Branding &amp; Media</h3>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                  Unggah logo, favicon, dan aset gambar lainnya. Aset akan langsung tampil di seluruh aplikasi setelah unggah berhasil.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                loadSettings();
                toast.success("Pratinjau branding dimuat ulang");
              }}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Muat Ulang
            </Button>
          </div>
          <Separator className="opacity-50" />

          {/* Live preview header — shows how logo + app name render in the sidebar */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/15">
            <p className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Pratinjau Live — Logo &amp; Nama Aplikasi
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2.5">
                <Logo size={38} src={branding.branding_logo_url} alt="Logo" />
                <div className="flex flex-col leading-tight">
                  <span className="gold-gradient-text font-extrabold tracking-tight text-lg">
                    {settings.app_name || "SI-TRACK TANAH"}
                  </span>
                  <span className="text-[10px] text-muted-foreground tracking-wide uppercase">
                    {settings.app_subtitle || "Kuala Pembuang II"}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {branding.branding_logo_url ? (
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <Sparkles className="w-3 h-3" /> Logo kustom aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <Palette className="w-3 h-3" /> Menggunakan logo default
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Asset grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BRANDING_SPECS.map((spec) => (
              <BrandingUploader
                key={spec.type}
                spec={spec}
                url={branding[`branding_${spec.type}_url`]}
                onChange={handleBrandingChange}
              />
            ))}
          </div>

          {/* PWA manifest note */}
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div className="text-[11px] leading-snug text-muted-foreground">
                <span className="font-semibold text-foreground">Catatan PWA:</span> Ikon PWA 192×192 dan 512×512
                digunakan saat aplikasi diinstal di perangkat (Add to Home Screen). Manifest dihasilkan
                dinamis dari <span className="font-mono text-blue-500">/api/manifest</span> dan ikon akan
                otomatis dipakai setelah unggah.
              </div>
            </div>
          </div>

          {/* Favicon note */}
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-start gap-2">
              <Star className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-[11px] leading-snug text-muted-foreground">
                <span className="font-semibold text-foreground">Catatan Favicon:</span> Setelah mengunggah
                favicon, refresh halaman (Ctrl+R) agar browser memuat ikon baru. Cache browser mungkin
                menyimpan favicon lama selama beberapa jam.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== Section 6: Notifikasi Email & WhatsApp ===== */}
      <NotifySection
        settings={settings}
        updateSetting={updateSetting}
        activeSection={activeSection}
        saving={saving}
        onSaveSection={handleSaveSection}
      />
    </div>
  );
}

/* ============================================================
   Section 6 — Notifikasi Email & WhatsApp (Fonnte)
   ============================================================ */
const NOTIFY_FIELDS = [
  "notify_email_enabled",
  "notify_wa_enabled",
  "notify_fonnte_token",
  "notify_email_provider",
  "notify_email_from",
  "notify_email_api_url",
  "notify_email_api_key",
  "notify_tpl_selesai_subject",
  "notify_tpl_selesai_email",
  "notify_tpl_selesai_wa",
  "notify_tpl_revisi_subject",
  "notify_tpl_revisi_email",
  "notify_tpl_revisi_wa",
];

// Placeholders help text for template editors
const TEMPLATE_VARS = [
  "{nomor_register}", "{pemohon_nama}", "{pemohon_hp}", "{pemohon_email}",
  "{status_nama}", "{catatan}", "{alasan_ditolak}", "{jenis_surat}",
  "{kelurahan_nama}", "{kelurahan_alamat}", "{kelurahan_telepon}", "{kelurahan_email}",
  "{tanggal}", "{app_url}",
];

function NotifySection({
  settings,
  updateSetting,
  activeSection,
  saving,
  onSaveSection,
}: {
  settings: Record<string, string>;
  updateSetting: (key: string, value: string) => void;
  activeSection: string | null;
  saving: boolean;
  onSaveSection: (keys: string[]) => void;
}) {
  const [showToken, setShowToken] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingWa, setTestingWa] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testTarget, setTestTarget] = useState("");
  const [testResult, setTestResult] = useState<
    null | { channel: string; ok: boolean; error?: string; recipient?: string }
  >(null);

  const emailEnabled = (settings.notify_email_enabled ?? "true") === "true";
  const waEnabled = (settings.notify_wa_enabled ?? "true") === "true";
  const fonnteTokenSet = !!(settings.notify_fonnte_token || "").trim();
  const emailProvider = settings.notify_email_provider || "log";

  const handleTest = async (channel: "wa" | "email") => {
    if (channel === "wa" && !fonnteTokenSet) {
      toast.error("Isi dulu Fonnte API Token sebelum menguji WhatsApp");
      return;
    }
    setTestingWa(channel === "wa");
    setTestingEmail(channel === "email");
    setTestResult(null);
    try {
      const r = await api.testNotify(channel, testTarget.trim() || undefined);
      setTestResult({ channel, ok: r.ok, error: r.error, recipient: r.recipient });
      if (r.ok) {
        toast.success(
          `Notifikasi ${channel === "wa" ? "WhatsApp" : "Email"} uji coba berhasil dikirim ke ${r.recipient || testTarget || "(self)"}`
        );
      } else {
        toast.error(`Gagal: ${r.error || "unknown error"}`);
      }
    } catch (e: any) {
      const msg = e?.message || "Network error";
      setTestResult({ channel, ok: false, error: msg });
      toast.error(`Gagal: ${msg}`);
    } finally {
      setTestingWa(false);
      setTestingEmail(false);
    }
  };

  return (
    <Card className="glass-card border-primary/15">
      <CardContent className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Send className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">Notifikasi Email &amp; WhatsApp</h3>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                Kirim notifikasi otomatis ke pemohon saat status berubah menjadi <span className="font-semibold">Perbaikan Dokumen (REVISI)</span> atau <span className="font-semibold">Surat Selesai (SELESAI)</span>. WhatsApp menggunakan <a href="https://fonnte.com" target="_blank" rel="noreferrer" className="text-emerald-500 underline">Fonnte API</a>.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onSaveSection(NOTIFY_FIELDS)}
            disabled={saving}
          >
            {saving && activeSection === "notify_email_enabled" ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            Simpan
          </Button>
        </div>
        <Separator className="opacity-50" />

        {/* ===== Channel toggles ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Notifikasi Email</p>
                  <p className="text-[11px] text-muted-foreground">Kirim email saat REVISI / SELESAI</p>
                </div>
                <Switch
                  checked={emailEnabled}
                  onCheckedChange={(c) => updateSetting("notify_email_enabled", c ? "true" : "false")}
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Notifikasi WhatsApp</p>
                  <p className="text-[11px] text-muted-foreground">Kirim WA via Fonnte saat REVISI / SELESAI</p>
                </div>
                <Switch
                  checked={waEnabled}
                  onCheckedChange={(c) => updateSetting("notify_wa_enabled", c ? "true" : "false")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===== Fonnte config ===== */}
        <div className="p-4 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.03]">
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-4 h-4 text-emerald-500" />
            <p className="text-sm font-semibold">Konfigurasi Fonnte (WhatsApp Gateway)</p>
            {fonnteTokenSet ? (
              <span className="ml-auto text-[10px] font-medium inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> Token aktif
              </span>
            ) : (
              <span className="ml-auto text-[10px] font-medium inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30">
                <XCircle className="w-3 h-3" /> Token belum diisi
              </span>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Fonnte API Token</Label>
            <div className="flex gap-2">
              <Input
                type={showToken ? "text" : "password"}
                value={settings.notify_fonnte_token ?? ""}
                onChange={(e) => updateSetting("notify_fonnte_token", e.target.value)}
                placeholder="Tempel token dari dashboard Fonnte"
                className="font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setShowToken((s) => !s)}
              >
                {showToken ? <Eye className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
                <span className="ml-1.5 text-xs">{showToken ? "Sembunyikan" : "Lihat"}</span>
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Dapatkan token gratis di <a href="https://fonnte.com" target="_blank" rel="noreferrer" className="text-emerald-500 underline">fonnte.com</a> → menu <span className="font-mono">API</span>. Nomor pengirim ditentukan oleh perangkat yang Anda scan-pair di Fonnte.
            </p>
          </div>
        </div>

        {/* ===== Email config ===== */}
        <div className="p-4 rounded-lg border border-blue-500/15 bg-blue-500/[0.03]">
          <div className="flex items-center gap-2 mb-3">
            <Server className="w-4 h-4 text-blue-500" />
            <p className="text-sm font-semibold">Konfigurasi Email (SMTP)</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Provider Email</Label>
              <Select
                value={emailProvider}
                onValueChange={(v) => updateSetting("notify_email_provider", v)}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="log">Log (Dev — tidak benar-benar mengirim)</SelectItem>
                  <SelectItem value="smtp_api">SMTP API Bridge (HTTP → SMTP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email Pengirim (From)</Label>
              <Input
                type="email"
                value={settings.notify_email_from ?? ""}
                onChange={(e) => updateSetting("notify_email_from", e.target.value)}
                placeholder="noreply@kelurahan.go.id"
              />
            </div>
          </div>

          {emailProvider === "smtp_api" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">SMTP API URL (Bridge Endpoint)</Label>
                <Input
                  value={settings.notify_email_api_url ?? ""}
                  onChange={(e) => updateSetting("notify_email_api_url", e.target.value)}
                  placeholder="https://smtp-bridge.example.com/send"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">SMTP API Key (Bearer Token)</Label>
                <div className="flex gap-2">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={settings.notify_email_api_key ?? ""}
                    onChange={(e) => updateSetting("notify_email_api_key", e.target.value)}
                    placeholder="opsional"
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setShowApiKey((s) => !s)}
                  >
                    {showApiKey ? <Eye className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug sm:col-span-2">
                Mode <span className="font-semibold">SMTP API Bridge</span>: sistem akan POST JSON <span className="font-mono">{`{ from, to, subject, html }`}</span> ke URL di atas. Gunakan layanan seperti Mailgun, SendGrid, Resend, atau SMTP2GO yang menyediakan REST API.
              </p>
            </div>
          )}
          {emailProvider === "log" && (
            <p className="text-[11px] text-amber-600 mt-3 leading-snug flex items-start gap-1.5">
              <TestTube2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                <span className="font-semibold">Mode Log aktif:</span> Email tidak benar-benar dikirim — body email hanya dicetak di server log. Berguna untuk development. Untuk produksi, ganti ke <span className="font-semibold">SMTP API Bridge</span>.
              </span>
            </p>
          )}
        </div>

        {/* ===== Test buttons ===== */}
        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 mb-3">
            <TestTube2 className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">Uji Coba Notifikasi</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Tujuan (opsional — kosongkan untuk kirim ke kontak Anda sendiri)</Label>
              <Input
                value={testTarget}
                onChange={(e) => setTestTarget(e.target.value)}
                placeholder="Nomor HP (628xxx) atau email tujuan"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTest("wa")}
                disabled={testingWa || !waEnabled || !fonnteTokenSet}
                className="border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
              >
                {testingWa ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                )}
                Test WA
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTest("email")}
                disabled={testingEmail || !emailEnabled}
                className="border-blue-500/40 text-blue-600 hover:bg-blue-500/10"
              >
                {testingEmail ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                )}
                Test Email
              </Button>
            </div>
          </div>
          {testResult && (
            <div
              className={`mt-3 p-3 rounded-lg border text-[11px] leading-snug ${
                testResult.ok
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
              }`}
            >
              <div className="flex items-start gap-1.5">
                {testResult.ok ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="font-semibold">
                    {testResult.channel === "wa" ? "WhatsApp" : "Email"} —{" "}
                    {testResult.ok ? "BERHASIL" : "GAGAL"}
                  </p>
                  {testResult.recipient && <p>Penerima: {testResult.recipient}</p>}
                  {testResult.error && <p>Error: {testResult.error}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== Template editor ===== */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">Template Pesan</p>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
            Kustomisasi pesan yang dikirim ke pemohon. Gunakan variabel dalam kurung kurawal untuk
            mensubstitusi data pemohon secara otomatis.
          </p>
          {/* Variable chips */}
          <div className="flex flex-wrap gap-1.5 mb-3 p-2.5 rounded-lg bg-muted/30 border border-border/40">
            {TEMPLATE_VARS.map((v) => (
              <code
                key={v}
                className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono border border-primary/20"
                title={`Klik untuk menyalin: ${v}`}
              >
                {v}
              </code>
            ))}
          </div>

          {/* SELESAI templates */}
          <div className="space-y-3">
            <TemplateEditor
              title="1. Surat Selesai — Subject Email"
              hint="Subjek email yang dikirim saat status = SELESAI"
              value={settings.notify_tpl_selesai_subject ?? ""}
              onChange={(v) => updateSetting("notify_tpl_selesai_subject", v)}
              rows={1}
              accent="emerald"
            />
            <TemplateEditor
              title="2. Surat Selesai — Body Email"
              hint="Isi email (teks plain, otomatis dikonversi ke HTML)"
              value={settings.notify_tpl_selesai_email ?? ""}
              onChange={(v) => updateSetting("notify_tpl_selesai_email", v)}
              rows={8}
              accent="emerald"
            />
            <TemplateEditor
              title="3. Surat Selesai — Pesan WhatsApp"
              hint="Pesan WA. Gunakan *teks* untuk bold. Maks 1000 karakter."
              value={settings.notify_tpl_selesai_wa ?? ""}
              onChange={(v) => updateSetting("notify_tpl_selesai_wa", v)}
              rows={6}
              accent="emerald"
            />

            {/* REVISI templates */}
            <TemplateEditor
              title="4. Perbaikan Dokumen — Subject Email"
              hint="Subjek email yang dikirim saat status = REVISI"
              value={settings.notify_tpl_revisi_subject ?? ""}
              onChange={(v) => updateSetting("notify_tpl_revisi_subject", v)}
              rows={1}
              accent="amber"
            />
            <TemplateEditor
              title="5. Perbaikan Dokumen — Body Email"
              hint="Isi email (teks plain, otomatis dikonversi ke HTML)"
              value={settings.notify_tpl_revisi_email ?? ""}
              onChange={(v) => updateSetting("notify_tpl_revisi_email", v)}
              rows={8}
              accent="amber"
            />
            <TemplateEditor
              title="6. Perbaikan Dokumen — Pesan WhatsApp"
              hint="Pesan WA. Gunakan *teks* untuk bold. Maks 1000 karakter."
              value={settings.notify_tpl_revisi_wa ?? ""}
              onChange={(v) => updateSetting("notify_tpl_revisi_wa", v)}
              rows={6}
              accent="amber"
            />
          </div>
        </div>

        {/* Info box — when notifications fire */}
        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <div className="flex items-start gap-2">
            <Bell className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-[11px] leading-snug text-muted-foreground">
              <span className="font-semibold text-foreground">Kapan notifikasi dikirim?</span> Notifikasi
              otomatis dipicu saat petugas mengubah status permohonan menjadi <span className="font-semibold">Perbaikan Dokumen</span> (REVISI)
              atau <span className="font-semibold">Surat Selesai</span> (SELESAI). Kegagalan pengiriman tidak membatalkan perubahan status —
              kegagalan dicatat di Audit Log. Anda juga dapat mengirim ulang notifikasi manual dari halaman detail permohonan.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   Reusable template editor (textarea + label + reset)
   ============================================================ */
function TemplateEditor({
  title,
  hint,
  value,
  onChange,
  rows = 4,
  accent = "primary",
}: {
  title: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  accent?: "primary" | "emerald" | "amber" | "blue";
}) {
  const accentClasses = {
    primary: "border-primary/30 bg-primary/[0.04]",
    emerald: "border-emerald-500/30 bg-emerald-500/[0.04]",
    amber: "border-amber-500/30 bg-amber-500/[0.04]",
    blue: "border-blue-500/30 bg-blue-500/[0.04]",
  }[accent];
  return (
    <div className={`rounded-lg border ${accentClasses} p-3`}>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <Label className="text-xs font-semibold">{title}</Label>
        <span className="text-[10px] text-muted-foreground">{value.length} karakter</span>
      </div>
      {hint && <p className="text-[10px] text-muted-foreground mb-2 leading-snug">{hint}</p>}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="text-xs font-mono leading-relaxed resize-y"
      />
    </div>
  );
}
