import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createUnit, updateUnit } from "@/lib/occupancy";
import { deleteUnit } from "@/lib/entities";
import { findUnit } from "@/lib/data";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function POST(req: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.propertyId || !body.code?.trim()) {
    return NextResponse.json({ error: "propertyId and code required" }, { status: 400 });
  }
  try {
    const id = await createUnit({
      propertyId: body.propertyId,
      code: body.code,
      type: body.type,
      askingRentGmd: body.askingRentGmd != null ? Number(body.askingRentGmd) : null,
      notes: body.notes,
      staffId: session.user.id,
    });
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}

export async function PATCH(req: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.id || !(await findUnit(body.id))) {
    return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  }
  try {
    await updateUnit(body.id, {
      code: body.code,
      type: body.type,
      status: body.status,
      askingRentGmd: body.askingRentGmd,
      notes: body.notes,
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
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = body?.id || new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    await deleteUnit(id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
