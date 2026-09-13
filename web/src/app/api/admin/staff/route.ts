import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@garawol/db";
import { findStaffById } from "@/lib/data";
import { deleteStaff, updateStaff } from "@/lib/entities";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const id = randomUUID();
  const passwordHash = await bcrypt.hash(body.password, 10);
  await prisma.staff.create({
    data: {
      id,
      fullName: body.fullName,
      email: String(body.email).toLowerCase().trim(),
      passwordHash,
      role: "collector",
      isActive: true,
    },
  });
  return NextResponse.json({ id });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  if (!body?.id || !(await findStaffById(body.id))) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  try {
    await updateStaff(body.id, {
      fullName: body.fullName,
      email: body.email,
      role: "collector",
      isActive: body.isActive,
      staffId: session.user.id,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const id = body?.id || new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    const result = await deleteStaff(id, session.user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
