/**
 * Notification dispatcher — Email (Gmail SMTP / SMTP-API / log) + WhatsApp (Fonnte API).
 *
 * Fonnte is a popular Indonesian WhatsApp gateway (https://fonnte.com).
 * Send a POST to https://api.fonnte.com/send with `Authorization: <token>`
 * and form-data fields `target` (phone), `message` (text).
 *
 * Email sending supports three transports:
 *   1. `gmail` — direct SMTP to smtp.gmail.com:465 using nodemailer.
 *      Requires an App Password (16-char) since Google disabled plain password auth.
 *      Docs: https://support.google.com/accounts/answer/185833
 *   2. `smtp_api` — POST JSON to an external SMTP-to-HTTP bridge (Mailgun, SendGrid, …).
 *   3. `log` — dev mode, just prints to server console.
 */

import { db } from "@/lib/db";

export interface NotifyContext {
  nomorRegister: string;
  pemohonNama: string;
  pemohonHp: string | null;
  pemohonEmail?: string | null;
  statusNama: string;
  catatan?: string | null;
  alasanDitolak?: string | null;
  jenisSuratNama?: string;
  kelurahanNama?: string;
  kelurahanAlamat?: string;
  kelurahanTelepon?: string;
  kelurahanEmail?: string;
  appUrl?: string;
}

export type NotifyChannel = "email" | "wa";

export interface NotifyResult {
  channel: NotifyChannel;
  success: boolean;
  error?: string;
  recipient?: string;
}

/* ------------------------------------------------------------------ */
/* Settings loader (cached per-request)                                */
/* ------------------------------------------------------------------ */
export async function getNotifySettings(): Promise<Record<string, string>> {
  const items = await db.settings.findMany({
    where: {
      key: {
        startsWith: "notify_",
      },
    },
  });
  const map: Record<string, string> = {};
  for (const s of items) map[s.key] = s.value || "";
  return map;
}

/* ------------------------------------------------------------------ */
/* Template renderer                                                   */
/* ------------------------------------------------------------------ */
/**
 * Render a template string with {placeholder} substitution.
 * Supports any key from NotifyContext plus {tanggal} (today's date in id-ID).
 */
