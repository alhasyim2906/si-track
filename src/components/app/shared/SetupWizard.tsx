"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Sparkles,
  Building2,
  ShieldCheck,
  Hash,
  Bell,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  X,
  Mail,
  Phone,
  MapPin,
  Lock,
  User,
  Briefcase,
  Server,
  MessageCircle,
  TestTube2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

/* ============================================================
   SetupWizard — multi-step first-run onboarding dialog.
   Auto-opens on the public page when GET /api/setup/status
   returns `needed: true` and the visitor is not logged in.
   Admins can also re-open it from Settings to review/re-apply
   configuration (admin creation step is skipped in that case).
   ============================================================ */

interface SetupStatus {
  needed: boolean;
  setupComplete: boolean;
  hasAdmin: boolean;
  hasSettings: boolean;
  hasMasterData: boolean;
  userCount: number;
  adminCount: number;
  jenisCount: number;
  statusPenguasaanCount: number;
  appName: string;
  appSubtitle: string;
  kelurahan: string;
}

interface WizardState {
  app: {
    appName: string;
    appSubtitle: string;
    kelurahan: string;
    alamatKantor: string;
    teleponKelurahan: string;
    emailKelurahan: string;
  };
  admin: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    position: string;
    phone: string;
  };
  register: {
    prefix: string;
    digitCount: string;
    useRandom: boolean;
  };
  notifications: {
    waEnabled: boolean;
    fonnteToken: string;
    emailEnabled: boolean;
    emailProvider: string;
    gmailUser: string;
    gmailAppPassword: string;
  };
  footer: {
    copyrightText: string;
    aboutText: string;
    creditText: string;
  };
}

const DEFAULT_STATE: WizardState = {
  app: {
    appName: "SI-TRACK TANAH",
    appSubtitle: "Kelurahan Kuala Pembuang II",
    kelurahan: "Kelurahan Kuala Pembuang II",
    alamatKantor: "",
    teleponKelurahan: "",
    emailKelurahan: "",
  },
  admin: {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    position: "Administrator Sistem",
    phone: "",
  },
  register: {
    prefix: "KPII-TNH",
    digitCount: "8",
    useRandom: true,
  },
  notifications: {
    waEnabled: false,
    fonnteToken: "",
    emailEnabled: false,
    emailProvider: "gmail",
    gmailUser: "",
    gmailAppPassword: "",
  },
  footer: {
    copyrightText: "© {year} Pemerintah Kelurahan Kuala Pembuang II",
    aboutText: "Sistem Informasi Tracking Pendaftaran Surat Tanah",
    creditText: "Dibuat untuk pelayanan publik",
  },
};

const STEPS = [
  { id: 0, key: "welcome", label: "Selamat Datang", icon: Sparkles },
  { id: 1, key: "app", label: "Identitas Kelurahan", icon: Building2 },
  { id: 2, key: "admin", label: "Akun Administrator", icon: ShieldCheck },
  { id: 3, key: "register", label: "Format Nomor Register", icon: Hash },
  { id: 4, key: "notifications", label: "Notifikasi (Opsional)", icon: Bell },
  { id: 5, key: "review", label: "Selesai", icon: CheckCircle2 },
] as const;

