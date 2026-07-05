"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { SectionHeader } from "@/components/app/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, FileText, User, MapPin, Save, Loader2, Ruler, Stamp,
  AlertCircle, ShieldAlert, Gauge, Upload, Info,
} from "lucide-react";

interface JenisSuratItem {
  id: string;
  kode: string;
  nama: string;
  deskripsi?: string;
  butuhPengukuran: boolean;
  butuhTtdCamat: boolean;
  isActive: boolean;
}

interface FormState {
  jenisSuratId: string;
  prioritas: string;
  pemohonNik: string;
  pemohonNama: string;
  pemohonTempatLahir: string;
  pemohonTanggalLahir: string;
  pemohonAlamat: string;
  pemohonRt: string;
  pemohonRw: string;
  pemohonHp: string;
  pemohonEmail: string;
  lokasiTanah: string;
  tanahRt: string;
  tanahRw: string;
  luasTanah: string;
  batasUtara: string;
  batasSelatan: string;
  batasTimur: string;
  batasBarat: string;
  statusPenguasaan: string;
  keperluan: string;
}

const initialState: FormState = {
  jenisSuratId: "",
  prioritas: "NORMAL",
  pemohonNik: "",
  pemohonNama: "",
  pemohonTempatLahir: "",
  pemohonTanggalLahir: "",
  pemohonAlamat: "",
  pemohonRt: "",
  pemohonRw: "",
  pemohonHp: "",
  pemohonEmail: "",
  lokasiTanah: "",
  tanahRt: "",
  tanahRw: "",
  luasTanah: "",
  batasUtara: "",
  batasSelatan: "",
  batasTimur: "",
  batasBarat: "",
  statusPenguasaan: "Milik Sendiri",
  keperluan: "",
};

const STATUS_PENGUASAAN = [
  "Milik Sendiri",
  "Warisan",
  "Girik",
  "Sewa",
  "Lainnya",
];

const PRIORITAS_OPTIONS = [
  { kode: "NORMAL", label: "Normal", desc: "Diproses sesuai antrean" },
  { kode: "TINGGI", label: "Tinggi", desc: "Prioritas tinggi" },
  { kode: "MENDESAK", label: "Mendesak", desc: "Penanganan segera" },
];

