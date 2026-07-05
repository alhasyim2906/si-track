"use client";
import { useAppStore } from "@/store/app-store";
import { Logo } from "./Logo";
import { MapPin, Mail, Phone, Clock, Heart, ExternalLink, ShieldCheck } from "lucide-react";

/* ---------- default footer settings (used when DB has no value) ---------- */
const FOOTER_DEFAULTS: Record<string, string> = {
  footer_about_text:
    "Sistem Informasi Tracking Pendaftaran Surat Tanah. Memberikan transparansi pelayanan publik bagi masyarakat Kelurahan Kuala Pembuang II.",
  footer_service_hours_weekday: "Senin – Jumat: 08.00 – 15.00 WIB",
  footer_service_hours_saturday: "Sabtu: 08.00 – 12.00 WIB",
  footer_service_hours_sunday: "Minggu & Hari Libur: Tutup",
  footer_copyright_text: `© ${new Date().getFullYear()} Pemerintah Kelurahan Kuala Pembuang II. Hak Cipta Dilindungi.`,
  footer_credit_text: `Dibuat dengan ❤ oleh {app_name} · v1.0`,
  footer_show_shield_badge: "true",
  footer_show_service_hours: "true",
  footer_show_links: "true",
  footer_show_contact: "true",
};

function getSetting(settings: Record<string, string>, key: string): string {
  return settings[key] ?? FOOTER_DEFAULTS[key] ?? "";
}

function isTrue(settings: Record<string, string>, key: string): boolean {
  return (settings[key] ?? FOOTER_DEFAULTS[key] ?? "true") === "true";
}

export function Footer() {
  const { branding, appName, settings } = useAppStore();

  const aboutText = getSetting(settings, "footer_about_text");
  const hoursWeekday = getSetting(settings, "footer_service_hours_weekday");
  const hoursSaturday = getSetting(settings, "footer_service_hours_saturday");
  const hoursSunday = getSetting(settings, "footer_service_hours_sunday");
  const copyrightText = getSetting(settings, "footer_copyright_text").replace(/\{year\}/g, String(new Date().getFullYear()));
  const creditText = getSetting(settings, "footer_credit_text")
    .replace(/\{app_name\}/g, appName)
    .replace(/\{year\}/g, String(new Date().getFullYear()));

  const showShield = isTrue(settings, "footer_show_shield_badge");
  const showServiceHours = isTrue(settings, "footer_show_service_hours");
  const showLinks = isTrue(settings, "footer_show_links");
  const showContact = isTrue(settings, "footer_show_contact");

  // contact info from settings (with fallbacks)
  const alamat = settings.alamat_kelurahan || "Jl. Iskandar No. 1, Kuala Pembuang, Seruyan, Kalimantan Tengah 74211";
  const telepon = settings.telepon_kelurahan || "(0532) 000-0000";
  const email = settings.email_kelurahan || "kelurahan@kualapembuang2.go.id";

  // Determine column span based on how many sections are visible
  // Columns: About(always) + Contact + Service Hours + Links
  const visibleCols = 1 + (showContact ? 1 : 0) + (showServiceHours ? 1 : 0) + (showLinks ? 1 : 0);
  const aboutSpan = visibleCols <= 2 ? "md:col-span-2" : visibleCols === 3 ? "md:col-span-1" : "md:col-span-1";

  return (
    <footer className="mt-auto border-t border-border/40 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className={`${aboutSpan} space-y-4`}>
            <Logo size={36} src={branding.branding_logo_url} alt={`${appName} logo`} />
            <p className="text-sm text-foreground/55 leading-relaxed">
              {aboutText}
            </p>
            {showShield && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold gold-text">Resmi & Terpercaya</p>
                  <p className="text-[9px] text-foreground/40">Pemerintah Kabupaten Seruyan</p>
                </div>
              </div>
            )}
          </div>

          {showContact && (
            <div>
              <h4 className="font-semibold text-sm mb-4 gold-text flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Kontak Kami
              </h4>
              <ul className="space-y-3 text-sm text-foreground/55">
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary/50" />
                  <span>{alamat}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 shrink-0 text-primary/50" />
                  <span>{telepon}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 shrink-0 text-primary/50" />
                  <span>{email}</span>
                </li>
              </ul>
            </div>
          )}

          {showServiceHours && (
            <div>
              <h4 className="font-semibold text-sm mb-4 gold-text flex items-center gap-2">
                <Clock className="w-4 h-4" /> Jam Pelayanan
              </h4>
              <ul className="space-y-3 text-sm text-foreground/55">
                <li className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 shrink-0 text-primary/50" />
                  <span>{hoursWeekday}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 shrink-0 text-primary/50" />
                  <span>{hoursSaturday}</span>
                </li>
                <li className="flex items-center gap-2.5 text-foreground/40">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{hoursSunday}</span>
                </li>
              </ul>
            </div>
          )}

          {showLinks && (
            <div>
              <h4 className="font-semibold text-sm mb-4 gold-text flex items-center gap-2">
                <ExternalLink className="w-4 h-4" /> Tautan
              </h4>
              <ul className="space-y-2.5 text-sm text-foreground/55">
                <li>
                  <button className="hover:text-primary transition-colors flex items-center gap-1.5">
                    Lacak Surat Tanah
                  </button>
                </li>
                <li>
                  <button className="hover:text-primary transition-colors flex items-center gap-1.5">
                    Syarat & Dokumen
                  </button>
                </li>
                <li>
                  <button className="hover:text-primary transition-colors flex items-center gap-1.5">
                    FAQ
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
        <div className="mt-8 pt-6 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-foreground/45">
            {copyrightText}
          </p>
          <p className="text-xs text-foreground/35 flex items-center gap-1 flex-wrap justify-center">
            {creditText.split(/❤/).map((part, i, arr) => (
              <span key={i} className="inline-flex items-center gap-1">
                {part}
                {i < arr.length - 1 && <Heart className="w-3 h-3 text-primary/60 inline-block" />}
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
