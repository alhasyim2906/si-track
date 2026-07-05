import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, setSessionCookie, getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { STATUS_DEFINITIONS, JENIS_SURAT_SEED, STATUS_PENGUASAAN_SEED } from "@/lib/constants";
import { normalizeBaseUrl, invalidatePublicBaseUrlCache } from "@/lib/public-url";

/**
 * POST /api/setup/complete — finalize the first-run Setup Wizard.
 *
 * Public when no admin exists yet (first-run). Once an admin is logged in,
 * they can also re-run the wizard from Settings — in that case this endpoint
 * requires ADMIN auth and skips admin creation (just updates settings).
 *
 * Body shape:
 *   {
 *     app: { appName, appSubtitle, kelurahan, alamatKantor, teleponKelurahan, emailKelurahan },
 *     admin: { name, email, password, position, phone } | null  (null when admin already exists)
 *     register: { prefix, digitCount, useRandom },
 *     notifications: { waEnabled, fonnteToken, emailEnabled, emailProvider, gmailUser, gmailAppPassword } | null,
 *     footer: { copyrightText, aboutText, creditText } | null
 *   }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = await getCurrentUser();

    // Determine mode: first-run (no admin) vs admin re-run
    const adminCount = await db.user.count({ where: { role: "ADMIN" } });
    const isFirstRun = adminCount === 0;

    // Security: if admin already exists, caller must be authenticated ADMIN
    if (!isFirstRun && (!current || current.user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Setup sudah selesai. Hanya admin yang dapat menjalankan ulang wizard." },
        { status: 403 }
      );
    }

    const { app, admin, register, notifications, footer } = body || {};

    // ===== Validation =====
    if (!app?.appName?.trim() || !app?.kelurahan?.trim()) {
      return NextResponse.json(
        { error: "Nama aplikasi dan nama kelurahan wajib diisi." },
        { status: 400 }
      );
    }

    let createdAdmin: { id: string; email: string; name: string; role: string } | null = null;
    let adminSkipped = false;

    // ===== Create admin (first-run only) =====
    if (isFirstRun) {
      if (!admin?.name?.trim() || !admin?.email?.trim() || !admin?.password) {
        return NextResponse.json(
          { error: "Data administrator tidak lengkap (nama, email, password wajib)." },
          { status: 400 }
        );
      }
      if (admin.password.length < 6) {
        return NextResponse.json(
          { error: "Password administrator minimal 6 karakter." },
          { status: 400 }
        );
      }
      const email = admin.email.toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: "Format email administrator tidak valid." },
          { status: 400 }
        );
      }
      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { error: `Email ${email} sudah terdaftar.` },
          { status: 400 }
        );
      }
      const hashed = await hashPassword(admin.password);
      const newUser = await db.user.create({
        data: {
          email,
          name: admin.name.trim(),
          role: "ADMIN",
          position: admin.position?.trim() || "Administrator Sistem",
          phone: admin.phone?.trim() || null,
          password: hashed,
          isActive: true,
        },
        select: { id: true, email: true, name: true, role: true },
      });
      createdAdmin = newUser;

      // Auto-login the new admin (set session cookie) so they don't need to log in again
      await setSessionCookie({
        uid: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: "ADMIN" as any,
      });

      await writeAudit(
        { uid: newUser.id, email: newUser.email, name: newUser.name, role: "ADMIN" as any },
        {
          aksi: "CREATE",
          modul: "SETUP",
          entitasId: newUser.id,
          detail: `Setup wizard — akun administrator pertama dibuat (${newUser.email})`,
          ip: req.headers.get("x-forwarded-for") || undefined,
        }
      );
    } else {
      // Admin already exists — re-run mode. Just log it.
      adminSkipped = true;
      await writeAudit(current!.session, {
        aksi: "UPDATE",
        modul: "SETUP",
        detail: "Setup wizard dijalankan ulang oleh admin — konfigurasi diperbarui",
        ip: req.headers.get("x-forwarded-for") || undefined,
      });
    }

    // ===== Save settings =====
    const settingsToUpsert: Record<string, string> = {
      app_name: app.appName.trim(),
      app_subtitle: app.appSubtitle?.trim() || "",
      kelurahan: app.kelurahan.trim(),
      nama_kelurahan: app.kelurahan.trim(),
      alamat_kantor: app.alamatKantor?.trim() || "",
      alamat_kelurahan: app.alamatKantor?.trim() || "",
      telepon_kelurahan: app.teleponKelurahan?.trim() || "",
      email_kelurahan: app.emailKelurahan?.trim() || "",
      // Public base URL — normalized to origin (no trailing slash) so QR codes
      // encode a clean tracking URL. Empty string is allowed (falls back to
      // request origin / env), but admin is encouraged to set it.
      public_base_url: normalizeBaseUrl(app.publicBaseUrl?.trim() || ""),
    };

    // Register format
    if (register) {
      const prefix = (register.prefix || "KPII-TNH").trim().toUpperCase();
      const digitCount = Math.max(4, Math.min(16, parseInt(register.digitCount || "8", 10) || 8));
      settingsToUpsert.register_prefix = prefix;
      settingsToUpsert.register_digit_count = String(digitCount);
      settingsToUpsert.register_use_random = register.useRandom ? "true" : "false";
    }

    // Notifications (optional)
    if (notifications) {
      settingsToUpsert.notify_wa_enabled = notifications.waEnabled ? "true" : "false";
      if (notifications.fonnteToken?.trim()) {
        settingsToUpsert.notify_fonnte_token = notifications.fonnteToken.trim();
      }
      settingsToUpsert.notify_email_enabled = notifications.emailEnabled ? "true" : "false";
      settingsToUpsert.notify_email_provider = notifications.emailProvider || "gmail";
      if (notifications.gmailUser?.trim()) {
        settingsToUpsert.notify_email_gmail_user = notifications.gmailUser.trim();
      }
      if (notifications.gmailAppPassword?.trim()) {
        settingsToUpsert.notify_email_gmail_app_password = notifications.gmailAppPassword.trim();
      }
    }

    // Footer (optional)
    if (footer) {
      if (footer.copyrightText?.trim()) {
        settingsToUpsert.footer_copyright_text = footer.copyrightText.trim();
      }
      if (footer.aboutText?.trim()) {
        settingsToUpsert.footer_about_text = footer.aboutText.trim();
      }
      if (footer.creditText?.trim()) {
        settingsToUpsert.footer_credit_text = footer.creditText.trim();
      }
      // Default service hours if not yet set
      settingsToUpsert.footer_service_hours_weekday =
        settingsToUpsert.footer_service_hours_weekday || "Senin - Jumat: 08.00 - 16.00 WIB";
      settingsToUpsert.footer_service_hours_saturday =
        settingsToUpsert.footer_service_hours_saturday || "Sabtu: 08.00 - 12.00 WIB";
      settingsToUpsert.footer_service_hours_sunday =
        settingsToUpsert.footer_service_hours_sunday || "Minggu & Hari Libur: Tutup";
    }

    // Mark setup as complete
    settingsToUpsert.setup_complete = "true";
    settingsToUpsert.setup_completed_at = new Date().toISOString();

    // Bulk upsert
    for (const [key, value] of Object.entries(settingsToUpsert)) {
      await db.settings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    // Bust the public-base-url cache so the next QR code renders with the
    // newly-configured domain (instead of waiting up to 60s for cache expiry).
    invalidatePublicBaseUrlCache();

    // ===== Seed master data if empty (StatusProses, JenisSurat, StatusPenguasaan) =====
    const seedPromises: Promise<unknown>[] = [];

    // Status Proses
    const existingStatus = await db.statusProses.count();
    if (existingStatus === 0) {
      for (const s of STATUS_DEFINITIONS) {
        seedPromises.push(
          db.statusProses.upsert({
            where: { kode: s.kode },
            update: {},
            create: {
              kode: s.kode,
              nama: s.nama,
              urutan: s.urutan,
              warna: s.warna,
              icon: s.icon,
              keterangan: s.keterangan,
              isKhusus: !!s.isKhusus,
              isFinal: !!s.isFinal,
            },
          })
        );
      }
    }

    // Jenis Surat
    const existingJenis = await db.jenisSurat.count();
    if (existingJenis === 0) {
      for (const j of JENIS_SURAT_SEED) {
        seedPromises.push(
          db.jenisSurat.upsert({
            where: { kode: j.kode },
            update: {},
            create: j,
          })
        );
      }
    }

    // Status Penguasaan
    const existingStatusPenguasaan = await db.statusPenguasaan.count();
    if (existingStatusPenguasaan === 0) {
      for (const s of STATUS_PENGUASAAN_SEED) {
        seedPromises.push(
          db.statusPenguasaan.upsert({
            where: { kode: s.kode },
            update: {},
            create: s,
          })
        );
      }
    }

    if (seedPromises.length > 0) {
      await Promise.all(seedPromises);
    }

    return NextResponse.json({
      ok: true,
      adminSkipped,
      adminCreated: !!createdAdmin,
      admin: createdAdmin,
      settingsCount: Object.keys(settingsToUpsert).length,
      masterSeeded: seedPromises.length > 0,
      setupComplete: true,
    });
  } catch (e: any) {
    console.error("setup complete error", e);
    return NextResponse.json(
      { error: e?.message || "Terjadi kesalahan server saat menyelesaikan setup." },
      { status: 500 }
    );
  }
}
