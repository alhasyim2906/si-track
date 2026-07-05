import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ user: null });
  const { user } = current;
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      position: user.position,
      phone: user.phone,
      nip: user.nip,
      avatar: user.avatar,
    },
  });
}