export function renderTemplate(template: string, ctx: NotifyContext): string {
  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const vars: Record<string, string> = {
    nomor_register: ctx.nomorRegister,
    pemohon_nama: ctx.pemohonNama,
    pemohon_hp: ctx.pemohonHp || "-",
    pemohon_email: ctx.pemohonEmail || "-",
    status_nama: ctx.statusNama,
    catatan: ctx.catatan || "-",
    alasan_ditolak: ctx.alasanDitolak || "-",
    jenis_surat: ctx.jenisSuratNama || "-",
    kelurahan_nama: ctx.kelurahanNama || "-",
    kelurahan_alamat: ctx.kelurahanAlamat || "-",
    kelurahan_telepon: ctx.kelurahanTelepon || "-",
    kelurahan_email: ctx.kelurahanEmail || "-",
    app_url: ctx.appUrl || "",
    tanggal: today,
  };
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

/* ------------------------------------------------------------------ */
/* WhatsApp via Fonnte                                                 */
/* ------------------------------------------------------------------ */
/**
 * Send a WhatsApp message via Fonnte API.
 * Phone must be in international format without leading "+" or "0"
 * (e.g., "6281234567890"). We normalize Indonesian numbers: strip leading
 * "0" and prepend "62".
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let p = phone.replace(/[^\d]/g, ""); // digits only
  if (!p) return null;
  if (p.startsWith("62")) return p;
  if (p.startsWith("0")) return "62" + p.slice(1);
  if (p.startsWith("8")) return "62" + p; // local "08xxx" without leading 0
  return p;
}

export async function sendWhatsApp(
  token: string,
  phone: string,
  message: string
): Promise<NotifyResult> {
  if (!token) {
    return { channel: "wa", success: false, error: "Fonnte API token belum dikonfigurasi" };
  }
  const target = normalizePhone(phone);
  if (!target) {
    return { channel: "wa", success: false, error: "Nomor telepon tidak valid" };
  }
  try {
    const fd = new FormData();
    fd.append("target", target);
    fd.append("message", message);
    fd.append("countryCode", "62");
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: token },
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.status === false) {
      return {
        channel: "wa",
        success: false,
        error: data?.message || data?.reason || `HTTP ${res.status}`,
        recipient: target,
      };
    }
    return { channel: "wa", success: true, recipient: target };
  } catch (e: any) {
    return {
      channel: "wa",
      success: false,
      error: e?.message || "Network error",
      recipient: target,
    };
  }
}

/* ------------------------------------------------------------------ */
/* Email — pluggable transport (Gmail SMTP / SMTP-API / log)            */
/* ------------------------------------------------------------------ */
/**
 * Send an email. Strategy:
 *   1. `gmail` — direct SMTP via nodemailer to smtp.gmail.com:465 (SSL).
 *      Uses `notify_email_gmail_user` + `notify_email_gmail_app_password`.
 *      Sender display name comes from `notify_email_from_name` (defaults to
 *      the kelurahan name).
 *   2. `smtp_api` — POST JSON {from, to, subject, html} to an external
 *      SMTP-to-HTTP bridge URL (Mailgun, SendGrid, Resend, SMTP2GO, …).
 *   3. `log` — dev mode, just prints to server console.
 */
export async function sendEmail(
  settings: Record<string, string>,
  to: string,
  subject: string,
  html: string
): Promise<NotifyResult> {
  if (!to) {
    return { channel: "email", success: false, error: "Alamat email penerima tidak tersedia" };
  }
  const provider = settings.notify_email_provider || "log";

  // Build the From header. For Gmail we MUST use the Gmail account address
  // as the envelope sender — the display name is configurable.
  const fromName = settings.notify_email_from_name || settings.nama_kelurahan || "SI-TRACK TANAH";
  const gmailUser = settings.notify_email_gmail_user || "";
  const fromGmail = gmailUser || settings.notify_email_from || settings.email_kelurahan || "no-reply@sitrac.local";
  const from = settings.notify_email_from || (gmailUser ? `${fromName} <${gmailUser}>` : settings.email_kelurahan || "no-reply@sitrac.local");

  // ===== Gmail SMTP via nodemailer =====
  if (provider === "gmail") {
    if (!gmailUser) {
      return { channel: "email", success: false, error: "Email Google (Gmail) belum dikonfigurasi — isi Gmail User di pengaturan." };
    }
    if (!settings.notify_email_gmail_app_password) {
      return { channel: "email", success: false, error: "App Password Google belum diisi. Buat di https://myaccount.google.com/apppasswords" };
    }
    try {
      // Lazy import so the dependency only loads when Gmail is actually used.
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true for 465, false for other ports (587 = STARTTLS)
        auth: {
          user: gmailUser,
          pass: settings.notify_email_gmail_app_password,
        },
      });
      const info = await transporter.sendMail({
        from: `${fromName} <${gmailUser}>`,
        to,
        subject,
        html,
        text: html.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, ""),
      });
      return { channel: "email", success: true, recipient: to, error: undefined };
    } catch (e: any) {
      // Common Gmail errors: 535-5.7.1 = bad app password, EAUTH = auth failed
      const msg = e?.message || "Gagal mengirim email via Gmail SMTP";
      let hint = msg;
      if (/535|5\.7\.1|EAUTH|invalid login|Username and Password not accepted/i.test(msg)) {
        hint = "Autentikasi Gmail gagal — periksa Gmail User & App Password. Pastikan 2FA aktif & gunakan App Password 16 karakter (bukan password biasa).";
      } else if (/EAUTH/i.test(msg) === false && /connect|ETIMEDOUT|ENOTFOUND|ECONNREFUSED/i.test(msg)) {
        hint = "Tidak dapat terhubung ke smtp.gmail.com — periksa koneksi internet / firewall.";
      }
      return { channel: "email", success: false, error: hint, recipient: to };
    }
  }

  // ===== SMTP API bridge =====
  if (provider === "smtp_api" && settings.notify_email_api_url) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (settings.notify_email_api_key) {
        headers.Authorization = `Bearer ${settings.notify_email_api_key}`;
      }
      const res = await fetch(settings.notify_email_api_url, {
        method: "POST",
        headers,
        body: JSON.stringify({ from, to, subject, html }),
      });
      const text = await res.text();
      if (!res.ok) {
        return {
          channel: "email",
          success: false,
          error: `SMTP API error: HTTP ${res.status} — ${text.slice(0, 200)}`,
          recipient: to,
        };
      }
      return { channel: "email", success: true, recipient: to };
    } catch (e: any) {
      return {
        channel: "email",
        success: false,
        error: e?.message || "SMTP API network error",
        recipient: to,
      };
    }
  }

  // Provider = "log" — dev mode, just print to server log
  console.log(`[EMAIL:LOG-MODE] To: ${to} | From: ${fromGmail} | Subject: ${subject}`);
  console.log(`[EMAIL:LOG-MODE] Body: ${html.slice(0, 500)}...`);
  return { channel: "email", success: true, recipient: to };
}

/* ------------------------------------------------------------------ */
/* Top-level dispatcher — fired by /api/permohonan/[id]/status route   */
/* ------------------------------------------------------------------ */
/**
 * Dispatch email + WhatsApp notifications for a permohonan status change.
 * Reads templates + credentials from Settings. Channels fire in parallel;
 * each result is recorded in the AuditLog for traceability.
 *
 * Returns the per-channel results so callers can surface them to the UI.
 */