export function SetupWizard({
  open,
  onOpenChange,
  onCompleted,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCompleted?: (result: { adminCreated: boolean; adminSkipped: boolean }) => void;
}) {
  const { user, setBranding, setAppName, setSettings } = useAppStore();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(DEFAULT_STATE);
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Re-fetch setup status whenever the wizard is opened, so we can pre-fill
  // existing values when an admin re-runs the wizard.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingStatus(true);
    api
      .setupStatus()
      .then((s) => {
        if (cancelled) return;
        setStatus(s as SetupStatus);
        // Pre-fill app name & kelurahan from existing settings (if any)
        if (s.appName) {
          setState((prev) => ({
            ...prev,
            app: { ...prev.app, appName: s.appName, appSubtitle: s.appSubtitle || prev.app.appSubtitle, kelurahan: s.kelurahan || prev.app.kelurahan },
          }));
        }
      })
      .catch(() => {
        /* non-blocking */
      })
      .finally(() => !cancelled && setLoadingStatus(false));
    return () => {
      cancelled = true;
    };
  }, [open]);

  // If an admin is already logged in, skip the admin creation step entirely
  const isAdminLoggedIn = !!user && user.role === "ADMIN";
  const hasAdminAlready = !!status?.hasAdmin;
  const skipAdminStep = isAdminLoggedIn || hasAdminAlready;

  const set = (section: keyof WizardState, field: string, value: any) => {
    setState((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      // Identitas Kelurahan
      if (!state.app.appName.trim()) return "Nama aplikasi wajib diisi";
      if (!state.app.kelurahan.trim()) return "Nama kelurahan wajib diisi";
      if (state.app.emailKelurahan && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.app.emailKelurahan)) {
        return "Format email kelurahan tidak valid";
      }
    }
    if (s === 2 && !skipAdminStep) {
      // Akun Administrator (first-run only)
      if (!state.admin.name.trim()) return "Nama administrator wajib diisi";
      if (!state.admin.email.trim()) return "Email administrator wajib diisi";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.admin.email.trim())) {
        return "Format email administrator tidak valid";
      }
      if (state.admin.password.length < 6) return "Password minimal 6 karakter";
      if (state.admin.password !== state.admin.confirmPassword) {
        return "Konfirmasi password tidak cocok";
      }
    }
    if (s === 3) {
      // Register format
      const p = state.register.prefix.trim().toUpperCase();
      if (!p) return "Prefix nomor register wajib diisi";
      if (!/^[A-Z0-9-]+$/.test(p)) return "Prefix hanya boleh huruf, angka, dan tanda hubung";
      const d = parseInt(state.register.digitCount, 10);
      if (isNaN(d) || d < 4 || d > 16) return "Jumlah digit harus antara 4 dan 16";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) {
      toast.error(err);
      return;
    }
    // Skip admin step if already logged in as admin or admin already exists
    if (step === 1 && skipAdminStep) {
      setStep(3);
    } else if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 3 && skipAdminStep) {
      setStep(1);
    } else if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    // Final validation pass over all required steps
    for (const s of [1, 2, 3]) {
      if (s === 2 && skipAdminStep) continue;
      const err = validateStep(s);
      if (err) {
        setStep(s);
        toast.error(err);
        return;
      }
    }

    setSubmitting(true);
    try {
      const body: any = {
        app: state.app,
        register: state.register,
        notifications: state.notifications,
        footer: {
          ...state.footer,
          copyrightText: state.footer.copyrightText.replace("{year}", String(new Date().getFullYear())),
        },
      };
      // Only send admin payload on first-run (when no admin exists yet)
      if (!skipAdminStep) {
        body.admin = {
          name: state.admin.name,
          email: state.admin.email,
          password: state.admin.password,
          position: state.admin.position,
          phone: state.admin.phone,
        };
      }

      const res = await api.setupComplete(body);

      // Refresh settings & branding in the client store
      try {
        const [setR, brandR] = await Promise.all([
          api.settings(),
          api.getBranding().catch(() => ({ branding: {} })),
        ]);
        setAppName(setR.settings.app_name, setR.settings.app_subtitle);
        setSettings(setR.settings || {});
        setBranding(brandR.branding || {});
      } catch {
        /* non-blocking */
      }

      toast.success(
        res.adminCreated
          ? "Setup selesai! Akun administrator telah dibuat. Anda akan otomatis login."
          : "Setup selesai! Konfigurasi sistem telah disimpan."
      );

      onCompleted?.({ adminCreated: res.adminCreated, adminSkipped: res.adminSkipped });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyelesaikan setup");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;
  const CurrentStepIcon = STEPS[step].icon;

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="glass-card navy-glow border-primary/30 max-w-3xl p-0 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header — gradient banner with step indicator */}
        <div className="relative bg-gradient-to-br from-[#0a1628] via-[#11203a] to-[#0a1628] border-b border-primary/30 px-6 py-5 shrink-0">
          <button
            type="button"
            onClick={() => !submitting && onOpenChange(false)}
            className="absolute top-3 right-3 p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 pr-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#f5d77a] via-[#d4af37] to-[#b8941f] flex items-center justify-center shrink-0 shadow-lg">
              <CurrentStepIcon className="w-5 h-5 text-[#0a1628]" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-white font-bold text-lg leading-tight flex items-center gap-2">
                Setup Wizard
                <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                  Langkah {step + 1} / {STEPS.length}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-white/60 text-xs mt-0.5">
                {STEPS[step].label}
              </DialogDescription>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step dots */}
          <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    // Allow jumping back to completed steps; forward jumps require validation
                    if (i <= step) setStep(i);
                  }}
                  disabled={i > step || submitting}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-colors shrink-0 ${
                    isActive
                      ? "bg-primary/20 text-primary"
                      : isDone
                        ? "text-white/70 hover:bg-white/5 cursor-pointer"
                        : "text-white/30 cursor-not-allowed"
                  }`}
                  title={s.label}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body — step content (scrollable) */}
        <div className="flex-1 overflow-y-auto notif-scroll px-6 py-5">
          {loadingStatus ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Memuat status setup…</span>
            </div>
          ) : step === 0 ? (
            <WelcomeStep status={status} />
          ) : step === 1 ? (
            <AppStep state={state.app} set={(f, v) => set("app", f, v)} />
          ) : step === 2 ? (
            skipAdminStep ? (
              <AdminSkippedStep hasAdmin={hasAdminAlready} isAdminLoggedIn={isAdminLoggedIn} />
            ) : (
              <AdminStep state={state.admin} set={(f, v) => set("admin", f, v)} />
            )
          ) : step === 3 ? (
            <RegisterStep state={state.register} set={(f, v) => set("register", f, v)} />
          ) : step === 4 ? (
            <NotificationsStep state={state.notifications} set={(f, v) => set("notifications", f, v)} />
          ) : (
            <ReviewStep
              state={state}
              skipAdmin={skipAdminStep}
              status={status}
            />
          )}
        </div>

        {/* Footer — nav buttons */}
        <div className="border-t border-border/40 bg-card/30 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={step === 0 || submitting}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Sebelumnya
          </Button>

          <div className="flex items-center gap-2">
            {step < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={submitting || loadingStatus}
                className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
              >
                {step === 0 ? "Mulai Setup" : "Lanjut"} <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                )}
                {submitting ? "Menyimpan…" : skipAdminStep ? "Simpan Konfigurasi" : "Selesaikan Setup"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   Step components
   ============================================================ */

function WelcomeStep({ status }: { status: SetupStatus | null }) {
  return (
    <div className="space-y-5">
      <div className="text-center space-y-3 py-3">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#f5d77a] via-[#d4af37] to-[#b8941f] flex items-center justify-center shadow-xl">
          <Sparkles className="w-8 h-8 text-[#0a1628]" />
        </div>
        <h2 className="text-2xl font-bold gold-gradient-text">Selamat Datang!</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Wizard ini akan memandu Anda mengonfigurasi <strong className="text-foreground">SI-TRACK TANAH</strong>{" "}
          untuk pertama kalinya. Selesaikan semua langkah untuk menyiapkan identitas kelurahan,
          akun administrator, dan format pendaftaran.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SetupCard icon={Building2} title="Identitas Kelurahan" desc="Nama aplikasi, kelurahan, alamat, kontak" color="#3b82f6" />
        <SetupCard icon={ShieldCheck} title="Akun Administrator" desc="Buat admin pertama untuk mengelola sistem" color="#d4af37" />
        <SetupCard icon={Hash} title="Format Nomor Register" desc="Prefix, panjang digit, mode random/sequential" color="#0d9488" />
        <SetupCard icon={Bell} title="Notifikasi (Opsional)" desc="WhatsApp Fonnte & Email Gmail" color="#f59e0b" />
      </div>

      {status && (
        <div className="rounded-lg border border-border/40 bg-input/20 p-4 space-y-2">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-primary" /> Status Sistem Saat Ini
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <StatusRow label="Setup selesai" value={status.setupComplete ? "Ya" : "Belum"} ok={status.setupComplete} />
            <StatusRow label="Akun admin" value={`${status.adminCount} ada`} ok={status.hasAdmin} />
            <StatusRow label="Pengguna" value={`${status.userCount} terdaftar`} ok={status.userCount > 0} />
            <StatusRow label="Master data" value={`${status.jenisCount} jenis · ${status.statusPenguasaanCount} status penguasaan`} ok={status.hasMasterData} />
          </div>
        </div>
      )}

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
          <strong>Catatan keamanan:</strong> Setup wizard hanya dapat membuat akun administrator pertama
          saat dijalankan dalam mode first-run (saat belum ada admin). Setelah admin dibuat, wizard
          hanya dapat menyimpan perubahan konfigurasi — pembuatan admin baru harus dilakukan melalui
          menu Manajemen Pengguna.
        </p>
      </div>
    </div>
  );
}

function SetupCard({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-input/20 p-3 flex items-start gap-3">
      <span
        className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}1a`, border: `1px solid ${color}55` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1">
        {ok ? (
          <CheckCircle2 className="w-3 h-3 text-green-500" />
        ) : (
          <AlertTriangle className="w-3 h-3 text-amber-500" />
        )}
        <span className="font-medium">{value}</span>
      </span>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="text-xs flex items-center gap-1">
      {children}
      {required && <span className="text-destructive">*</span>}
    </Label>
  );
}

