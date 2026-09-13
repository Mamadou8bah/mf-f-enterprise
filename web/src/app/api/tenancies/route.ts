import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createTenant, startTenancy, endTenancy } from "@/lib/occupancy";
import { findTenant } from "@/lib/data";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

export async function POST(req: Request) {
  const session = await requireUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.unitId || body.amountGmd == null || body.amountGmd === "") {
    return NextResponse.json(
      { error: "unitId and amountGmd are required" },
      { status: 400 }
    );
  }

  try {
    let tenantId = body.tenantId as string | undefined;

    if (!tenantId && body.newTenant?.fullName?.trim()) {
      tenantId = await createTenant({
        fullName: body.newTenant.fullName,
        phone: body.newTenant.phone,
        phoneSecondary: body.newTenant.phoneSecondary,
        idType: body.newTenant.idType,
        idNumber: body.newTenant.idNumber,
        notes: body.newTenant.notes,
        staffId: session.user.id,
      });
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: "Enter a new tenant or pick an existing one" },
        { status: 400 }
      );
    }

    if (!(await findTenant(tenantId))) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const id = await startTenancy({
      tenantId,
      unitId: body.unitId,
      amountGmd: Number(body.amountGmd),
      period: body.period || "monthly",
      startDate: body.startDate,
      nextDue: body.nextDue,
      depositGmd: body.depositGmd != null && body.depositGmd !== "" ? Number(body.depositGmd) : null,
      notes: body.notes,
      staffId: session.user.id,
    });
    return NextResponse.json({ id, tenantId });
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
  if (!body.id || body.action !== "end") {
    return NextResponse.json({ error: "id and action=end required" }, { status: 400 });
  }
  try {
    await endTenancy({
      tenancyId: body.id,
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
