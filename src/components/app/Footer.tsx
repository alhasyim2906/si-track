"use client";
import { Logo } from "./Logo";
import { MapPin, Mail, Phone, Clock, Heart, ExternalLink, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-4">
            <Logo size={36} />
            <p className="text-sm text-foreground/55 leading-relaxed">
              Sistem Informasi Tracking Pendaftaran Surat Tanah. Memberikan transparansi pelayanan publik bagi masyarakat Kelurahan Kuala Pembuang II.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-semibold gold-text">Resmi & Terpercaya</p>
                <p className="text-[9px] text-foreground/40">Pemerintah Kabupaten Seruyan</p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 gold-text flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Kontak Kami
            </h4>
            <ul className="space-y-3 text-sm text-foreground/55">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary/50" />
                <span>Jl. Iskandar No. 1, Kuala Pembuang, Seruyan, Kalimantan Tengah 74211</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 shrink-0 text-primary/50" />
                <span>(0532) 000-0000</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 shrink-0 text-primary/50" />
                <span>kelurahan@kualapembuang2.go.id</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 gold-text flex items-center gap-2">
              <Clock className="w-4 h-4" /> Jam Pelayanan
            </h4>
            <ul className="space-y-3 text-sm text-foreground/55">
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 shrink-0 text-primary/50" />
                <span>Senin – Jumat: 08.00 – 15.00 WIB</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 shrink-0 text-primary/50" />
                <span>Sabtu: 08.00 – 12.00 WIB</span>
              </li>
              <li className="flex items-center gap-2.5 text-foreground/40">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Minggu & Hari Libur: Tutup</span>
              </li>
            </ul>
          </div>
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
        </div>
        <div className="mt-8 pt-6 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-foreground/45">
            © {new Date().getFullYear()} Pemerintah Kelurahan Kuala Pembuang II. Hak Cipta Dilindungi.
          </p>
          <p className="text-xs text-foreground/35 flex items-center gap-1">
            Dibuat dengan <Heart className="w-3 h-3 text-primary/60 inline" /> oleh <span className="gold-text font-semibold">SI-TRACK TANAH</span> · v1.0
          </p>
        </div>
      </div>
    </footer>
  );
}