function Field({
  label, required, children, hint,
}: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground/80 flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

export function PermohonanForm() {
  const { setView, selectPermohonan } = useAppStore();
  const [form, setForm] = useState<FormState>(initialState);
  const [jenisList, setJenisList] = useState<JenisSuratItem[]>([]);
  const [loadingJenis, setLoadingJenis] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.jenisSurat();
        setJenisList((r.items || []).filter((j: JenisSuratItem) => j.isActive));
      } catch (e: any) {
        toast.error(e.message || "Gagal memuat jenis surat");
      } finally {
        setLoadingJenis(false);
      }
    })();
  }, []);

  const selectedJenis = jenisList.find((j) => j.id === form.jenisSuratId);

  const update = (k: keyof FormState, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // validation
    if (!form.jenisSuratId) {
      toast.error("Jenis surat wajib dipilih");
      return;
    }
    if (!form.pemohonNik.trim()) {
      toast.error("NIK pemohon wajib diisi");
      return;
    }
    if (form.pemohonNik.trim().length < 8) {
      toast.error("NIK pemohon tidak valid (min. 8 digit)");
      return;
    }
    if (!form.pemohonNama.trim()) {
      toast.error("Nama pemohon wajib diisi");
      return;
    }
    if (!form.keperluan.trim()) {
      toast.error("Keperluan wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, any> = {
        jenisSuratId: form.jenisSuratId,
        prioritas: form.prioritas,
        pemohonNik: form.pemohonNik.trim(),
        pemohonNama: form.pemohonNama.trim(),
        pemohonTempatLahir: form.pemohonTempatLahir.trim() || undefined,
        pemohonTanggalLahir: form.pemohonTanggalLahir || undefined,
        pemohonAlamat: form.pemohonAlamat.trim() || undefined,
        pemohonRt: form.pemohonRt.trim() || undefined,
        pemohonRw: form.pemohonRw.trim() || undefined,
        pemohonHp: form.pemohonHp.trim() || undefined,
        pemohonEmail: form.pemohonEmail.trim() || undefined,
        lokasiTanah: form.lokasiTanah.trim() || undefined,
        tanahRt: form.tanahRt.trim() || undefined,
        tanahRw: form.tanahRw.trim() || undefined,
        luasTanah: form.luasTanah ? Number(form.luasTanah) : undefined,
        batasUtara: form.batasUtara.trim() || undefined,
        batasSelatan: form.batasSelatan.trim() || undefined,
        batasTimur: form.batasTimur.trim() || undefined,
        batasBarat: form.batasBarat.trim() || undefined,
        statusPenguasaan: form.statusPenguasaan,
        keperluan: form.keperluan.trim(),
      };
      const r = await api.createPermohonan(body);
      toast.success("Permohonan berhasil dibuat. Nomor register telah diterbitkan.");
      selectPermohonan(r.permohonan.id);
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat permohonan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 space-y-5">
      <SectionHeader
        title="Daftar Permohonan Baru"
        subtitle="Buat permohonan surat tanah baru dan terbitkan nomor register"
        icon={FileText}
        action={
          <Button variant="outline" onClick={() => setView("permohonan")}>
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Jenis Surat & Prioritas */}
        <Card className="glass-card border-primary/15">
          <CardContent className="p-5 sm:p-6">
            <SectionTitle
              icon={FileText}
              title="Jenis Surat & Prioritas"
              desc="Pilih jenis surat tanah yang akan diajukan"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Jenis Surat" required hint={loadingJenis ? "Memuat daftar..." : undefined}>
                <Select
                  value={form.jenisSuratId}
                  onValueChange={(v) => update("jenisSuratId", v)}
                  disabled={loadingJenis}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingJenis ? "Memuat..." : "Pilih jenis surat"} />
                  </SelectTrigger>
                  <SelectContent>
                    {jenisList.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Prioritas" required>
                <Select
                  value={form.prioritas}
                  onValueChange={(v) => update("prioritas", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih prioritas" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITAS_OPTIONS.map((p) => (
                      <SelectItem key={p.kode} value={p.kode}>
                        {p.label} — {p.desc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {selectedJenis && (
              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/15">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground/90 mb-1.5">
                      {selectedJenis.nama}
                    </p>
                    {selectedJenis.deskripsi && (
                      <p className="text-[11px] text-muted-foreground mb-2">{selectedJenis.deskripsi}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant="outline"
                        className={selectedJenis.butuhPengukuran
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-400 text-[10px]"
                          : "border-muted-foreground/30 text-muted-foreground text-[10px]"}
                      >
                        <Ruler className="w-3 h-3 mr-1" />
                        {selectedJenis.butuhPengukuran ? "Butuh Pengukuran" : "Tanpa Pengukuran"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={selectedJenis.butuhTtdCamat
                          ? "border-orange-500/40 bg-orange-500/10 text-orange-400 text-[10px]"
                          : "border-muted-foreground/30 text-muted-foreground text-[10px]"}
                      >
                        <Stamp className="w-3 h-3 mr-1" />
                        {selectedJenis.butuhTtdCamat ? "Butuh TTD Camat" : "Tanpa TTD Camat"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Data Pemohon */}
        <Card className="glass-card border-primary/15">
          <CardContent className="p-5 sm:p-6">
            <SectionTitle
              icon={User}
              title="Data Pemohon"
              desc="Identitas pemohon yang mengajukan surat tanah"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="NIK" required>
                <Input
                  value={form.pemohonNik}
                  onChange={(e) => update("pemohonNik", e.target.value.replace(/[^0-9]/g, "").slice(0, 16))}
                  placeholder="16 digit NIK"
                  inputMode="numeric"
                />
              </Field>
              <Field label="Nama Lengkap" required>
                <Input
                  value={form.pemohonNama}
                  onChange={(e) => update("pemohonNama", e.target.value)}
                  placeholder="Nama lengkap pemohon"
                />
              </Field>
              <Field label="Tempat Lahir">
                <Input
                  value={form.pemohonTempatLahir}
                  onChange={(e) => update("pemohonTempatLahir", e.target.value)}
                  placeholder="Kota/kabupaten kelahiran"
                />
              </Field>
              <Field label="Tanggal Lahir">
                <Input
                  type="date"
                  value={form.pemohonTanggalLahir}
                  onChange={(e) => update("pemohonTanggalLahir", e.target.value)}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Alamat">
                  <Input
                    value={form.pemohonAlamat}
                    onChange={(e) => update("pemohonAlamat", e.target.value)}
                    placeholder="Alamat lengkap sesuai KTP"
                  />
                </Field>
              </div>
              <Field label="RT">
                <Input
                  value={form.pemohonRt}
                  onChange={(e) => update("pemohonRt", e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                  placeholder="000"
                  inputMode="numeric"
                />
              </Field>
              <Field label="RW">
                <Input
                  value={form.pemohonRw}
                  onChange={(e) => update("pemohonRw", e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                  placeholder="000"
                  inputMode="numeric"
                />
              </Field>
              <Field label="No. HP" hint="Format: 08xxxxxxxxxx — untuk notifikasi WA">
                <Input
                  value={form.pemohonHp}
                  onChange={(e) => update("pemohonHp", e.target.value.replace(/[^0-9+]/g, "").slice(0, 15))}
                  placeholder="081234567890"
                  inputMode="tel"
                />
              </Field>
              <Field label="Email" hint="Untuk notifikasi email saat surat selesai / perlu kelengkapan">
                <Input
                  type="email"
                  value={form.pemohonEmail}
                  onChange={(e) => update("pemohonEmail", e.target.value.slice(0, 100))}
                  placeholder="pemohon@email.com"
                  inputMode="email"
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Data Tanah */}
        <Card className="glass-card border-primary/15">
          <CardContent className="p-5 sm:p-6">
            <SectionTitle
              icon={MapPin}
              title="Data Tanah"
              desc="Informasi lokasi dan rincian bidang tanah"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Lokasi Tanah">
                  <Input
                    value={form.lokasiTanah}
                    onChange={(e) => update("lokasiTanah", e.target.value)}
                    placeholder="Alamat / lokasi bidang tanah"
                  />
                </Field>
              </div>
              <Field label="RT (Lokasi Tanah)">
                <Input
                  value={form.tanahRt}
                  onChange={(e) => update("tanahRt", e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                  placeholder="000"
                  inputMode="numeric"
                />
              </Field>
              <Field label="RW (Lokasi Tanah)">
                <Input
                  value={form.tanahRw}
                  onChange={(e) => update("tanahRw", e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                  placeholder="000"
                  inputMode="numeric"
                />
              </Field>
              <Field label="Luas Tanah (m²)">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.luasTanah}
                  onChange={(e) => update("luasTanah", e.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="Status Penguasaan">
                <Select
                  value={form.statusPenguasaan}
                  onValueChange={(v) => update("statusPenguasaan", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_PENGUASAAN.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Separator className="sm:col-span-2 my-1" />

              <p className="sm:col-span-2 text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-primary" /> Batas-batas Bidang Tanah
              </p>
              <Field label="Batas Utara">
                <Input
                  value={form.batasUtara}
                  onChange={(e) => update("batasUtara", e.target.value)}
                  placeholder="Berbatasan dengan..."
                />
              </Field>
              <Field label="Batas Selatan">
                <Input
                  value={form.batasSelatan}
                  onChange={(e) => update("batasSelatan", e.target.value)}
                  placeholder="Berbatasan dengan..."
                />
              </Field>
              <Field label="Batas Timur">
                <Input
                  value={form.batasTimur}
                  onChange={(e) => update("batasTimur", e.target.value)}
                  placeholder="Berbatasan dengan..."
                />
              </Field>
              <Field label="Batas Barat">
                <Input
                  value={form.batasBarat}
                  onChange={(e) => update("batasBarat", e.target.value)}
                  placeholder="Berbatasan dengan..."
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Keperluan" required hint="Jelaskan keperluan pengajuan surat tanah">
                  <Textarea
                    value={form.keperluan}
                    onChange={(e) => update("keperluan", e.target.value)}
                    placeholder="Contoh: Untuk mengurus sertifikat tanah warisan..."
                    rows={3}
                  />
                </Field>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload info banner */}
        <Card className="glass-card border-primary/15">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                <Upload className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-1">
                  Unggah Dokumen Setelah Pendaftaran
                  <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/5 text-primary">Multi-Upload</Badge>
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Setelah permohonan dibuat, Anda akan diarahkan ke halaman detail di mana Anda dapat
                  mengunggah dokumen pendukung secara multi-upload (banyak file sekaligus):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Dokumen Pemohon</p>
                      <p className="text-[11px] text-muted-foreground">Foto KTP &amp; Kartu Keluarga (multi-upload), Surat Pernyataan</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                    <Info className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Dokumen Tanah</p>
                      <p className="text-[11px] text-muted-foreground">SPPT PBB, Bukti Penguasaan, Foto Lokasi (multi)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/20 sm:col-span-2">
                    <Info className="w-3.5 h-3.5 text-cyan-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Foto Batas Tanah (multi-upload per batas)</p>
                      <p className="text-[11px] text-muted-foreground">Unggah beberapa foto untuk setiap batas: Utara, Selatan, Timur, dan Barat bidang tanah</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit bar */}
        <div className="sticky bottom-4 z-20">
          <Card className="glass-card border-primary/25 navy-glow">
            <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldAlert className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p>
                  Pastikan seluruh data terisi dengan benar sebelum disimpan.
                  Nomor register akan otomatis diterbitkan setelah permohonan dibuat.
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setView("permohonan")}
                  disabled={submitting}
                  className="flex-1 sm:flex-none"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Simpan & Buat Nomor Register
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

export default PermohonanForm;
