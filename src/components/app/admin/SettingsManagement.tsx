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
  FileText,
  Heart,
  ExternalLink,
  Clock,
  PanelBottom,
  MapPin,
  Info,
  Timer,
  Gauge,
  CalendarClock,
  AlertTriangle,
  TrendingUp,
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
  notify_email_from_name: "",
  // Google Gmail SMTP config (Task 19)
  notify_email_gmail_user: "",
  notify_email_gmail_app_password: "",
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
  // ===== Footer defaults (Task 17) =====
  footer_about_text:
    "Sistem Informasi Tracking Pendaftaran Surat Tanah. Memberikan transparansi pelayanan publik bagi masyarakat Kelurahan Kuala Pembuang II.",
  footer_service_hours_weekday: "Senin – Jumat: 08.00 – 15.00 WIB",
  footer_service_hours_saturday: "Sabtu: 08.00 – 12.00 WIB",
  footer_service_hours_sunday: "Minggu & Hari Libur: Tutup",
  footer_copyright_text: "© {year} Pemerintah Kelurahan Kuala Pembuang II. Hak Cipta Dilindungi.",
  footer_credit_text: "Dibuat dengan ❤ oleh {app_name} · v1.0",
  footer_show_shield_badge: "true",
  footer_show_service_hours: "true",
  footer_show_links: "true",
  footer_show_contact: "true",
  // ===== SLA defaults (Task 19) — target hours per status stage =====
  sla_warning_threshold_pct: "80",
  sla_pengajuan_hours: "24",
  sla_cek_admin_hours: "48",
  sla_verifikasi_lapangan_hours: "72",
  sla_pengukuran_hours: "72",
  sla_pembuatan_surat_hours: "48",
  sla_ttd_lurah_hours: "24",
  sla_ttd_camat_hours: "48",
  sla_revisi_hours: "168",
  sla_total_target_hours: "336", // 14 days overall target
  sla_alert_atasan_enabled: "true",
};

/* ============================================================
   Field definitions for each section
   ============================================================ */
