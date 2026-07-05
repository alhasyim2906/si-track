import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { STATUS_DEFINITIONS, JENIS_SURAT_SEED } from "@/lib/constants";
import { hashPassword } from "@/lib/auth";

// POST /api/seed — re-seed master data + demo users (dev convenience)
export async function POST() {
  for (const s of STATUS_DEFINITIONS) {
    await db.statusProses.upsert({
      where: { kode: s.kode },
      update: { nama: s.nama, urutan: s.urutan, warna: s.warna, icon: s.icon, keterangan: s.keterangan, isKhusus: !!s.isKhusus, isFinal: !!s.isFinal },
      create: { kode: s.kode, nama: s.nama, urutan: s.urutan, warna: s.warna, icon: s.icon, keterangan: s.keterangan, isKhusus: !!s.isKhusus, isFinal: !!s.isFinal },
    });
  }
  for (const j of JENIS_SURAT_SEED) {
    await db.jenisSurat.upsert({ where: { kode: j.kode }, update: j, create: j });
  }
  const demoUsers = [
    { email: "admin@kpii.go.id", name: "Administrator Sistem", role: "ADMIN", position: "Admin Sistem", password: "admin123" },
    { email: "petugas@kpii.go.id", name: "Budi Santoso", role: "PETUGAS", position: "Petugas Administrasi", password: "petugas123" },
    { email: "lurah@kpii.go.id", name: "H. Ahmad Fauzi, S.Sos", role: "ATASAN", position: "Lurah Kuala Pembuang II", password: "lurah123" },
  ];
  for (const u of demoUsers) {
    const exists = await db.user.findUnique({ where: { email: u.email } });
    if (!exists) {
      await db.user.create({ data: { email: u.email, name: u.name, role: u.role, position: u.position!, password: await hashPassword(u.password) } });
    }
  }
  return NextResponse.json({ ok: true, message: "Master data & demo users ready" });
}
