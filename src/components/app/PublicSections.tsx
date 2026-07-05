"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, Loader, TrendingUp, Calendar, HelpCircle, FileCheck, MapPin, Clock, CreditCard, ShieldCheck, Scale, Download, Banknote, AlertCircle, ListChecks, FileSignature, Users, MapPinned, ClipboardList, Sticker } from "lucide-react";

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
    a: "Anda cukup memasukkan Nomor Register (contoh: KPII-TNH-2026-XK7M2P9Q) yang tertera pada tanda terima, atau memindai QR Code pada tanda terima menggunakan kamera ponsel Anda. Sistem akan menampilkan status terbaru beserta riwayat proses. Nomor register menggunakan format acak agar tidak dapat ditebak orang lain — jaga kerahasiaan nomor register Anda.",
  },
  {
    q: "Dokumen apa saja yang perlu saya bawa saat mendaftar?",
    a: "Dokumen yang umumnya diperlukan: KTP, Kartu Keluarga (KK), SPPT PBB, Bukti Penguasaan Tanah, Surat Pernyataan, Foto Lokasi, dan dokumen pendukung lainnya. Format yang diterima: PDF, JPG, PNG. Petugas akan memberitahukan jika ada dokumen tambahan yang diperlukan sesuai jenis surat. Untuk detail syarat SPPT/SPPPT sesuai Perbub Seruyan No. 45 Tahun 2017 (Pasal 6 & 7), lihat bagian Dasar Hukum & Regulasi di bawah.",
  },
  {
    q: "Berapa biaya pendaftaran tanah dan berapa materai yang diperlukan?",
    a: "Sesuai Perbup Seruyan No. 45 Tahun 2017 (BAB III Pasal 3), biaya operasional pendaftaran tanah sistematis lengkap adalah Rp. 250.000,00 yang dibayarkan kepada Petugas Desa/Kelurahan (untuk penggandaan dokumen, pengukuran, dan transportasi). Biaya ini tidak termasuk pembuatan akta, BPHTB, dan PPh. Materai yang diperlukan untuk SPPT/SPPPT adalah Rp. 10.000,- sesuai keperluan. Anda dapat mengunduh dokumen Perbub lengkap di bagian Dasar Hukum & Regulasi.",
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
            <p className="text-xs font-semibold">Biaya Operasional</p>
            <p className="text-[11px] text-foreground/55">Rp. 250.000 — sesuai Perbup No. 45/2017</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   REGULATION SECTION — Perbup Seruyan No. 45 Tahun 2017
   BAB III Pembiayaan (Pasal 3 poin 1-3) +
   BAB IV Bagian Kedua Syarat-syarat (Pasal 6-8)
   Materai diperbarui ke Rp. 10.000
   ============================================================ */

const PERBUB_INFO = {
  judul: "Peraturan Bupati Seruyan Nomor 45 Tahun 2017",
  subjudul: "Pelaksanaan dan Pembiayaan Pendaftaran Tanah Sistematis Lengkap",
  penandatangan: "Bupati Seruyan (Sudarsono)",
  sekretaris: "Sekretaris Daerah (Haryono)",
  tanggalDitetapkan: "4 Desember 2017",
  tanggalDiundangkan: "6 Desember 2017",
  beritaDaerah: "Berita Daerah Kabupaten Seruyan Tahun 2017 Nomor 45",
  pdfUrl: "/regulasi/Perbub-Seruyan-No-45-Tahun-2017-Pendaftaran-Tanah-Sistematis-Lengkap.pdf",
};

// BAB III — PEMBIAYAAN (Pasal 3, poin 1-3)
const PEMBIAYAAN = [
  {
    no: 1,
    icon: Banknote,
    judul: "Pembiayaan Operasional",
    nominal: "Rp. 250.000,00",
    desc: "Dibayarkan pemohon kepada Petugas Desa/Kelurahan, dengan penggunaan:",
    rincian: [
      "Biaya penggandaan dokumen/dokumen pendukung",
      "Biaya pengangkutan, pengukuran dan pemasangan patok",
      "Biaya transportasi Petugas Desa/Kelurahan untuk proses registrasi ke Kecamatan pulang pergi sampai selesai",
    ],
  },
  {
    no: 2,
    icon: AlertCircle,
    judul: "Tidak Termasuk Dalam Biaya Operasional",
    desc: "Pembiayaan operasional tersebut tidak termasuk untuk biaya:",
    rincian: [
      "Pembuatan Akta",
      "Bea Perolehan Hak atas Tanah dan Bangunan (BPHTB)",
      "Pajak Penghasilan (PPh)",
    ],
  },
  {
    no: 3,
    icon: MapPinned,
    judul: "Lokasi Jauh / Transportasi Khusus",
    desc: "Untuk pengukuran, bila lokasi bidang tanah yang dimohonkan berada jauh dan/atau harus menggunakan moda transportasi khusus (misal moda transportasi air), maka pemohon wajib menyediakan alat transportasi tersebut yang menjadi tanggung jawabnya dalam pembiayaan.",
    rincian: [],
  },
];

// BAB IV — Bagian Kedua SYARAT-SYARAT
// Pasal 6: SPPT (3 jenis)
const PASAL_6_SPPT = [
  {
    jenis: "SPPT Tangan Pertama",
    desc: "Tanah dari pemilik/penggarap pertama",
    syarat: [
      "Foto Copy Kartu Tanda Penduduk (KTP) pemohon",
      "Foto Copy Kartu Keluarga (KK) pemohon",
      "Foto Copy KTP saksi-saksi sebatas bidang tanah yang dimohonkan",
      "Surat Pernyataan Tanah Tidak Bersengketa",
      "Bukti Lunas pembayaran PBB-P2 tahun berjalan (terakhir) / Surat Pernyataan Bersedia Membayar PBB Terutang",
      "Materai Rp. 10.000,- sesuai keperluan",
    ],
  },
  {
    jenis: "SPPT Jual Beli",
    desc: "Tanah hasil pembelian/ganti rugi yang belum dibuatkan SPPT-nya",
    syarat: [
      "Foto Copy KTP pemohon",
      "Foto Copy KK pemohon",
      "Foto Copy KTP suami isteri dari penjual/pemilik bidang tanah",
      "Surat Pernyataan Tanggung Jawab Mutlak dari penjual (Lampiran I)",
      "Kwitansi asli bermaterai cukup atas pembelian bidang tanah",
      "Foto Copy KTP saksi-saksi sebatas bidang tanah yang dimohonkan",
      "Surat Pernyataan Tanah Tidak Bersengketa",
      "Bukti Lunas PBB-P2 tahun berjalan / Surat Pernyataan Bersedia Membayar PBB-P2",
      "Materai Rp. 10.000,- sesuai keperluan",
    ],
  },
  {
    jenis: "SPPT Hibah/Waris",
    desc: "Tanah dari perolehan Hibah atau Warisan yang belum dibuatkan SPPT-nya",
    syarat: [
      "Foto Copy KTP pemohon",
      "Foto Copy KK pemohon",
      "Foto Copy KTP suami isteri dari Pemberi Hibah/Waris/pemilik bidang tanah",
      "Berita Acara Hibah Bidang Tanah ditandatangani kedua belah pihak & bermaterai cukup (untuk Hibah)",
      "Surat Keterangan Ahli Waris dari Kepala Desa/Lurah tempat domisili Ahli Waris",
      "Surat Persetujuan Ahli Waris yang diketahui Kepala Desa/Lurah",
      "Foto Copy KTP Ahli Waris dan saksi-saksi sebatas bidang tanah",
      "Bukti Lunas PBB-P2 tahun berjalan / Surat Pernyataan Bersedia Membayar PBB-P2",
      "Materai Rp. 10.000,- sesuai keperluan",
    ],
  },
];

// Pasal 7: SPPPT (2 jenis)
const PASAL_7_SPPPT = [
  {
    jenis: "SPPPT Jual Beli",
    desc: "Tanah dari jual beli yang sudah ada SPPT-nya",
    syarat: [
      "Foto Copy KTP pemohon",
      "Foto Copy KK pemohon",
      "Asli SPPT/SPT yang dimohonkan",
      "Foto Copy KTP suami isteri dari penjual/pemilik bidang tanah",
      "Kwitansi asli bermaterai cukup atas pembelian bidang tanah",
      "Foto Copy KTP saksi-saksi sebatas bidang tanah yang dimohonkan",
      "Bukti Lunas PBB-P2 tahun berjalan / Surat Pernyataan Bersedia Membayar PBB-P2",
      "Materai Rp. 10.000,- sesuai keperluan",
    ],
  },
  {
    jenis: "SPPPT Hibah/Waris",
    desc: "Tanah dari Hibah/Warisan yang sudah ada SPPT-nya",
    syarat: [
      "Foto Copy KTP pemohon",
      "Foto Copy KK pemohon",
      "Asli SPPT/SPT yang dimohonkan",
      "Berita Acara Hibah Bidang Tanah ditandatangani kedua belah pihak & bermaterai cukup (untuk Hibah)",
      "Surat Keterangan Ahli Waris dari Kepala Desa/Lurah tempat domisili Ahli Waris",
      "Surat Persetujuan Ahli Waris yang diketahui Kepala Desa/Lurah",
      "Foto Copy KTP suami isteri dari Pemberi Hibah/Ahli Waris Penguasaan bidang tanah pertama",
      "Foto Copy KTP Ahli Waris dan saksi-saksi sebatas bidang tanah",
      "Bukti Lunas PBB-P2 tahun berjalan / Surat Pernyataan Bersedia Membayar PBB-P2",
      "Materai Rp. 10.000,- sesuai keperluan",
    ],
  },
];

// Pasal 8: Tata Cara Pendaftaran (10 langkah)
const PASAL_8_TATA_CARA = [
  { step: 1, title: "Mengajukan Permohonan", desc: "Pemohon yang ingin mendaftarkan pernyataan penguasaan tanah secara administrasi harus mengajukan permohonan kepada Kepala Desa/Lurah di mana lokasi bidang tanahnya berada." },
  { step: 2, title: "Mengisi Formulir", desc: "Permohonan dilakukan tertulis dengan mengisi formulir (tulis tangan) yang sudah disiapkan di kantor desa/kelurahan, dengan melengkapi persyaratan yang ditentukan." },
  { step: 3, title: "Pemasangan Pengumuman", desc: "Apabila persyaratan telah lengkap dan disetujui Kepala Desa/Lurah, pihak pemohon dan Desa/Kelurahan memasang Pengumuman selama 30 hari kalender pada lokasi bidang tanah yang dimohonkan." },
  { step: 4, title: "Penanganan Klaim", desc: "Apabila dalam 30 hari kalender terdapat laporan/pengajuan klaim kepemilikan dari orang lain, maka harus diselesaikan/mediasi terlebih dahulu serta penundaan pengukuran dan proses lainnya." },
  { step: 5, title: "Surat Tugas Pengukuran", desc: "Apabila dalam 30 hari tidak terdapat klaim, pada hari ke-31 atau lebih Kepala Desa/Lurah mengeluarkan Surat Tugas untuk melakukan pengukuran, kemudian dibuatkan Berita Acara Pengukuran dan Sket/Gambar Hasil Pengukuran." },
  { step: 6, title: "Penomoran Koordinat GPS", desc: "Pada Bidang Tanah yang dimohonkan dilakukan Penomoran Titik Koordinat menggunakan receiver GPS dan ditulis pada Sket/Gambar Bidang Tanah." },
  { step: 7, title: "Pembuatan SPPT/SPPPT", desc: "Apabila Berita Acara Pengukuran sudah dibuat dan ditandatangani petugas ukur, pihak-pihak dan saksi-saksi, maka pemohon membuat SPPPT dan/atau SPPT bermaterai, ditandatangani oleh pihak-pihak dan saksi-saksi kemudian diregister di Desa/Kelurahan dan Kecamatan." },
  { step: 8, title: "Format SPPT & SPPPT", desc: "Format SPPT sebagaimana tercantum dalam Lampiran III dan SPPPT sebagaimana tercantum dalam Lampiran IV yang disediakan oleh Kepala Desa/Lurah." },
  { step: 9, title: "Bagian Tidak Terpisahkan", desc: "Lampiran III dan Lampiran IV merupakan satu kesatuan dan bagian yang tidak terpisahkan dari Peraturan Bupati ini." },
  { step: 10, title: "Ketentuan Teknis", desc: "Hal-hal yang belum diatur dalam Peraturan Bupati ini sepanjang mengenai teknis pelaksanaan, dapat ditetapkan lebih lanjut dalam Keputusan Camat." },
];

function SyaratCard({ jenis, desc, syarat }: { jenis: string; desc: string; syarat: string[] }) {
  return (
    <Card className="glass-card border-primary/15 card-hover">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
            <FileSignature className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold leading-tight">{jenis}</h4>
            <p className="text-[11px] text-foreground/55 mt-0.5 leading-snug">{desc}</p>
          </div>
        </div>
        <ol className="space-y-1.5">
          {syarat.map((s, i) => {
            const isMaterai = s.toLowerCase().includes("materai");
            return (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] mt-0.5 ${isMaterai ? "bg-amber-500/20 text-amber-500 border border-amber-500/40" : "bg-primary/10 text-primary border border-primary/20"}`}>
                  {String.fromCharCode(97 + i)}
                </span>
                <span className={isMaterai ? "text-foreground font-semibold" : "text-foreground/70"}>
                  {s}
                  {isMaterai && <Sticker className="inline-block w-3 h-3 ml-1 text-amber-500" />}
                </span>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

export function RegulationSection() {
  return (
    <div className="container mx-auto max-w-5xl px-4">
      {/* Section header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Scale className="w-4 h-4 text-primary" />
          </div>
          <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Dasar Hukum &amp; Regulasi</span>
        </div>
        <h2 className="text-2xl font-bold mb-1.5">Peraturan Bupati Seruyan Tentang Pendaftaran Tanah</h2>
        <p className="text-sm text-foreground/55 max-w-2xl mx-auto">
          Transparansi penuh atas dasar hukum pendaftaran tanah sistematis lengkap di Kabupaten Seruyan.
          Pelajari biaya, syarat, dan tata cara sesuai peraturan yang berlaku.
        </p>
      </div>

      {/* Regulation metadata card */}
      <Card className="glass-card border-primary/25 overflow-hidden mb-6">
        <div className="h-1" style={{ background: "linear-gradient(90deg, #f5d77a, #d4af37, #b8941f, transparent)" }} />
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="outline" className="gold-border text-primary bg-primary/10 px-2.5 py-1 text-[10px] font-bold">
                  <Scale className="w-3 h-3 mr-1" /> PERATURAN BUPATI SERUYAN
                </Badge>
                <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold">
                  No. 45 Tahun 2017
                </Badge>
              </div>
              <h3 className="text-lg font-extrabold leading-tight mb-1">
                Pelaksanaan dan Pembiayaan Pendaftaran Tanah Sistematis Lengkap
              </h3>
              <p className="text-xs text-foreground/55 mb-3">{PERBUB_INFO.beritaDaerah}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                  <span className="text-foreground/60">Ditetapkan:</span>
                  <span className="font-semibold">{PERBUB_INFO.tanggalDitetapkan}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                  <span className="text-foreground/60">Diundangkan:</span>
                  <span className="font-semibold">{PERBUB_INFO.tanggalDiundangkan}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                  <span className="text-foreground/60">Bupati:</span>
                  <span className="font-semibold">Sudarsono</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileSignature className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                  <span className="text-foreground/60">Sekda:</span>
                  <span className="font-semibold">Haryono</span>
                </div>
              </div>
            </div>
            <div className="shrink-0 flex flex-col gap-2 justify-center">
              <a href={PERBUB_INFO.pdfUrl} download target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90 shadow-lg shadow-primary/20">
                  <Download className="w-4 h-4 mr-2" /> Unduh PDF Lengkap
                </Button>
              </a>
              <a href={PERBUB_INFO.pdfUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/10 text-xs">
                  <FileText className="w-3.5 h-3.5 mr-1.5" /> Baca Dokumen
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key highlights callout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Banknote, label: "Biaya Operasional", value: "Rp. 250.000", sub: "dibayar ke Petugas Desa", color: "#16a34a" },
          { icon: Sticker, label: "Materai", value: "Rp. 10.000", sub: "sesuai keperluan", color: "#d4af37" },
          { icon: Calendar, label: "Pengumuman", value: "30 Hari", sub: "kalender di lokasi", color: "#0891b2" },
          { icon: ShieldCheck, label: "Jenis SPPT", value: "3 Jenis", sub: "+ 2 jenis SPPPT", color: "#3b82f6" },
        ].map((h) => {
          const Icon = h.icon;
          return (
            <div key={h.label} className="text-center p-3.5 rounded-xl glass-card border-primary/15 card-hover group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 transition-transform group-hover:scale-110" style={{ backgroundColor: `${h.color}1a`, border: `1px solid ${h.color}40` }}>
                <Icon className="w-4.5 h-4.5" style={{ color: h.color }} />
              </div>
              <p className="text-base font-extrabold tabular-nums" style={{ color: h.color }}>{h.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5">{h.label}</p>
              <p className="text-[9px] text-foreground/45 mt-0.5 leading-tight">{h.sub}</p>
            </div>
          );
        })}
      </div>

      {/* BAB III — PEMBIAYAAN */}
      <Card className="glass-card border-primary/20 mb-6 overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-transparent" />
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">BAB III — PEMBIAYAAN</h3>
              <p className="text-[11px] text-foreground/55">Pasal 3 (Poin 1–3) · Biaya pendaftaran tanah sistematis lengkap</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {PEMBIAYAAN.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.no} className="p-4 rounded-xl bg-background/40 border border-border/30 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">Poin {p.no}</span>
                  </div>
                  <h4 className="text-sm font-bold mb-1.5 leading-tight">{p.judul}</h4>
                  {p.nominal && (
                    <div className="mb-2 p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                      <p className="text-lg font-extrabold text-green-400 tabular-nums">{p.nominal}</p>
                    </div>
                  )}
                  <p className="text-xs text-foreground/60 leading-relaxed mb-2">{p.desc}</p>
                  {p.rincian.length > 0 && (
                    <ul className="space-y-1">
                      {p.rincian.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-foreground/65 leading-snug">
                          <CheckCircle2 className="w-3 h-3 text-green-400/70 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* BAB IV — Bagian Kedua SYARAT-SYARAT (Pasal 6-8) */}
      <Card className="glass-card border-primary/20 overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-transparent" />
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
              <ListChecks className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">BAB IV — JENIS, SYARAT-SYARAT DAN TATA CARA</h3>
              <p className="text-[11px] text-foreground/55">Bagian Kedua: Syarat-syarat (Pasal 6–8)</p>
            </div>
          </div>

          <Tabs defaultValue="pasal6" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 bg-background/50 border border-primary/15 h-auto">
              <TabsTrigger value="pasal6" className="text-xs py-2 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                <FileCheck className="w-3.5 h-3.5 mr-1.5" /> Pasal 6 — SPPT
              </TabsTrigger>
              <TabsTrigger value="pasal7" className="text-xs py-2 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                <FileSignature className="w-3.5 h-3.5 mr-1.5" /> Pasal 7 — SPPPT
              </TabsTrigger>
              <TabsTrigger value="pasal8" className="text-xs py-2 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                <ClipboardList className="w-3.5 h-3.5 mr-1.5" /> Pasal 8 — Tata Cara
              </TabsTrigger>
            </TabsList>

            {/* Pasal 6 — SPPT */}
            <TabsContent value="pasal6" className="space-y-3 mt-0">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-foreground/70 leading-relaxed">
                  <span className="font-bold text-primary">Pasal 6.</span> Syarat-syarat permohonan pendaftaran tanah atas dasar
                  <span className="font-semibold"> SPPT (Surat Pernyataan Penguasaan Tanah)</span>, antara lain:
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {PASAL_6_SPPT.map((s) => (
                  <SyaratCard key={s.jenis} {...s} />
                ))}
              </div>
            </TabsContent>

            {/* Pasal 7 — SPPPT */}
            <TabsContent value="pasal7" className="space-y-3 mt-0">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-foreground/70 leading-relaxed">
                  <span className="font-bold text-primary">Pasal 7.</span> Syarat-syarat permohonan pendaftaran tanah atas dasar
                  <span className="font-semibold"> SPPPT (Surat Pernyataan Pemindahan Penguasaan Tanah)</span>, antara lain:
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {PASAL_7_SPPPT.map((s) => (
                  <SyaratCard key={s.jenis} {...s} />
                ))}
              </div>
            </TabsContent>

            {/* Pasal 8 — Tata Cara */}
            <TabsContent value="pasal8" className="space-y-3 mt-0">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-foreground/70 leading-relaxed">
                  <span className="font-bold text-primary">Pasal 8.</span> Tata cara pendaftaran tanah atas dasar SPPT dan SPPPT, antara lain:
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PASAL_8_TATA_CARA.map((t) => (
                  <div key={t.step} className="flex items-start gap-3 p-3 rounded-lg bg-background/40 border border-border/30 hover:border-primary/30 transition-colors">
                    <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#f5d77a] to-[#d4af37] text-[#0a1628] flex items-center justify-center font-extrabold text-xs">
                      {t.step}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-tight mb-0.5">{t.title}</p>
                      <p className="text-[11px] text-foreground/60 leading-snug">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Transparency footer note */}
      <div className="mt-5 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-foreground/65 leading-relaxed">
          <span className="font-semibold text-foreground">Catatan Transparansi:</span> Informasi di atas merupakan ringkasan
          BAB III (Pasal 3 poin 1–3) dan BAB IV Bagian Kedua (Pasal 6–8) dari {PERBUB_INFO.judul}. Untuk dokumen
          peraturan lengkap beserta lampiran-lampirannya, silakan unduh PDF resmi. Materai telah disesuaikan menjadi
          <span className="font-semibold text-amber-500"> Rp. 10.000,- </span>
          sesuai ketentuan berlaku untuk memudahkan masyarakat.
        </p>
      </div>
    </div>
  );
}
