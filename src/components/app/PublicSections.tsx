"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, CheckCircle2, Loader, TrendingUp, Calendar, HelpCircle, FileCheck, MapPin, Clock, CreditCard, ShieldCheck } from "lucide-react";

export function PublicStatsBanner() {
  const [stats, setStats] = useState<{ total: number; selesai: number; diproses: number; thisMonth: number; completionRate: number } | null>(null);

  useEffect(() => {
    let active = true;
    api.publicStats()
      .then((r) => { if (active) setStats(r); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (!stats) {
    return (
      <div className="container mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl glass-card border-primary/15 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const items = [
    { label: "Total Permohonan", value: stats.total, icon: FileText, color: "#3b82f6" },
    { label: "Selesai Diproses", value: stats.selesai, icon: CheckCircle2, color: "#16a34a" },
    { label: "Sedang Diproses", value: stats.diproses, icon: Loader, color: "#0891b2" },
    { label: "Tingkat Penyelesaian", value: `${stats.completionRate}%`, icon: TrendingUp, color: "#d4af37" },
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4">
      <Card className="glass-card border-primary/20 overflow-hidden">
        <div className="h-1" style={{ background: "linear-gradient(90deg, #f5d77a, #d4af37, #b8941f, transparent)" }} />
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Transparansi Pelayanan Publik</h3>
                <p className="text-[10px] text-foreground/50">Data real-time dari sistem SI-TRACK TANAH</p>
              </div>
            </div>
            <span className="text-[10px] text-foreground/50 flex items-center gap-1.5 bg-primary/5 px-2.5 py-1 rounded-md border border-primary/15">
              <Calendar className="w-3 h-3" /> {stats.thisMonth} bulan ini
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {items.map((it) => {
              const Icon = it.icon;
              return (
                <div key={it.label} className="text-center p-4 rounded-xl bg-background/50 border border-border/30 hover:border-primary/30 transition-colors group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2.5 transition-transform group-hover:scale-110" style={{ backgroundColor: `${it.color}1a`, border: `1px solid ${it.color}40` }}>
                    <Icon className="w-5 h-5" style={{ color: it.color }} />
                  </div>
                  <p className="text-2xl font-extrabold tabular-nums" style={{ color: it.color }}>{it.value}</p>
                  <p className="text-[10px] text-foreground/55 uppercase tracking-wide mt-0.5 font-medium">{it.label}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const FAQS = [
  {
    q: "Apa itu SI-TRACK TANAH?",
    a: "SI-TRACK TANAH adalah sistem informasi yang memberikan transparansi kepada masyarakat mengenai tahapan proses surat tanah yang sedang diproses di Kelurahan Kuala Pembuang II. Aplikasi ini tidak menggantikan proses administrasi pertanahan maupun penerbitan sertifikat oleh instansi berwenang.",
  },
  {
    q: "Bagaimana cara melacak status surat tanah saya?",
    a: "Anda cukup memasukkan Nomor Register (contoh: KPII-TNH-2026-000001) yang tertera pada tanda terima, atau memindai QR Code pada tanda terima menggunakan kamera ponsel Anda. Sistem akan menampilkan status terbaru beserta riwayat proses.",
  },
  {
    q: "Dokumen apa saja yang perlu saya bawa saat mendaftar?",
    a: "Dokumen yang umumnya diperlukan: KTP, Kartu Keluarga (KK), SPPT PBB, Bukti Penguasaan Tanah, Surat Pernyataan, Foto Lokasi, dan dokumen pendukung lainnya. Format yang diterima: PDF, JPG, PNG. Petugas akan memberitahukan jika ada dokumen tambahan yang diperlukan sesuai jenis surat.",
  },
  {
    q: "Berapa lama proses pendaftaran surat tanah?",
    a: "Lama proses bervariasi tergantung jenis surat, kelengkapan dokumen, dan apakah diperlukan pengukuran lapangan atau pengesahan Camat. Anda dapat memantau perkembangan secara real-time melalui aplikasi ini. Estimasi rata-rata dapat dilihat di dashboard transparansi di atas.",
  },
  {
    q: "Apa yang harus saya lakukan jika status menunjukkan 'Perbaikan Dokumen'?",
    a: "Status 'Perbaikan Dokumen' berarti dokumen Anda belum lengkap. Silakan datang ke Kantor Kelurahan Kuala Pembuang II dengan membawa dokumen yang diminta sesuai catatan petugas. Setelah dokumen dilengkapi, proses akan dilanjutkan kembali.",
  },
  {
    q: "Apakah saya tetap perlu datang ke kantor untuk mengambil surat?",
    a: "Ya, setelah status menunjukkan 'Surat Selesai', surat siap diambil di Kantor Kelurahan. Pastikan membawa tanda terima dan identitas diri saat pengambilan. Aplikasi ini membantu Anda memantau proses tanpa harus repeatedly bertanya ke kantor.",
  },
];

export function FAQSection() {
  return (
    <div className="container mx-auto max-w-3xl px-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">FAQ</span>
        </div>
        <h2 className="text-2xl font-bold mb-1.5">Pertanyaan yang Sering Diajukan</h2>
        <p className="text-sm text-foreground/55">Informasi penting seputar layanan tracking surat tanah</p>
      </div>
      <Card className="glass-card border-primary/15">
        <CardContent className="p-4 sm:p-6">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border/40">
                <AccordionTrigger className="text-sm font-medium text-left hover:no-underline hover:text-primary py-3.5 transition-colors">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-foreground/60 leading-relaxed pb-4">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

const REQUIREMENTS = [
  { icon: FileCheck, label: "KTP", desc: "Kartu Tanda Penduduk pemohon" },
  { icon: FileCheck, label: "KK", desc: "Kartu Keluarga" },
  { icon: FileCheck, label: "SPPT PBB", desc: "Bukti pembayaran PBB" },
  { icon: FileCheck, label: "Bukti Penguasaan", desc: "Dokumen kepemilikan tanah" },
  { icon: FileCheck, label: "Surat Pernyataan", desc: "Pernyataan penguasaan tanah" },
  { icon: FileCheck, label: "Foto Lokasi", desc: "Foto kondisi tanah" },
];

export function RequirementsSection() {
  return (
    <div className="container mx-auto max-w-5xl px-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
            <FileCheck className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Persyaratan</span>
        </div>
        <h2 className="text-2xl font-bold mb-1.5">Dokumen yang Diperlukan</h2>
        <p className="text-sm text-foreground/55">Lengkapi dokumen berikut sebelum mendaftar untuk proses lebih cepat</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {REQUIREMENTS.map((r) => {
          const Icon = r.icon;
          return (
            <Card key={r.label} className="glass-card border-primary/15 card-hover text-center group">
              <CardContent className="p-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center mx-auto mb-2.5 transition-transform group-hover:scale-110">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-semibold">{r.label}</p>
                <p className="text-[10px] text-foreground/50 mt-0.5 leading-tight">{r.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-3.5 p-4 rounded-xl glass-card border-primary/10 card-hover group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold">Lokasi Kantor</p>
            <p className="text-[11px] text-foreground/55">Jl. Iskandar No. 1, Kuala Pembuang</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 p-4 rounded-xl glass-card border-primary/10 card-hover group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold">Jam Layanan</p>
            <p className="text-[11px] text-foreground/55">Senin–Jumat 08.00–15.00 WIB</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 p-4 rounded-xl glass-card border-primary/10 card-hover group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold">Biaya Layanan</p>
            <p className="text-[11px] text-foreground/55">Gratis — tidak dipungut biaya</p>
          </div>
        </div>
      </div>
    </div>
  );
}
