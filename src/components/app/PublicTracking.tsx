"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { STATUS_BY_KODE } from "@/lib/constants";
import { Timeline, ProgressBar } from "./Timeline";
import { StatusBadge, PriorityBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Search, QrCode, Loader2, FileSearch, MapPin, User, Calendar,
  CheckCircle2, XCircle, AlertTriangle, Clock, FileText, ArrowRight, Info, Ruler, Building2,
} from "lucide-react";
import type { TrackingResult } from "@/lib/types";

export function PublicTracking({ initialRegister, onLoginClick }: { initialRegister?: string; onLoginClick?: () => void }) {
  const [query, setQuery] = useState(initialRegister || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const doSearch = useCallback(async (reg: string) => {
    const v = reg.trim().toUpperCase();
    if (!v) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSearched(true);
    try {
      const r = await api.track(v);
      setResult(r);
    } catch (e: any) {
      setError(e.message || "Nomor register tidak ditemukan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialRegister) {
      setQuery(initialRegister);
      doSearch(initialRegister);
    }
  }, [initialRegister, doSearch]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto max-w-5xl px-4 pt-14 pb-10 text-center">
          <Badge variant="outline" className="mb-4 gold-border text-primary bg-primary/5">
            <Building2 className="w-3 h-3 mr-1" /> Pemerintah Kelurahan Kuala Pembuang II
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            Lacak Status <span className="gold-gradient-text">Surat Tanah</span> Anda
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Pantau proses pendaftaran surat tanah secara real-time. Cukup masukkan
            <span className="gold-text font-semibold"> Nomor Register</span> yang Anda terima,
            atau pindai QR Code pada tanda terima.
          </p>
        </div>
      </section>

      {/* Search */}
      <section className="container mx-auto max-w-3xl px-4 -mt-4">
        <Card className="glass-card navy-glow border-primary/25">
          <CardContent className="p-4 sm:p-5">
            <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Contoh: KPII-TNH-2026-000001"
                  className="pl-9 h-11 bg-background/60 uppercase font-mono tracking-wide"
                  autoComplete="off"
                />
              </div>
              <Button type="submit" disabled={loading} className="h-11 bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90 px-6">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Lacak
              </Button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
              <QrCode className="w-3.5 h-3.5" />
              <span>Atau pindai QR Code pada tanda terima Anda.</span>
              <span className="text-muted-foreground/50">·</span>
              <span>Coba:</span>
              {["KPII-TNH-2026-000001", "KPII-TNH-2026-000002", "KPII-TNH-2026-000003"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setQuery(r); doSearch(r); }}
                  className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Result */}
      <section className="container mx-auto max-w-5xl px-4 py-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
            <p className="text-sm">Mencari data permohonan...</p>
          </div>
        )}

        {!loading && error && (
          <Card className="glass-card border-destructive/30">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                <FileSearch className="w-7 h-7 text-destructive" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Nomor Register Tidak Ditemukan</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">{error}</p>
              <p className="text-xs text-muted-foreground/70 mt-2">
                Pastikan penulisan nomor register sesuai dengan yang tertera pada tanda terima.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && !result && !searched && (
          <EmptyState onLoginClick={onLoginClick} />
        )}

        {!loading && !error && result && <TrackingResultView result={result} />}
      </section>
    </div>
  );
}

