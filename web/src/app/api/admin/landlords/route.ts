import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { denyUnlessOwner } from "@/lib/session";
import { prisma } from "@garawol/db";
import { findLandlord } from "@/lib/data";
import { deleteLandlord, updateLandlord } from "@/lib/entities";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const denied = denyUnlessOwner(session);
  if (denied) return denied;
  const body = await req.json();
  if (!body?.fullName?.trim()) {
    return NextResponse.json({ error: "Landlord name is required" }, { status: 400 });
  }
  const id = randomUUID();
  await prisma.landlord.create({
    data: {
      id,
      fullName: body.fullName.trim(),
      phone: body.phone || null,
      isActive: true,
    },
  });
  return NextResponse.json({ id });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const denied = denyUnlessOwner(session);
  if (denied) return denied;
  const body = await req.json();
  if (!body?.id || !(await findLandlord(body.id))) {
    return NextResponse.json({ error: "Landlord not found" }, { status: 404 });
  }
  try {
    await updateLandlord(body.id, {
      fullName: body.fullName,
      phone: body.phone,
      phoneSecondary: body.phoneSecondary,
      email: body.email,
      displayTitle: body.displayTitle,
      notes: body.notes,
      isActive: body.isActive,
      staffId: session!.user!.id,
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
  const denied = denyUnlessOwner(session);
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const id = body?.id || new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    await deleteLandlord(id, session!.user!.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