export async function dispatchPermohonanNotification(
  permohonanId: string,
  triggerStatus: "REVISI" | "SELESAI",
  ctx: NotifyContext,
  actorUserId: string,
  opts: { force?: boolean } = {}
): Promise<NotifyResult[]> {
  const settings = await getNotifySettings();
  const results: NotifyResult[] = [];

  const emailEnabled = opts.force || (settings.notify_email_enabled ?? "true") === "true";
  const waEnabled = opts.force || (settings.notify_wa_enabled ?? "true") === "true";
  const fonnteToken = settings.notify_fonnte_token || "";

  // Pick template based on trigger
  const templateKey =
    triggerStatus === "SELESAI"
      ? { email: "notify_tpl_selesai_email", wa: "notify_tpl_selesai_wa", subject: "notify_tpl_selesai_subject" }
      : { email: "notify_tpl_revisi_email", wa: "notify_tpl_revisi_wa", subject: "notify_tpl_revisi_subject" };

  // Default templates (used if admin hasn't customized)
  const DEFAULT_SUBJECT =
    triggerStatus === "SELESAI"
      ? "Surat Tanah Anda Telah Selesai — {nomor_register}"
      : "Permohonan Surat Tanah Memerlukan Kelengkapan Dokumen — {nomor_register}";

  const DEFAULT_EMAIL =
    triggerStatus === "SELESAI"
      ? `Yth. {pemohon_nama},\n\nKabar baik! Permohonan surat tanah Anda dengan Nomor Register {nomor_register} telah SELESAI diproses.\n\nJenis Surat: {jenis_surat}\nStatus: {status_nama}\nTanggal: {tanggal}\n\nSilakan mengunjungi {kelurahan_nama} untuk mengambil surat Anda. Bawalah tanda terima permohonan dan dokumen identitas asli.\n\nAlamat: {kelurahan_alamat}\nTelepon: {kelurahan_telepon}\nEmail: {kelurahan_email}\n\nTerima kasih atas kepercayaan Anda.\n\nHormat kami,\n{kelurahan_nama}`
      : `Yth. {pemohon_nama},\n\nPermohonan surat tanah Anda dengan Nomor Register {nomor_register} memerlukan kelengkapan dokumen.\n\nJenis Surat: {jenis_surat}\nStatus: {status_nama}\nCatatan: {catatan}\nTanggal: {tanggal}\n\nMohon segera melengkapi dokumen yang diminta dengan mengunjungi {kelurahan_nama} atau menghubungi petugas kami.\n\nAlamat: {kelurahan_alamat}\nTelepon: {kelurahan_telepon}\nEmail: {kelurahan_email}\n\nTerima kasih.\n\nHormat kami,\n{kelurahan_nama}`;

  const DEFAULT_WA =
    triggerStatus === "SELESAI"
      ? `*{kelurahan_nama}*\n\nYth. {pemohon_nama},\n\nKabar baik! Permohonan surat tanah Anda dengan Nomor Register *{nomor_register}* telah *SELESAI* diproses.\n\nJenis Surat: {jenis_surat}\nTanggal: {tanggal}\n\nSilakan ambil surat Anda di {kelurahan_alamat}. Bawa tanda terima & KTP asli.\n\nTerima kasih. 🙏`
      : `*{kelurahan_nama}*\n\nYth. {pemohon_nama},\n\nPermohonan surat tanah Anda dengan Nomor Register *{nomor_register}* memerlukan *kelengkapan dokumen*.\n\nCatatan: {catatan}\nTanggal: {tanggal}\n\nMohon segera lengkapi dokumen yang diminta. Hubungi {kelurahan_telepon} untuk info lebih lanjut.\n\nTerima kasih. 🙏`;

  const subjectTemplate = settings[templateKey.subject] || DEFAULT_SUBJECT;
  const emailTemplate = settings[templateKey.email] || DEFAULT_EMAIL;
  const waTemplate = settings[templateKey.wa] || DEFAULT_WA;

  const subject = renderTemplate(subjectTemplate, ctx);
  const emailBody = renderTemplate(emailTemplate, ctx);
  const waBody = renderTemplate(waTemplate, ctx);
  const emailHtml = emailBody.replace(/\n/g, "<br/>");

  // Fire both channels in parallel
  const tasks: Promise<NotifyResult>[] = [];
  if (emailEnabled && ctx.pemohonEmail) {
    tasks.push(sendEmail(settings, ctx.pemohonEmail, subject, emailHtml));
  } else if (emailEnabled && !ctx.pemohonEmail) {
    tasks.push(
      Promise.resolve<NotifyResult>({
        channel: "email",
        success: false,
        error: "Pemohon tidak memiliki alamat email",
      })
    );
  }
  if (waEnabled && ctx.pemohonHp) {
    tasks.push(sendWhatsApp(fonnteToken, ctx.pemohonHp, waBody));
  } else if (waEnabled && !ctx.pemohonHp) {
    tasks.push(
      Promise.resolve<NotifyResult>({
        channel: "wa",
        success: false,
        error: "Pemohon tidak memiliki nomor HP",
      })
    );
  }

  const settled = await Promise.all(tasks);
  results.push(...settled);

  // Persist a single audit-log entry summarizing the dispatch
  const summary = results
    .map((r) => `${r.channel.toUpperCase()}: ${r.success ? "OK" : `FAIL (${r.error})`}`)
    .join(" | ");
  await db.auditLog.create({
    data: {
      userId: actorUserId,
      aksi: "NOTIFY",
      modul: "PERMOHONAN",
      entitasId: permohonanId,
      detail: `Notifikasi ${triggerStatus} → ${summary}`,
    },
  });

  return results;
}