function EmptyState({ onLoginClick }: { onLoginClick?: () => void }) {
  const steps = [
    { icon: FileText, title: "1. Ajukan Permohonan", desc: "Datang ke Kelurahan dengan dokumen lengkap." },
    { icon: Search, title: "2. Dapat Nomor Register", desc: "Petugas memberikan nomor register unik." },
    { icon: QrCode, title: "3. Lacak Real-time", desc: "Pantau proses dari rumah via nomor/QR." },
    { icon: CheckCircle2, title: "4. Surat Selesai", desc: "Ambil surat saat status selesai." },
  ];
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-center mb-1">Cara Melacak Surat Tanah</h2>
        <p className="text-center text-sm text-muted-foreground">Empat langkah mudah mengetahui status surat Anda</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="glass-card border-primary/15 hover:gold-border transition-colors">
              <CardContent className="p-5 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card className="glass-card border-primary/15">
        <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground">
              Anda petugas Kelurahan? <span className="text-foreground font-medium">Masuk</span> untuk mengelola permohonan.
            </p>
          </div>
          {onLoginClick && (
            <Button variant="outline" size="sm" onClick={onLoginClick} className="gold-border text-primary">
              Login Petugas <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TrackingResultView({ result }: { result: TrackingResult }) {
  const def = STATUS_BY_KODE[result.statusSaatIni];
  const isRejected = result.statusSaatIni === "DITOLAK";
  const isRevision = result.statusSaatIni === "REVISI";
  const isDone = result.statusSaatIni === "SELESAI";

  return (
    <div className="space-y-5">
      {/* Status hero */}
      <Card className={`glass-card overflow-hidden ${isRejected ? "border-destructive/40" : isDone ? "border-green-500/40" : "border-primary/30"}`}>
        <div
          className="h-1.5"
          style={{ background: `linear-gradient(90deg, ${result.statusWarna}, transparent)` }}
        />
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${result.statusWarna}1a`, border: `1px solid ${result.statusWarna}55` }}
            >
              {isRejected ? <XCircle className="w-9 h-9" style={{ color: result.statusWarna }} /> :
               isDone ? <CheckCircle2 className="w-9 h-9" style={{ color: result.statusWarna }} /> :
               isRevision ? <AlertTriangle className="w-9 h-9" style={{ color: result.statusWarna }} /> :
               <Clock className="w-9 h-9" style={{ color: result.statusWarna }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge variant="outline" className="font-mono text-[10px] gold-border text-primary">
                  {result.nomorRegister}
                </Badge>
                <StatusBadge kode={result.statusSaatIni} size="lg" />
                <PriorityBadge prioritas={result.prioritas} />
              </div>
              <h2 className="text-2xl font-bold mb-1">{result.pemohonNama}</h2>
              <p className="text-sm text-muted-foreground">
                {result.jenisSurat} {result.keperluan ? `· ${result.keperluan}` : ""}
              </p>
              {isRejected && result.alasanDitolak && (
                <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-xs font-semibold text-destructive mb-0.5 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Alasan Penolakan
                  </p>
                  <p className="text-sm text-foreground/90">{result.alasanDitolak}</p>
                </div>
              )}
              {isRevision && result.catatan && (
                <div className="mt-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <p className="text-xs font-semibold text-orange-400 mb-0.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Catatan Perbaikan
                  </p>
                  <p className="text-sm text-foreground/90">{result.catatan}</p>
                </div>
              )}
              {result.statusKeterangan && !isRejected && !isRevision && (
                <p className="text-xs text-muted-foreground mt-2 italic">{result.statusKeterangan}</p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {!isRejected && !isRevision && (
            <div className="mt-5">
              <ProgressBar stages={result.stages} currentIndex={result.currentIndex} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Timeline */}
        <Card className="glass-card border-primary/20 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Tahapan Proses
            </CardTitle>
            <CardDescription className="text-xs">Linimasa pengerjaan surat tanah Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <Timeline stages={result.stages} currentIndex={result.currentIndex} riwayat={result.riwayat} />
          </CardContent>
        </Card>

        {/* Info side */}
        <div className="space-y-5">
          <Card className="glass-card border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Informasi Pemohon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <InfoRow label="NIK" value={result.pemohonNik} mono />
              <InfoRow label="Nama" value={result.pemohonNama} />
              <InfoRow label="Jenis Surat" value={result.jenisSurat} />
              {result.keperluan && <InfoRow label="Keperluan" value={result.keperluan} />}
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Lokasi Tanah
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              {result.lokasiTanah && <InfoRow label="Lokasi" value={result.lokasiTanah} />}
              {result.luasTanah && <InfoRow label="Luas" value={`${result.luasTanah} m²`} icon={Ruler} />}
              <InfoRow label="Dokumen" value={`${result.dokumenCount} berkas`} icon={FileText} />
              <InfoRow label="Tanggal Daftar" value={new Date(result.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })} icon={Calendar} />
              {result.tanggalSelesai && (
                <InfoRow label="Tanggal Selesai" value={new Date(result.tanggalSelesai).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })} icon={CheckCircle2} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Riwayat table */}
      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Riwayat Proses
          </CardTitle>
          <CardDescription className="text-xs">Catatan setiap perubahan status beserta petugas</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-96">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Tanggal</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Petugas</th>
                    <th className="py-2 font-medium">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {result.riwayat.map((r) => (
                    <tr key={r.id} className="border-b border-border/30 last:border-0">
                      <td className="py-2.5 pr-4 align-top whitespace-nowrap text-xs">
                        <div>{new Date(r.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</div>
                        <div className="text-muted-foreground">{new Date(r.tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</div>
                      </td>
                      <td className="py-2.5 pr-4 align-top"><StatusBadge kode={r.statusKode} nama={r.statusNama} size="sm" /></td>
                      <td className="py-2.5 pr-4 align-top">
                        <div className="font-medium text-xs">{r.petugas}</div>
                        {r.petugasJabatan && <div className="text-[10px] text-muted-foreground">{r.petugasJabatan}</div>}
                      </td>
                      <td className="py-2.5 align-top text-xs text-muted-foreground">{r.catatan || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value, mono, icon: Icon }: { label: string; value: string; mono?: boolean; icon?: any }) {
  const I = Icon;
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground text-xs shrink-0">{label}</span>
      <span className={`text-right text-xs ${mono ? "font-mono" : ""} ${I ? "flex items-center gap-1.5 justify-end" : ""}`}>
        {I && <I className="w-3 h-3 text-muted-foreground" />}
        {value}
      </span>
    </div>
  );
}
