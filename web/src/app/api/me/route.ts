import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@garawol/db";
import { findStaffByEmail, findStaffById } from "@/lib/data";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const staff = await findStaffById(session.user.id);
  if (!staff) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: staff.id,
    fullName: staff.full_name,
    phone: staff.phone || "",
    email: staff.email,
    role: staff.role,
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const staff = await findStaffById(session.user.id);
  if (!staff) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const fullName = String(body.fullName || "").trim();
  if (!fullName) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const email = String(body.email || staff.email).toLowerCase().trim();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
  const taken = await findStaffByEmail(email);
  if (taken && taken.id !== staff.id) {
    return NextResponse.json({ error: "That email is already in use" }, { status: 400 });
  }

  const phone = String(body.phone || "").trim();
  let passwordHash = staff.password_hash;
  const newPassword = String(body.newPassword || "");
  if (newPassword) {
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }
    const current = String(body.currentPassword || "");
    const ok = await bcrypt.compare(current, staff.password_hash);
    if (!ok) return NextResponse.json({ error: "Current password is wrong" }, { status: 400 });
    passwordHash = await bcrypt.hash(newPassword, 10);
  }

  await prisma.staff.update({
    where: { id: staff.id },
    data: {
      fullName,
      phone: phone || null,
      email,
      passwordHash,
    },
  });

  return NextResponse.json({
    id: staff.id,
    fullName,
    phone,
    email,
    role: staff.role,
  });
}
