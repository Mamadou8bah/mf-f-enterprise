import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createTenant, updateTenant } from "@/lib/occupancy";
import { deleteTenant } from "@/lib/entities";
import { allTenants, findTenant } from "@/lib/data";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function GET() {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenants = (await allTenants()).map((t) => ({
    id: t.id,
    fullName: t.full_name,
    phone: t.phone,
    phoneSecondary: t.phone_secondary,
    idType: t.id_type,
    idNumber: t.id_number,
    notes: t.notes,
    isActive: !!t.is_active,
  }));
  return NextResponse.json({ tenants });
}

export async function POST(req: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.fullName?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const id = await createTenant({
    fullName: body.fullName,
    phone: body.phone,
    phoneSecondary: body.phoneSecondary,
    idType: body.idType,
    idNumber: body.idNumber,
    notes: body.notes,
    staffId: session.user.id,
  });
  return NextResponse.json({ id });
}

export async function PATCH(req: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.id || !(await findTenant(body.id))) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }
  try {
    await updateTenant(body.id, {
      fullName: body.fullName,
      phone: body.phone,
      phoneSecondary: body.phoneSecondary,
      idType: body.idType,
      idNumber: body.idNumber,
      notes: body.notes,
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
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = body?.id || new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    await deleteTenant(id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