interface FieldDef {
  key: string;
  label: string;
  description?: string;
  icon: any;
  type: "text" | "number" | "switch" | "textarea";
  placeholder?: string;
  rows?: number;
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

const FOOTER_FIELDS: FieldDef[] = [
  {
    key: "footer_about_text",
    label: "Teks Deskripsi Footer",
    description: "Paragraf deskripsi singkat tentang aplikasi di kolom pertama footer.",
    icon: FileText,
    type: "textarea",
    rows: 3,
    placeholder: "Sistem Informasi Tracking Pendaftaran Surat Tanah...",
  },
  {
    key: "footer_service_hours_weekday",
    label: "Jam Layanan Senin–Jumat",
    icon: Clock,
    type: "text",
    placeholder: "Senin – Jumat: 08.00 – 15.00 WIB",
  },
  {
    key: "footer_service_hours_saturday",
    label: "Jam Layanan Sabtu",
    icon: Clock,
    type: "text",
    placeholder: "Sabtu: 08.00 – 12.00 WIB",
  },
  {
    key: "footer_service_hours_sunday",
    label: "Jam Layanan Minggu/Libur",
    icon: Clock,
    type: "text",
    placeholder: "Minggu & Hari Libur: Tutup",
  },
  {
    key: "footer_copyright_text",
    label: "Teks Hak Cipta",
    description: "Gunakan {year} untuk tahun berjalan otomatis.",
    icon: ShieldCheck,
    type: "text",
    placeholder: "© {year} Pemerintah Kelurahan...",
  },
  {
    key: "footer_credit_text",
    label: "Teks Kredit",
    description: "Gunakan {app_name} untuk nama aplikasi otomatis. Gunakan ❤ untuk ikon hati.",
    icon: Heart,
    type: "text",
    placeholder: "Dibuat dengan ❤ oleh {app_name} · v1.0",
  },
  {
    key: "footer_show_shield_badge",
    label: "Tampilkan Badge 'Resmi & Terpercaya'",
    description: "Badge kepercayaan di kolom pertama footer.",
    icon: ShieldCheck,
    type: "switch",
  },
  {
    key: "footer_show_contact",
    label: "Tampilkan Kolom Kontak",
    description: "Kolom alamat, telepon, dan email (menggunakan data Informasi Kelurahan).",
    icon: Phone,
    type: "switch",
  },
  {
    key: "footer_show_service_hours",
    label: "Tampilkan Kolom Jam Pelayanan",
    icon: Clock,
    type: "switch",
  },
  {
    key: "footer_show_links",
    label: "Tampilkan Kolom Tautan",
    icon: ExternalLink,
    type: "switch",
  },
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
        ) : field.type === "textarea" ? (
          <Textarea
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={field.rows || 3}
            className="text-sm resize-y"
          />
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
  const { can, setBranding, setAppName, setSettings: setGlobalSettings } = useAppStore();
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
      // sync all settings to global store so Footer reads live values
      setGlobalSettings(merged);
    } catch {
      toast.error("Gagal memuat pengaturan");
    } finally {
      setLoading(false);
    }
  }, [setBranding, setAppName, setGlobalSettings]);

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
      setGlobalSettings(merged);
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
      setGlobalSettings(merged);
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

      {/* Section 5: Footer */}
      <Card className="glass-card border-primary/15">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <PanelBottom className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">Footer</h3>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                Kustomisasi teks dan tampilan footer yang tampil di seluruh halaman.
              </p>
            </div>
          </div>
          <Separator className="opacity-50" />
          <div className="space-y-5">
            {FOOTER_FIELDS.map((field) => (
              <SettingRow
                key={field.key}
                field={field}
                value={settings[field.key] ?? DEFAULTS[field.key]}
                onChange={(v) => updateSetting(field.key, v)}
              />
            ))}
          </div>

          {/* Live preview */}
          <div className="mt-2 p-4 rounded-lg bg-primary/5 border border-primary/15">
            <p className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-primary" />
              Pratinjau Live Footer
            </p>
            <div className="rounded-lg border border-border/40 bg-card/30 p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[10px]">
                <div className="space-y-1.5">
                  <p className="font-bold gold-text text-[11px]">{settings.app_name || "SI-TRACK TANAH"}</p>
                  <p className="text-foreground/55 leading-snug line-clamp-3">
                    {settings.footer_about_text || DEFAULTS.footer_about_text}
                  </p>
                  {settings.footer_show_shield_badge !== "false" && (
                    <p className="text-foreground/40 flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5 text-primary" /> Resmi & Terpercaya
                    </p>
                  )}
                </div>
                {settings.footer_show_contact !== "false" && (
                  <div>
                    <p className="font-semibold gold-text mb-1.5 flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> Kontak</p>
                    <p className="text-foreground/55 leading-snug">{settings.alamat_kelurahan || "Jl. Iskandar No. 1..."}</p>
                    <p className="text-foreground/55">{settings.telepon_kelurahan || "(0532) 000-0000"}</p>
                    <p className="text-foreground/55">{settings.email_kelurahan || "kelurahan@..."}</p>
                  </div>
                )}
                {settings.footer_show_service_hours !== "false" && (
                  <div>
                    <p className="font-semibold gold-text mb-1.5 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Jam Layanan</p>
                    <p className="text-foreground/55">{settings.footer_service_hours_weekday || "Senin – Jumat: 08.00 – 15.00"}</p>
                    <p className="text-foreground/55">{settings.footer_service_hours_saturday || "Sabtu: 08.00 – 12.00"}</p>
                    <p className="text-foreground/40">{settings.footer_service_hours_sunday || "Minggu: Tutup"}</p>
                  </div>
                )}
                {settings.footer_show_links !== "false" && (
                  <div>
                    <p className="font-semibold gold-text mb-1.5 flex items-center gap-1"><ExternalLink className="w-2.5 h-2.5" /> Tautan</p>
                    <p className="text-foreground/55">Lacak Surat Tanah</p>
                    <p className="text-foreground/55">Syarat & Dokumen</p>
                    <p className="text-foreground/55">FAQ</p>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-2 border-t border-border/30 flex justify-between text-[9px] text-foreground/45">
                <span>{(settings.footer_copyright_text || "").replace("{year}", String(new Date().getFullYear())) || `© ${new Date().getFullYear()} Pemerintah...`}</span>
                <span className="text-foreground/35 flex items-center gap-0.5">
                  {(settings.footer_credit_text || "").replace(/\{app_name\}/g, settings.app_name || "SI-TRACK TANAH").split(/❤/).map((part, i, arr) => (
                    <span key={i}>{part}{i < arr.length - 1 && <Heart className="w-2 h-2 text-primary/60 inline" />}</span>
                  ))}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div className="text-[11px] leading-snug text-muted-foreground">
                <span className="font-semibold text-foreground">Tips:</span> Gunakan{" "}
                <code className="px-1 py-0.5 rounded bg-muted/30 text-blue-500 font-mono text-[10px]">{"{year}"}</code>{" "}
                untuk tahun otomatis dan{" "}
                <code className="px-1 py-0.5 rounded bg-muted/30 text-blue-500 font-mono text-[10px]">{"{app_name}"}</code>{" "}
                untuk nama aplikasi otomatis pada teks hak cipta/kredit. Kolom Kontak menggunakan data dari Informasi Kelurahan.
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => handleSaveSection(FOOTER_FIELDS.map((f) => f.key))}
              disabled={saving}
              className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
            >
              {saving && activeSection === "footer_about_text" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Simpan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Branding & Media */}
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

      {/* ===== Section 7: SLA (Service Level Agreement) ===== */}
      <SlaSection
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
  "notify_email_from_name",
  "notify_email_gmail_user",
  "notify_email_gmail_app_password",
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
  const [showAppPwd, setShowAppPwd] = useState(false);
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
  const gmailUserSet = !!(settings.notify_email_gmail_user || "").trim();
  const gmailPwdSet = !!(settings.notify_email_gmail_app_password || "").trim();
  const gmailReady = gmailUserSet && gmailPwdSet;

  // Auto-fill from-name with kelurahan name on first Gmail setup
  const handleGmailPreset = () => {
    if (!settings.notify_email_from_name && settings.nama_kelurahan) {
      updateSetting("notify_email_from_name", settings.nama_kelurahan);
    }
    if (settings.notify_email_provider !== "gmail") {
      updateSetting("notify_email_provider", "gmail");
    }
    toast.success("Preset Gmail diterapkan. Lengkapi Gmail User & App Password.");
  };

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-500" />
              <p className="text-sm font-semibold">Konfigurasi Email</p>
            </div>
            {/* Quick preset buttons */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={handleGmailPreset}
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                  emailProvider === "gmail"
                    ? "bg-red-500/15 text-red-600 border-red-500/40"
                    : "bg-background/60 text-foreground/70 border-border hover:border-red-500/40 hover:text-red-600"
                }`}
              >
                <Mail className="w-3 h-3" /> Preset Gmail
              </button>
            </div>
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
                  <SelectItem value="gmail">Google Mail (Gmail SMTP — smtp.gmail.com)</SelectItem>
                  <SelectItem value="smtp_api">SMTP API Bridge (HTTP → SMTP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Pengirim (From Name)</Label>
              <Input
                value={settings.notify_email_from_name ?? ""}
                onChange={(e) => updateSetting("notify_email_from_name", e.target.value)}
                placeholder={settings.nama_kelurahan || "Kelurahan Kuala Pembuang II"}
              />
            </div>
          </div>

          {/* Gmail-specific config */}
          {emailProvider === "gmail" && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-red-500" /> Gmail User (Email Google)
                  </Label>
                  <Input
                    type="email"
                    value={settings.notify_email_gmail_user ?? ""}
                    onChange={(e) => updateSetting("notify_email_gmail_user", e.target.value)}
                    placeholder="kelurahan.kpii@gmail.com"
                    className={gmailUserSet ? "border-green-500/40" : ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Key className="w-3 h-3 text-red-500" /> App Password (16 karakter)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type={showAppPwd ? "text" : "password"}
                      value={settings.notify_email_gmail_app_password ?? ""}
                      onChange={(e) => updateSetting("notify_email_gmail_app_password", e.target.value)}
                      placeholder="abcd efgh ijkl mnop"
                      className={`font-mono text-xs flex-1 ${gmailPwdSet ? "border-green-500/40" : ""}`}
                      maxLength={32}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => setShowAppPwd((s) => !s)}
                    >
                      {showAppPwd ? <Eye className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Gmail status banner */}
              <div className={`p-2.5 rounded-lg border text-[11px] leading-snug flex items-start gap-2 ${
                gmailReady
                  ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              }`}>
                {gmailReady ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                )}
                <div>
                  {gmailReady ? (
                    <span>
                      <span className="font-semibold">Gmail siap digunakan.</span> Pastikan akun Google telah
                      mengaktifkan Verifikasi 2-Langkah (2FA). Email akan dikirim dari{" "}
                      <span className="font-mono">{settings.notify_email_gmail_user}</span>.
                    </span>
                  ) : (
                    <span>
                      <span className="font-semibold">Belum lengkap.</span> Isi Gmail User & App Password untuk
                      mulai mengirim email otomatis. Buat App Password di{" "}
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-red-500"
                      >
                        myaccount.google.com/apppasswords
                      </a>{" "}
                      (syarat: 2FA aktif).
                    </span>
                  )}
                </div>
              </div>

              {/* Step-by-step Gmail setup */}
              <details className="text-[11px] text-muted-foreground border border-border/40 rounded-lg p-2.5 bg-input/10">
                <summary className="cursor-pointer font-semibold text-foreground/80 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-500" /> Panduan Setup Gmail (klik untuk buka)
                </summary>
                <ol className="list-decimal ml-5 mt-2 space-y-1 leading-snug">
                  <li>
                    Login ke{" "}
                    <a href="https://myaccount.google.com" target="_blank" rel="noreferrer" className="text-blue-500 underline">
                      myaccount.google.com
                    </a>{" "}
                    dengan akun Gmail kelurahan.
                  </li>
                  <li>Aktifkan <span className="font-semibold">Verifikasi 2-Langkah (2-Step Verification)</span> di menu Keamanan.</li>
                  <li>
                    Buka{" "}
                    <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-blue-500 underline">
                      App Passwords
                    </a>{" "}
                    → buat app bernama "SI-TRACK TANAH" → salin password 16 karakter.
                  </li>
                  <li>Tempel App Password 16 karakter di kolom di atas (tanpa spasi).</li>
                  <li>Klik <span className="font-semibold">Simpan</span>, lalu <span className="font-semibold">Test Email</span> di bawah.</li>
                </ol>
                <p className="mt-2 text-amber-600">
                  Catatan: Jangan gunakan password Gmail biasa — Google akan menolak. App Password wajib digunakan.
                </p>
              </details>
            </div>
          )}

          {/* smtp_api specific */}
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

          {/* Email From (only for smtp_api / log) */}
          {emailProvider !== "gmail" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
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
          )}

          {emailProvider === "log" && (
            <p className="text-[11px] text-amber-600 mt-3 leading-snug flex items-start gap-1.5">
              <TestTube2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                <span className="font-semibold">Mode Log aktif:</span> Email tidak benar-benar dikirim — body email hanya dicetak di server log. Berguna untuk development. Untuk produksi, gunakan <span className="font-semibold">Gmail</span> (gratis, paling mudah) atau <span className="font-semibold">SMTP API Bridge</span>.
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
                disabled={testingEmail || !emailEnabled || (emailProvider === "gmail" && !gmailReady)}
                title={
                  emailProvider === "gmail" && !gmailReady
                    ? "Lengkapi Gmail User & App Password sebelum menguji"
                    : undefined
                }
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

/* ============================================================
   Section 7 — SLA (Service Level Agreement) Tracking
   ============================================================ */
const SLA_FIELDS = [
  "sla_warning_threshold_pct",
  "sla_pengajuan_hours",
  "sla_cek_admin_hours",
  "sla_verifikasi_lapangan_hours",
  "sla_pengukuran_hours",
  "sla_pembuatan_surat_hours",
  "sla_ttd_lurah_hours",
  "sla_ttd_camat_hours",
  "sla_revisi_hours",
  "sla_total_target_hours",
  "sla_alert_atasan_enabled",
];

interface SlaStageDef {
  key: string;
  label: string;
  kode: string;
  warna: string;
  icon: any;
}

const SLA_STAGES: SlaStageDef[] = [
  { key: "sla_pengajuan_hours", label: "Pengajuan Diterima", kode: "PENGAJUAN", warna: "#3b82f6", icon: FileDigit },
  { key: "sla_cek_admin_hours", label: "Cek Administrasi", kode: "CEK_ADMIN", warna: "#0891b2", icon: CheckCircle2 },
  { key: "sla_verifikasi_lapangan_hours", label: "Verifikasi Lapangan", kode: "VERIFIKASI_LAPANGAN", warna: "#0d9488", icon: MapPin },
  { key: "sla_pengukuran_hours", label: "Pengukuran Tanah", kode: "PENGUKURAN", warna: "#ca8a04", icon: Ruler },
  { key: "sla_pembuatan_surat_hours", label: "Pembuatan Surat", kode: "PEMBUATAN_SURAT", warna: "#d4af37", icon: FileText },
  { key: "sla_ttd_lurah_hours", label: "TTD Lurah", kode: "TTD_LURAH", warna: "#eab308", icon: ShieldCheck },
  { key: "sla_ttd_camat_hours", label: "TTD Camat", kode: "TTD_CAMAT", warna: "#f59e0b", icon: Stamp },
  { key: "sla_revisi_hours", label: "Perbaikan Dokumen (REVISI)", kode: "REVISI", warna: "#f97316", icon: AlertTriangle },
];

function SlaSection({
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
  const warningPct = parseInt(settings.sla_warning_threshold_pct || "80");
  const totalTargetHours = parseInt(settings.sla_total_target_hours || "336");
  const totalTargetDays = Math.round((totalTargetHours / 24) * 10) / 10;
  const alertEnabled = (settings.sla_alert_atasan_enabled ?? "true") === "true";

  // Helper: format hours → "1 hari 2 jam"
  const fmt = (h: number) => {
    const d = Math.floor(h / 24);
    const r = h % 24;
    if (d > 0 && r > 0) return `${d} hari ${r} jam`;
    if (d > 0) return `${d} hari`;
    return `${r} jam`;
  };

  return (
    <Card className="glass-card border-primary/15">
      <CardContent className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Timer className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">SLA (Service Level Agreement)</h3>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                Atur target waktu penyelesaian per tahapan. Lurah/Atasan dapat memantau permohonan yang melebihi SLA
                pada menu <span className="font-semibold">Pelacakan SLA</span>.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onSaveSection(SLA_FIELDS)}
            disabled={saving}
          >
            {saving && activeSection === "sla_warning_threshold_pct" ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            Simpan
          </Button>
        </div>
        <Separator className="opacity-50" />

        {/* Global SLA config */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.03] space-y-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-amber-500" />
              <p className="text-xs font-semibold">Ambang Batas Peringatan</p>
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug">
              Persentase SLA yang tercapai sebelum permohonan ditandai &quot;warning&quot; (mendekati terlambat).
            </p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={50}
                max={100}
                value={settings.sla_warning_threshold_pct ?? "80"}
                onChange={(e) => updateSetting("sla_warning_threshold_pct", e.target.value)}
                className="w-20"
              />
              <span className="text-sm font-semibold">%</span>
              <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500"
                  style={{ width: `${warningPct}%` }}
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Contoh: 80% berarti permohonan yang telah menghabiskan 80%+ SLA tahapan akan ditandai <span className="text-amber-500 font-semibold">warning</span>, di atas 100% = <span className="text-red-500 font-semibold">breach (terlambat)</span>.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-primary/20 bg-primary/[0.03] space-y-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold">Target Total Penyelesaian</p>
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug">
              Target keseluruhan waktu pemrosesan dari pengajuan hingga selesai.
            </p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={24}
                step={24}
                value={settings.sla_total_target_hours ?? "336"}
                onChange={(e) => updateSetting("sla_total_target_hours", e.target.value)}
                className="w-24"
              />
              <span className="text-sm font-semibold">jam</span>
              <span className="text-xs text-muted-foreground">≈ {fmt(totalTargetHours)} ({totalTargetDays} hari)</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Bell className="w-3 h-3" /> Notifikasi Atasan saat SLA breach
              </p>
              <Switch
                checked={alertEnabled}
                onCheckedChange={(v) => updateSetting("sla_alert_atasan_enabled", v ? "true" : "false")}
              />
            </div>
          </div>
        </div>

        {/* Per-stage SLA grid */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">Target SLA per Tahapan</p>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
            Tentukan berapa lama maksimum sebuah permohonan boleh berada di setiap tahapan. Jika melebihi target,
            Lurah/Atasan akan melihat indikator <span className="text-red-500 font-semibold">SLA Terlambat</span>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SLA_STAGES.map((stage) => {
              const Icon = stage.icon;
              const val = parseInt(settings[stage.key] || "0");
              return (
                <div
                  key={stage.key}
                  className="rounded-lg border border-border/40 bg-input/10 p-3 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${stage.warna}1a`, border: `1px solid ${stage.warna}55` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: stage.warna }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">{stage.label}</p>
                      <p className="text-[9px] font-mono text-muted-foreground">{stage.kode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={settings[stage.key] ?? ""}
                      onChange={(e) => updateSetting(stage.key, e.target.value)}
                      className="h-8 text-xs w-20"
                    />
                    <span className="text-[11px] text-muted-foreground">jam</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{val ? fmt(val) : "—"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info box */}
        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-[11px] leading-snug text-muted-foreground">
              <span className="font-semibold text-foreground">Bagaimana SLA dihitung?</span> Sistem mengambil
              timestamp saat permohonan masuk ke tahapan saat ini (dari Riwayat Proses), lalu membandingkannya dengan
              waktu sekarang. Selisih dibandingkan dengan target di tabel di atas. Status:
              <span className="text-green-500 font-semibold"> On-Track</span> (≤ 80% SLA terpakai) ·
              <span className="text-amber-500 font-semibold"> Warning</span> (80–100%) ·
              <span className="text-red-500 font-semibold"> Breach</span> (&gt; 100% / melebihi target).
              <br />
              Lurah/Atasan dapat memantau di menu <span className="font-semibold">Pelacakan SLA</span> pada sidebar.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
