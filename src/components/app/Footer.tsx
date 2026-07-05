"use client";
import { Logo } from "./Logo";
import { MapPin, Mail, Phone, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/40 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <Logo size={36} />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sistem Informasi Tracking Pendaftaran Surat Tanah. Memberikan transparansi pelayanan publik bagi masyarakat Kelurahan Kuala Pembuang II.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 gold-text">Kontak Kami</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary/70" />
                <span>Jl. Iskandar No. 1, Kuala Pembuang, Seruyan, Kalimantan Tengah 74211</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0 text-primary/70" />
                <span>(0532) 000-0000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0 text-primary/70" />
                <span>kelurahan@kualapembuang2.go.id</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 gold-text">Jam Pelayanan</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-primary/70" />
                <span>Senin – Jumat: 08.00 – 15.00 WIB</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-primary/70" />
                <span>Sabtu: 08.00 – 12.00 WIB</span>
              </li>
              <li className="text-xs pt-2 text-muted-foreground/70">
                Aplikasi ini bersifat transparansi pelacakan, bukan pengganti proses administrasi pertanahan resmi.
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Pemerintah Kelurahan Kuala Pembuang II. Hak Cipta Dilindungi.
          </p>
          <p className="text-xs text-muted-foreground/70">
            Dibuat dengan <span className="gold-text font-semibold">SI-TRACK TANAH</span> · v1.0
          </p>
        </div>
      </div>
    </footer>
  );
}