function AppStep({
  state,
  set,
}: {
  state: WizardState["app"];
  set: (f: keyof WizardState["app"], v: any) => void;
}) {
  return (
    <div className="space-y-4">
      <StepHeader
        icon={Building2}
        title="Identitas Kelurahan"
        desc="Informasi ini akan tampil di header aplikasi, footer, dan tanda terima."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <FieldLabel required>Nama Aplikasi</FieldLabel>
          <Input
            value={state.appName}
            onChange={(e) => set("appName", e.target.value)}
            placeholder="SI-TRACK TANAH"
            className="bg-input/50"
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Sub-judul Aplikasi</FieldLabel>
          <Input
            value={state.appSubtitle}
            onChange={(e) => set("appSubtitle", e.target.value)}
            placeholder="Kelurahan Kuala Pembuang II"
            className="bg-input/50"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <FieldLabel required>Nama Kelurahan / Instansi</FieldLabel>
          <Input
            value={state.kelurahan}
            onChange={(e) => set("kelurahan", e.target.value)}
            placeholder="Kelurahan Kuala Pembuang II"
            className="bg-input/50"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <FieldLabel>Alamat Kantor</FieldLabel>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-3.5 w-3.5 h-3.5 text-muted-foreground" />
            <Textarea
              value={state.alamatKantor}
              onChange={(e) => set("alamatKantor", e.target.value)}
              placeholder="Jl. Iskandar No. 1, Kuala Pembuang, Seruyan, Kalimantan Tengah"
              rows={2}
              className="bg-input/50 pl-8 resize-none"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Telepon Kelurahan</FieldLabel>
          <div className="relative">
            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={state.teleponKelurahan}
              onChange={(e) => set("teleponKelurahan", e.target.value)}
              placeholder="0532-xxxxxxx"
              className="bg-input/50 pl-8"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Email Kelurahan</FieldLabel>
          <div className="relative">
            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="email"
              value={state.emailKelurahan}
              onChange={(e) => set("emailKelurahan", e.target.value)}
              placeholder="kelurahan@example.go.id"
              className="bg-input/50 pl-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminStep({
  state,
  set,
}: {
  state: WizardState["admin"];
  set: (f: keyof WizardState["admin"], v: any) => void;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const strength = useMemo(() => passwordStrength(state.password), [state.password]);
  return (
    <div className="space-y-4">
      <StepHeader
        icon={ShieldCheck}
        title="Akun Administrator Pertama"
        desc="Akun ini akan memiliki akses penuh ke seluruh fitur sistem. Simpan kredensial dengan aman."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <FieldLabel required>Nama Lengkap Administrator</FieldLabel>
          <div className="relative">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={state.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Administrator Sistem"
              className="bg-input/50 pl-8"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <FieldLabel required>Email</FieldLabel>
          <div className="relative">
            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="email"
              value={state.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="admin@kelurahan.go.id"
              className="bg-input/50 pl-8"
              autoCapitalize="none"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Jabatan</FieldLabel>
          <div className="relative">
            <Briefcase className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={state.position}
              onChange={(e) => set("position", e.target.value)}
              placeholder="Administrator Sistem"
              className="bg-input/50 pl-8"
            />
          </div>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <FieldLabel>Telepon</FieldLabel>
          <div className="relative">
            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={state.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="0812-xxxx-xxxx"
              className="bg-input/50 pl-8"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <FieldLabel required>Password</FieldLabel>
          <div className="relative">
            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type={showPwd ? "text" : "password"}
              value={state.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Minimal 6 karakter"
              className="bg-input/50 pl-8 pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              {showPwd ? "Sembunyikan" : "Lihat"}
            </button>
          </div>
          {state.password && (
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${strength.pct}%`,
                    background: strength.color,
                  }}
                />
              </div>
              <span className="text-[10px] font-medium" style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <FieldLabel required>Konfirmasi Password</FieldLabel>
          <div className="relative">
            <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type={showPwd ? "text" : "password"}
              value={state.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
              placeholder="Ulangi password"
              className="bg-input/50 pl-8"
            />
          </div>
          {state.confirmPassword && state.password !== state.confirmPassword && (
            <p className="text-[10px] text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Konfirmasi password tidak cocok
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminSkippedStep({ hasAdmin, isAdminLoggedIn }: { hasAdmin: boolean; isAdminLoggedIn: boolean }) {
  return (
    <div className="space-y-4">
      <StepHeader
        icon={ShieldCheck}
        title="Akun Administrator"
        desc="Akun administrator sudah ada — langkah ini dilewati."
      />
      <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {isAdminLoggedIn ? "Anda sudah login sebagai administrator" : "Akun administrator sudah dikonfigurasi"}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isAdminLoggedIn
              ? "Wizard ini berjalan dalam mode 're-run' — konfigurasi akan diperbarui, namun akun admin baru tidak akan dibuat. Untuk menambah admin baru, gunakan menu Manajemen Pengguna setelah wizard selesai."
              : "Akun administrator telah dibuat sebelumnya. Anda dapat melanjutkan ke langkah berikutnya. Untuk menambah admin baru, login terlebih dahulu lalu gunakan menu Manajemen Pengguna."}
          </p>
        </div>
      </div>
    </div>
  );
}

function RegisterStep({
  state,
  set,
}: {
  state: WizardState["register"];
  set: (f: keyof WizardState["register"], v: any) => void;
}) {
  const sample = useMemo(() => {
    const prefix = (state.prefix || "KPII-TNH").trim().toUpperCase() || "KPII-TNH";
    const year = new Date().getFullYear();
    const d = Math.max(4, Math.min(16, parseInt(state.digitCount || "8", 10) || 8));
    if (state.useRandom) {
      const chars = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
      let s = "";
      for (let i = 0; i < d; i++) s += chars[Math.floor(Math.random() * chars.length)];
      return `${prefix}-${year}-${s}`;
    }
    return `${prefix}-${year}-${"1".padStart(d, "0")}`;
  }, [state.prefix, state.digitCount, state.useRandom]);

  return (
    <div className="space-y-4">
      <StepHeader
        icon={Hash}
        title="Format Nomor Register"
        desc="Nomor register adalah ID unik untuk setiap permohonan. Format ini dapat dikunci untuk mencegah enumerasi."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <FieldLabel required>Prefix</FieldLabel>
          <Input
            value={state.prefix}
            onChange={(e) => set("prefix", e.target.value.toUpperCase())}
            placeholder="KPII-TNH"
            className="bg-input/50 font-mono uppercase"
          />
          <p className="text-[10px] text-muted-foreground">Hanya huruf, angka, dan tanda hubung</p>
        </div>
        <div className="space-y-1.5">
          <FieldLabel required>Jumlah Digit Serial</FieldLabel>
          <Input
            type="number"
            min={4}
            max={16}
            value={state.digitCount}
            onChange={(e) => set("digitCount", e.target.value)}
            className="bg-input/50"
          />
          <p className="text-[10px] text-muted-foreground">Antara 4 sampai 16 digit</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border/40 bg-input/20 p-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          <div>
            <Label className="text-sm font-medium">Mode Anti-Enumerasi (Random)</Label>
            <p className="text-[10px] text-muted-foreground">
              Serial acak sulit ditebak — mencegah pihak luar menebak nomor register pemohon lain
            </p>
          </div>
        </div>
        <Switch checked={state.useRandom} onCheckedChange={(v) => set("useRandom", v)} />
      </div>

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1.5">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> Pratinjau Nomor Register
        </p>
        <p className="font-mono text-sm text-primary break-all">{sample}</p>
        <p className="text-[10px] text-muted-foreground">
          {state.useRandom
            ? "Setiap permohonan akan mendapat serial acak yang unik."
            : "Serial berurutan dimulai dari 00000001 untuk tahun berjalan."}
        </p>
      </div>
    </div>
  );
}

function NotificationsStep({
  state,
  set,
}: {
  state: WizardState["notifications"];
  set: (f: keyof WizardState["notifications"], v: any) => void;
}) {
  return (
    <div className="space-y-4">
      <StepHeader
        icon={Bell}
        title="Notifikasi (Opsional)"
        desc="Konfigurasi notifikasi WhatsApp & Email. Dapat dilewati dan dikonfigurasi nanti di Pengaturan."
      />

      {/* WhatsApp */}
      <div className="rounded-lg border border-border/40 bg-input/20 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-green-500" />
            <div>
              <Label className="text-sm font-medium">Notifikasi WhatsApp (Fonnte)</Label>
              <p className="text-[10px] text-muted-foreground">Kirim WA otomatis ke pemohon saat status berubah</p>
            </div>
          </div>
          <Switch checked={state.waEnabled} onCheckedChange={(v) => set("waEnabled", v)} />
        </div>
        {state.waEnabled && (
          <div className="space-y-1.5 pt-1">
            <FieldLabel>Fonnte API Token</FieldLabel>
            <Input
              type="password"
              value={state.fonnteToken}
              onChange={(e) => set("fonnteToken", e.target.value)}
              placeholder="Token dari dashboard Fonnte"
              className="bg-input/50 font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              Dapatkan token di{" "}
              <a href="https://fonnte.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                fonnte.com
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Email */}
      <div className="rounded-lg border border-border/40 bg-input/20 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-500" />
            <div>
              <Label className="text-sm font-medium">Notifikasi Email (Gmail)</Label>
              <p className="text-[10px] text-muted-foreground">Kirim email otomatis via Gmail SMTP</p>
            </div>
          </div>
          <Switch checked={state.emailEnabled} onCheckedChange={(v) => set("emailEnabled", v)} />
        </div>
        {state.emailEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5 sm:col-span-2">
              <FieldLabel>Provider Email</FieldLabel>
              <Select value={state.emailProvider} onValueChange={(v) => set("emailProvider", v)}>
                <SelectTrigger className="bg-input/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmail">Gmail (App Password)</SelectItem>
                  <SelectItem value="smtp">SMTP Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Gmail Username</FieldLabel>
              <Input
                type="email"
                value={state.gmailUser}
                onChange={(e) => set("gmailUser", e.target.value)}
                placeholder="kelurahan@gmail.com"
                className="bg-input/50"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Gmail App Password</FieldLabel>
              <Input
                type="password"
                value={state.gmailAppPassword}
                onChange={(e) => set("gmailAppPassword", e.target.value)}
                placeholder="16-char app password"
                className="bg-input/50 font-mono text-xs"
              />
            </div>
            <p className="sm:col-span-2 text-[10px] text-muted-foreground">
              Buat App Password di{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Account Settings
              </a>
              . Gunakan 2FA + App Password, bukan password biasa.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
          Anda dapat melewati langkah ini sekarang dan mengonfigurasi notifikasi nanti melalui menu{" "}
          <strong>Pengaturan &gt; Notifikasi</strong>.
        </p>
      </div>
    </div>
  );
}

function ReviewStep({
  state,
  skipAdmin,
  status,
}: {
  state: WizardState;
  skipAdmin: boolean;
  status: SetupStatus | null;
}) {
  return (
    <div className="space-y-4">
      <StepHeader
        icon={CheckCircle2}
        title="Selesai — Tinjau Konfigurasi"
        desc="Periksa ringkasan konfigurasi sebelum menyelesaikan setup."
      />

      <ReviewCard icon={Building2} title="Identitas Kelurahan" color="#3b82f6">
        <ReviewRow label="Nama Aplikasi" value={state.app.appName} />
        <ReviewRow label="Sub-judul" value={state.app.appSubtitle || "—"} />
        <ReviewRow label="Kelurahan" value={state.app.kelurahan} />
        <ReviewRow label="Alamat" value={state.app.alamatKantor || "—"} />
        <ReviewRow label="Telepon" value={state.app.teleponKelurahan || "—"} />
        <ReviewRow label="Email" value={state.app.emailKelurahan || "—"} />
      </ReviewCard>

      <ReviewCard icon={ShieldCheck} title="Akun Administrator" color="#d4af37">
        {skipAdmin ? (
          <p className="text-xs text-muted-foreground italic">
            {status?.hasAdmin ? "Akun administrator sudah ada — tidak akan dibuat ulang." : "—"}
          </p>
        ) : (
          <>
            <ReviewRow label="Nama" value={state.admin.name} />
            <ReviewRow label="Email" value={state.admin.email} />
            <ReviewRow label="Jabatan" value={state.admin.position || "—"} />
            <ReviewRow label="Telepon" value={state.admin.phone || "—"} />
            <ReviewRow label="Password" value={"•".repeat(state.admin.password.length || 6)} />
          </>
        )}
      </ReviewCard>

      <ReviewCard icon={Hash} title="Format Nomor Register" color="#0d9488">
        <ReviewRow label="Prefix" value={state.register.prefix} />
        <ReviewRow label="Jumlah Digit" value={state.register.digitCount} />
        <ReviewRow label="Mode" value={state.register.useRandom ? "Random (Anti-Enumerasi)" : "Sequential"} />
      </ReviewCard>

      <ReviewCard icon={Bell} title="Notifikasi" color="#f59e0b">
        <ReviewRow label="WhatsApp" value={state.notifications.waEnabled ? `Aktif (Fonnte${state.notifications.fonnteToken ? " ✓" : " — token belum diisi"})` : "Nonaktif"} />
        <ReviewRow
          label="Email"
          value={
            state.notifications.emailEnabled
              ? `Aktif (${state.notifications.emailProvider}${state.notifications.gmailUser ? " ✓" : " — kredensial belum diisi"})`
              : "Nonaktif"
          }
        />
      </ReviewCard>

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-[11px] leading-snug">
          <strong className="text-foreground">Siap menyimpan!</strong> Klik{" "}
          <strong className="text-primary">{skipAdmin ? "Simpan Konfigurasi" : "Selesaikan Setup"}</strong>{" "}
          untuk menerapkan konfigurasi ini. {skipAdmin ? "" : "Anda akan otomatis login sebagai administrator setelah setup selesai."}
        </p>
      </div>
    </div>
  );
}

function StepHeader({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 pb-2 border-b border-border/40">
      <span className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5 text-primary" />
      </span>
      <div className="min-w-0">
        <h3 className="text-base font-bold leading-tight">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
      </div>
    </div>
  );
}

function ReviewCard({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: any;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-input/20 p-3.5 space-y-2">
      <p className="text-xs font-semibold flex items-center gap-2" style={{ color }}>
        <Icon className="w-3.5 h-3.5" />
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right break-all">{value || "—"}</span>
    </div>
  );
}

/* ============================================================
   Helpers
   ============================================================ */

function passwordStrength(p: string): { pct: number; label: string; color: string } {
  let score = 0;
  if (p.length >= 6) score += 1;
  if (p.length >= 10) score += 1;
  if (/[A-Z]/.test(p)) score += 1;
  if (/[0-9]/.test(p)) score += 1;
  if (/[^A-Za-z0-9]/.test(p)) score += 1;
  const pct = Math.min(100, score * 20);
  if (score <= 1) return { pct, label: "Lemah", color: "#dc2626" };
  if (score <= 3) return { pct, label: "Sedang", color: "#f59e0b" };
  return { pct, label: "Kuat", color: "#16a34a" };
}
