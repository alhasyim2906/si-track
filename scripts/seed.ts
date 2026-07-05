// SI-TRACK TANAH — Database seed script
// Run: bun run scripts/seed.ts
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { STATUS_DEFINITIONS, JENIS_SURAT_SEED } from "../src/lib/constants";

async function main() {
  console.log("🌱 Seeding SI-TRACK TANAH...");

  // 1. Status Proses
  for (const s of STATUS_DEFINITIONS) {
    await db.statusProses.upsert({
      where: { kode: s.kode },
      update: {
        nama: s.nama,
        urutan: s.urutan,
        warna: s.warna,
        icon: s.icon,
        keterangan: s.keterangan,
        isKhusus: !!s.isKhusus,
        isFinal: !!s.isFinal,
      },
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
    });
  }
  console.log(`  ✓ ${STATUS_DEFINITIONS.length} status proses`);

  // 2. Jenis Surat
  for (const j of JENIS_SURAT_SEED) {
    await db.jenisSurat.upsert({
      where: { kode: j.kode },
      update: j,
      create: j,
    });
  }
  console.log(`  ✓ ${JENIS_SURAT_SEED.length} jenis surat`);

  // 3. Users
  const users = [
    { email: "admin@kpii.go.id", name: "Administrator Sistem", role: "ADMIN", position: "Admin Sistem", nip: "198001012005011001", phone: "081200000001", password: "admin123" },
    { email: "petugas@kpii.go.id", name: "Budi Santoso", role: "PETUGAS", position: "Petugas Administrasi", nip: "198506152010011002", phone: "081200000002", password: "petugas123" },
    { email: "petugas2@kpii.go.id", name: "Siti Aminah", role: "PETUGAS", position: "Petugas Lapangan", nip: "199003202015022003", phone: "081200000003", password: "petugas123" },
    { email: "lurah@kpii.go.id", name: "H. Ahmad Fauzi, S.Sos", role: "ATASAN", position: "Lurah Kuala Pembuang II", nip: "197504101998031004", phone: "081200000004", password: "lurah123" },
  ];
  for (const u of users) {
    const exists = await db.user.findUnique({ where: { email: u.email } });
    if (!exists) {
      await db.user.create({
        data: {
          email: u.email,
          name: u.name,
          role: u.role,
          position: u.position,
          nip: u.nip,
          phone: u.phone,
          password: await hashPassword(u.password),
        },
      });
    }
  }
  console.log(`  ✓ ${users.length} users`);

  // 4. Sample permohonan
  const petugas = (await db.user.findMany({ where: { role: "PETUGAS" } }))[0];
  const jenisList = await db.jenisSurat.findMany();
  const samples = [
    {
      nomorRegister: "KPII-TNH-2026-000001",
      jenisIdx: 0,
      pemohonNik: "6201010101900001",
      pemohonNama: "Suparman",
      pemohonTempatLahir: "Seruyan",
      pemohonTanggalLahir: "1970-05-10",
      pemohonAlamat: "Jl. Pembuang No. 12",
      pemohonRt: "002",
      pemohonRw: "001",
      pemohonHp: "081234567890",
      lokasiTanah: "Dusun Kuala Pembuang",
      tanahRt: "002",
      tanahRw: "001",
      luasTanah: "500",
      batasUtara: "Jalan Umum",
      batasSelatan: "Tanah Pak Ali",
      batasTimur: "Sungai Pembuang",
      batasBarat: "Tanah Pak Sugeng",
      statusPenguasaan: "Milik Sendiri",
      keperluan: "Pengurusan Sertifikat Tanah",
      statusSaatIni: "PENGUKURAN",
      prioritas: "NORMAL",
      riwayat: ["PENGAJUAN", "CEK_ADMIN", "VERIFIKASI_LAPANGAN"],
    },
    {
      nomorRegister: "KPII-TNH-2026-000002",
      jenisIdx: 1,
      pemohonNik: "6201010202800002",
      pemohonNama: "Maryam",
      pemohonTempatLahir: "Banjarmasin",
      pemohonTanggalLahir: "1980-02-02",
      pemohonAlamat: "Jl. Raja No. 45",
      pemohonRt: "001",
      pemohonRw: "002",
      pemohonHp: "081234567891",
      lokasiTanah: "Dusun Sei. Pembuang",
      tanahRt: "001",
      tanahRw: "002",
      luasTanah: "1200",
      batasUtara: "Tanah Warisan",
      batasSelatan: "Jalan Desa",
      batasTimur: "Tanah H. Jamil",
      batasBarat: "Sungai",
      statusPenguasaan: "Warisan",
      keperluan: "Pengukuran ulang",
      statusSaatIni: "TTD_LURAH",
      prioritas: "TINGGI",
      riwayat: ["PENGAJUAN", "CEK_ADMIN", "VERIFIKASI_LAPANGAN", "PENGUKURAN", "PEMBUATAN_SURAT"],
    },
    {
      nomorRegister: "KPII-TNH-2026-000003",
      jenisIdx: 2,
      pemohonNik: "6201010303950003",
      pemohonNama: "Joko Widodo",
      pemohonTempatLahir: "Seruyan",
      pemohonTanggalLahir: "1995-03-03",
      pemohonAlamat: "Jl. Merdeka No. 8",
      pemohonRt: "003",
      pemohonRw: "001",
      pemohonHp: "081234567892",
      lokasiTanah: "Dusun Hulu",
      tanahRt: "003",
      tanahRw: "001",
      luasTanah: "750",
      batasUtara: "Tanah Kosong",
      batasSelatan: "Jalan Umum",
      batasTimur: "Tanah Ibu Siti",
      batasBarat: "Pematang",
      statusPenguasaan: "Girik",
      keperluan: "Permohonan Sertifikat Tanah",
      statusSaatIni: "SELESAI",
      prioritas: "NORMAL",
      riwayat: ["PENGAJUAN", "CEK_ADMIN", "VERIFIKASI_LAPANGAN", "PENGUKURAN", "PEMBUATAN_SURAT", "TTD_LURAH", "TTD_CAMAT"],
      tanggalSelesai: new Date(),
    },
    {
      nomorRegister: "KPII-TNH-2026-000004",
      jenisIdx: 3,
      pemohonNik: "6201010404760004",
      pemohonNama: "Wahyuni",
      pemohonTempatLahir: "Pangkalan Bun",
      pemohonTanggalLahir: "1976-04-04",
      pemohonAlamat: "Jl. Diponegoro No. 21",
      pemohonRt: "001",
      pemohonRw: "003",
      pemohonHp: "081234567893",
      lokasiTanah: "Dusun Tengah",
      tanahRt: "001",
      tanahRw: "003",
      luasTanah: "300",
      batasUtara: "Tanah Saudara",
      batasSelatan: "Jalan Setapak",
      batasTimur: "Pematang",
      batasBarat: "Tanah Umum",
      statusPenguasaan: "Warisan",
      keperluan: "Surat Keterangan Waris",
      statusSaatIni: "CEK_ADMIN",
      prioritas: "NORMAL",
      riwayat: ["PENGAJUAN"],
    },
    {
      nomorRegister: "KPII-TNH-2026-000005",
      jenisIdx: 4,
      pemohonNik: "6201010505880005",
      pemohonNama: "Rahmat Hidayat",
      pemohonTempatLahir: "Seruyan",
      pemohonTanggalLahir: "1988-05-05",
      pemohonAlamat: "Jl. Gajah Mada No. 99",
      pemohonRt: "004",
      pemohonRw: "002",
      pemohonHp: "081234567894",
      lokasiTanah: "Dusun Hilir",
      tanahRt: "004",
      tanahRw: "002",
      luasTanah: "900",
      batasUtara: "Sungai",
      batasSelatan: "Tanah Pak Karim",
      batasTimur: "Jalan Umum",
      batasBarat: "Pematang",
      statusPenguasaan: "Milik Sendiri",
      keperluan: "Surat Bebas Sengketa",
      statusSaatIni: "DITOLAK",
      prioritas: "NORMAL",
      riwayat: ["PENGAJUAN", "CEK_ADMIN"],
      alasanDitolak: "Dokumen bukti penguasaan tanah tidak sah dan terindikasi sengketa.",
    },
  ];

  for (const smp of samples) {
    const exists = await db.permohonan.findUnique({ where: { nomorRegister: smp.nomorRegister } });
    if (exists) continue;
    const jenis = jenisList[smp.jenisIdx];
    const now = new Date();
    const created = new Date(now.getTime() - (smp.riwayat.length) * 24 * 60 * 60 * 1000);
    const permohonan = await db.permohonan.create({
      data: {
        nomorRegister: smp.nomorRegister,
        jenisSuratId: jenis.id,
        pemohonNik: smp.pemohonNik,
        pemohonNama: smp.pemohonNama,
        pemohonTempatLahir: smp.pemohonTempatLahir,
        pemohonTanggalLahir: smp.pemohonTanggalLahir,
        pemohonAlamat: smp.pemohonAlamat,
        pemohonRt: smp.pemohonRt,
        pemohonRw: smp.pemohonRw,
        pemohonHp: smp.pemohonHp,
        lokasiTanah: smp.lokasiTanah,
        tanahRt: smp.tanahRt,
        tanahRw: smp.tanahRw,
        luasTanah: smp.luasTanah,
        batasUtara: smp.batasUtara,
        batasSelatan: smp.batasSelatan,
        batasTimur: smp.batasTimur,
        batasBarat: smp.batasBarat,
        statusPenguasaan: smp.statusPenguasaan,
        keperluan: smp.keperluan,
        statusSaatIni: smp.statusSaatIni,
        alasanDitolak: smp.alasanDitolak,
        prioritas: smp.prioritas,
        createdBy: petugas.id,
        createdAt: created,
        tanggalSelesai: smp.tanggalSelesai ?? null,
      },
    });
    for (let i = 0; i < smp.riwayat.length; i++) {
      const kode = smp.riwayat[i];
      const def = STATUS_DEFINITIONS.find((x) => x.kode === kode)!;
      await db.riwayatProses.create({
        data: {
          permohonanId: permohonan.id,
          statusKode: kode,
          statusNama: def.nama,
          catatan: i === 0 ? "Berkas diterima dan didaftarkan." : i === 1 ? "Dokumen lengkap." : "Proses berjalan.",
          petugasId: petugas.id,
          createdAt: new Date(created.getTime() + i * 24 * 60 * 60 * 1000),
        },
      });
    }
    await db.notifikasi.create({
      data: {
        permohonanId: permohonan.id,
        judul: "Berkas Diterima",
        pesan: `Permohonan atas nama ${smp.pemohonNama} (${smp.nomorRegister}) telah diterima.`,
        tipe: "SUCCESS",
      },
    });
  }
  console.log(`  ✓ ${samples.length} sample permohonan`);

  await db.settings.upsert({ where: { key: "app_name" }, update: {}, create: { key: "app_name", value: "SI-TRACK TANAH" } });
  await db.settings.upsert({ where: { key: "kelurahan" }, update: {}, create: { key: "kelurahan", value: "Kelurahan Kuala Pembuang II" } });
  await db.settings.upsert({ where: { key: "alamat_kantor" }, update: {}, create: { key: "alamat_kantor", value: "Jl. Iskandar No. 1, Kuala Pembuang, Seruyan, Kalimantan Tengah" } });

  console.log("✅ Seed complete!");
  console.log("   Login: admin@kpii.go.id / admin123");
  console.log("   Login: petugas@kpii.go.id / petugas123");
  console.log("   Login: lurah@kpii.go.id / lurah123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
