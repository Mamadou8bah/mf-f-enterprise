import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { denyUnlessOwner } from "@/lib/session";
import { prisma } from "@garawol/db";
import { findProperty } from "@/lib/data";
import { deleteProperty, updateProperty } from "@/lib/entities";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const denied = denyUnlessOwner(session);
  if (denied) return denied;
  const body = await req.json();
  if (!body?.name || !body?.landlordId) {
    return NextResponse.json({ error: "Name and landlord are required" }, { status: 400 });
  }
  const id = randomUUID();
  await prisma.property.create({
    data: {
      id,
      landlordId: body.landlordId,
      name: body.name,
      area: body.area || null,
      type: body.type || "mixed",
      isFavorite: false,
    },
  });
  return NextResponse.json({ id });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const denied = denyUnlessOwner(session);
  if (denied) return denied;
  const body = await req.json();
  if (!body?.id || !(await findProperty(body.id))) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  if (body.isFavorite !== undefined && body.name === undefined && body.landlordId === undefined) {
    await prisma.property.update({
      where: { id: body.id },
      data: { isFavorite: !!body.isFavorite },
    });
    return NextResponse.json({ ok: true });
  }

  try {
    await updateProperty(body.id, {
      name: body.name,
      landlordId: body.landlordId,
      area: body.area,
      address: body.address,
      type: body.type,
      notes: body.notes,
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
    await deleteProperty(id, session!.user!.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
