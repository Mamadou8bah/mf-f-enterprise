import { randomUUID } from "crypto";
import { prisma } from "@garawol/db";
import {
  findTenancy,
  findUnit,
  tenancyUnitLinks,
  insertAudit,
} from "@/lib/data";
import { normalizeTenantId } from "@/lib/tenant-id";

export async function createTenant(input: {
  fullName: string;
  phone?: string | null;
  phoneSecondary?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  notes?: string | null;
  staffId?: string | null;
}) {
  const id = randomUUID();
  const identity = normalizeTenantId(input.idType, input.idNumber);
  await prisma.tenant.create({
    data: {
      id,
      fullName: input.fullName.trim(),
      phone: input.phone?.trim() || null,
      phoneSecondary: input.phoneSecondary?.trim() || null,
      idType: identity.idType,
      idNumber: identity.idNumber,
      notes: input.notes?.trim() || null,
      isActive: true,
    },
  });
  await insertAudit(randomUUID(), input.staffId || null, "tenant.create", "tenant", id, null);
  return id;
}

export async function updateTenant(
  id: string,
  input: {
    fullName?: string;
    phone?: string | null;
    phoneSecondary?: string | null;
    idType?: string | null;
    idNumber?: string | null;
    notes?: string | null;
    isActive?: boolean;
    staffId?: string | null;
  }
) {
  const current = await prisma.tenant.findUnique({ where: { id } });
  if (!current) throw new Error("Tenant not found");
  const identity =
    input.idType !== undefined || input.idNumber !== undefined
      ? normalizeTenantId(
          input.idType !== undefined ? input.idType : current.idType,
          input.idNumber !== undefined ? input.idNumber : current.idNumber
        )
      : { idType: current.idType, idNumber: current.idNumber };

  await prisma.tenant.update({
    where: { id },
    data: {
      fullName: input.fullName?.trim() ?? current.fullName,
      phone: input.phone !== undefined ? input.phone?.trim() || null : current.phone,
      phoneSecondary:
        input.phoneSecondary !== undefined
          ? input.phoneSecondary?.trim() || null
          : current.phoneSecondary,
      idType: identity.idType,
      idNumber: identity.idNumber,
      notes: input.notes !== undefined ? input.notes?.trim() || null : current.notes,
      isActive: input.isActive === undefined ? current.isActive : input.isActive,
    },
  });
  await insertAudit(randomUUID(), input.staffId || null, "tenant.update", "tenant", id, null);
}

export async function startTenancy(input: {
  tenantId: string;
  unitId: string;
  amountGmd: number;
  period: string;
  startDate?: string | null;
  nextDue?: string | null;
  depositGmd?: number | null;
  notes?: string | null;
  staffId?: string | null;
}) {
  const unit = await findUnit(input.unitId);
  if (!unit) throw new Error("Unit not found");

  const existingLinks = await tenancyUnitLinks(undefined, input.unitId);
  for (const l of existingLinks) {
    const t = await findTenancy(l.tenancy_id);
    if (t?.status === "active") {
      throw new Error("Unit already has an active tenant. End that tenancy first.");
    }
  }

  const tenancyId = randomUUID();
  const start = input.startDate || new Date().toISOString().slice(0, 10);
  const nextDue = input.nextDue || start;

  await prisma.tenancy.create({
    data: {
      id: tenancyId,
      tenantId: input.tenantId,
      amountGmd: Math.round(input.amountGmd),
      period: input.period,
      startDate: start,
      nextDue,
      balanceGmd: Math.round(input.amountGmd),
      depositGmd: input.depositGmd != null ? Math.round(input.depositGmd) : null,
      status: "active",
      notes: input.notes?.trim() || null,
    },
  });
  await prisma.tenancyUnit.create({
    data: { id: randomUUID(), tenancyId, unitId: input.unitId },
  });
  await prisma.unit.update({
    where: { id: input.unitId },
    data: { status: "occupied" },
  });
  await insertAudit(
    randomUUID(),
    input.staffId || null,
    "tenancy.start",
    "tenancy",
    tenancyId,
    `unit=${input.unitId}`
  );
  return tenancyId;
}

export async function endTenancy(input: {
  tenancyId: string;
  staffId?: string | null;
  notes?: string | null;
}) {
  const tenancy = await findTenancy(input.tenancyId);
  if (!tenancy) throw new Error("Tenancy not found");
  if (tenancy.status !== "active") throw new Error("Tenancy is not active");

  const note = input.notes?.trim()
    ? `${tenancy.notes ? tenancy.notes + "\n" : ""}Ended: ${input.notes.trim()}`
    : tenancy.notes;

  await prisma.tenancy.update({
    where: { id: input.tenancyId },
    data: { status: "ended", notes: note },
  });

  const links = await tenancyUnitLinks(input.tenancyId);
  for (const l of links) {
    const others = (await tenancyUnitLinks(undefined, l.unit_id)).filter(
      (x) => x.tenancy_id !== input.tenancyId
    );
    const stillOccupied = (
      await Promise.all(others.map(async (x) => findTenancy(x.tenancy_id)))
    ).some((t) => t?.status === "active");
    if (!stillOccupied) {
      await prisma.unit.update({
        where: { id: l.unit_id },
        data: { status: "vacant" },
      });
    }
  }

  await insertAudit(
    randomUUID(),
    input.staffId || null,
    "tenancy.end",
    "tenancy",
    input.tenancyId,
    input.notes || null
  );
}

export async function createUnit(input: {
  propertyId: string;
  code: string;
  type?: string;
  askingRentGmd?: number | null;
  notes?: string | null;
  staffId?: string | null;
}) {
  const id = randomUUID();
  await prisma.unit.create({
    data: {
      id,
      propertyId: input.propertyId,
      code: input.code.trim(),
      type: input.type || "shop",
      status: "vacant",
      askingRentGmd: input.askingRentGmd != null ? Math.round(input.askingRentGmd) : null,
      notes: input.notes?.trim() || null,
    },
  });
  await insertAudit(randomUUID(), input.staffId || null, "unit.create", "unit", id, null);
  return id;
}

export async function updateUnit(
  id: string,
  input: {
    code?: string;
    type?: string;
    status?: string;
    askingRentGmd?: number | null;
    notes?: string | null;
    staffId?: string | null;
  }
) {
  const unit = await findUnit(id);
  if (!unit) throw new Error("Unit not found");
  await prisma.unit.update({
    where: { id },
    data: {
      code: input.code?.trim() ?? unit.code,
      type: input.type ?? unit.type,
      status: input.status ?? unit.status,
      askingRentGmd:
        input.askingRentGmd !== undefined
          ? input.askingRentGmd != null
            ? Math.round(input.askingRentGmd)
            : null
          : unit.asking_rent_gmd,
      notes: input.notes !== undefined ? input.notes?.trim() || null : unit.notes,
    },
  });
  await insertAudit(randomUUID(), input.staffId || null, "unit.update", "unit", id, input.status || null);
}
