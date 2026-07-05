import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyPassword, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

// GET /api/auth/profile — return current user profile
export async function GET() {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user } = current;
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        position: user.position,
        nip: user.nip,
        phone: user.phone,
        avatar: user.avatar,
      },
    });
  } catch (e) {
    console.error("profile GET error", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// PUT /api/auth/profile — update profile info and/or change password
export async function PUT(req: NextRequest) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { user, session } = current;

    const body = await req.json();
    const { name, phone, position, currentPassword, newPassword } = body;

    // Build update data for profile fields
    const updateData: Record<string, any> = {};
    if (name !== undefined && name.trim()) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim() || null;
    if (position !== undefined) updateData.position = position.trim() || null;

    // Handle password change
    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: "Password saat ini dan password baru wajib diisi" },
          { status: 400 }
        );
      }
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password baru minimal 6 karakter" },
          { status: 400 }
        );
      }
      const isMatch = await verifyPassword(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Password saat ini salah" },
          { status: 400 }
        );
      }
      updateData.password = await hashPassword(newPassword);
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data yang diubah" },
        { status: 400 }
      );
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Audit log
    const changes: string[] = [];
    if (updateData.name) changes.push("nama");
    if (updateData.phone !== undefined) changes.push("telepon");
    if (updateData.position !== undefined) changes.push("jabatan");
    if (updateData.password) changes.push("password");
    await writeAudit(session, {
      aksi: "UPDATE",
      modul: "AUTH",
      entitasId: user.id,
      detail: `Ubah profil: ${changes.join(", ")}`,
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        position: updated.position,
        nip: updated.nip,
        phone: updated.phone,
        avatar: updated.avatar,
      },
    });
  } catch (e) {
    console.error("profile PUT error", e);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
