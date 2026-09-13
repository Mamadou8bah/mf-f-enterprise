import { randomUUID } from "crypto";
import { prisma } from "@garawol/db";
import {
  findLandlord,
  findProperty,
  findTenant,
  findUnit,
  findTenancy,
  findStaffById,
  insertAudit,
  paymentsByTenancy,
  tenanciesByTenant,
  tenancyUnitLinks,
  unitsByProperty,
} from "@/lib/data";
import { endTenancy } from "@/lib/occupancy";

export async function updateProperty(
  id: string,
  input: {
    name?: string;
    landlordId?: string;
    area?: string | null;
    address?: string | null;
    type?: string;
    notes?: string | null;
    staffId?: string | null;
  }
) {
  const property = await findProperty(id);
  if (!property) throw new Error("Property not found");
  if (input.landlordId && !(await findLandlord(input.landlordId))) {
    throw new Error("Landlord not found");
  }
  await prisma.property.update({
    where: { id },
    data: {
      name: input.name?.trim() ?? property.name,
      landlordId: input.landlordId ?? property.landlord_id,
      area: input.area !== undefined ? input.area?.trim() || null : property.area,
      address: input.address !== undefined ? input.address?.trim() || null : property.address,
      type: input.type ?? property.type,
      notes: input.notes !== undefined ? input.notes?.trim() || null : property.notes,
    },
  });
  await insertAudit(randomUUID(), input.staffId || null, "property.update", "property", id, null);
}

export async function deleteProperty(id: string, staffId?: string | null) {
  const property = await findProperty(id);
  if (!property) throw new Error("Property not found");
  const units = await unitsByProperty(id);

  // Move everyone out first, then remove the building.
  const ended = new Set<string>();
  for (const unit of units) {
    const links = await tenancyUnitLinks(undefined, unit.id);
    for (const link of links) {
      if (ended.has(link.tenancy_id)) continue;
      const tenancy = await findTenancy(link.tenancy_id);
      if (tenancy?.status === "active") {
        await endTenancy({
          tenancyId: link.tenancy_id,
          staffId,
          notes: "Moved out automatically — property deleted",
        });
        ended.add(link.tenancy_id);
      }
    }
  }

  for (const unit of units) {
    const links = await tenancyUnitLinks(undefined, unit.id);
    for (const link of links) {
      await prisma.tenancyUnit.deleteMany({ where: { unitId: unit.id } });
      const otherLinks = await tenancyUnitLinks(link.tenancy_id);
      const hasPayments = (await paymentsByTenancy(link.tenancy_id)).length > 0;
      // Keep tenancies that have payment history for records; drop empty ones.
      if (otherLinks.length === 0 && !hasPayments) {
        await prisma.tenancy.delete({ where: { id: link.tenancy_id } }).catch(() => undefined);
      }
    }
    await prisma.unitPhoto.deleteMany({ where: { unitId: unit.id } });
    await prisma.unit.delete({ where: { id: unit.id } });
  }
  await prisma.property.delete({ where: { id } });
  await insertAudit(
    randomUUID(),
    staffId || null,
    "property.delete",
    "property",
    id,
    ended.size > 0 ? `${property.name} (moved out ${ended.size})` : property.name
  );
}

export async function deleteUnit(id: string, staffId?: string | null) {
  const unit = await findUnit(id);
  if (!unit) throw new Error("Unit not found");
  const links = await tenancyUnitLinks(undefined, id);
  for (const link of links) {
    const tenancy = await findTenancy(link.tenancy_id);
    if (tenancy?.status === "active") {
      throw new Error("Move the tenant out before deleting this unit");
    }
    if ((await paymentsByTenancy(link.tenancy_id)).length > 0) {
      throw new Error("This unit has payment history and cannot be deleted");
    }
  }
  for (const link of links) {
    await prisma.tenancyUnit.delete({ where: { id: link.id } });
    const remaining = await tenancyUnitLinks(link.tenancy_id);
    if (remaining.length === 0 && (await paymentsByTenancy(link.tenancy_id)).length === 0) {
      await prisma.tenancy.delete({ where: { id: link.tenancy_id } }).catch(() => undefined);
    }
  }
  await prisma.unitPhoto.deleteMany({ where: { unitId: id } });
  await prisma.unit.delete({ where: { id } });
  await insertAudit(randomUUID(), staffId || null, "unit.delete", "unit", id, unit.code);
}

export async function deleteTenant(id: string, staffId?: string | null) {
  const tenant = await findTenant(id);
  if (!tenant) throw new Error("Tenant not found");
  const tens = await tenanciesByTenant(id);
  if (tens.some((t) => t.status === "active")) {
    throw new Error("Move this tenant out of all units before deleting");
  }
  for (const t of tens) {
    if ((await paymentsByTenancy(t.id)).length > 0) {
      throw new Error("This tenant has payment history. Deactivate them instead of deleting.");
    }
  }
  for (const t of tens) {
    await prisma.tenancyUnit.deleteMany({ where: { tenancyId: t.id } });
    await prisma.tenancy.delete({ where: { id: t.id } });
  }
  await prisma.tenant.delete({ where: { id } });
  await insertAudit(randomUUID(), staffId || null, "tenant.delete", "tenant", id, tenant.full_name);
}

export async function updateLandlord(
  id: string,
  input: {
    fullName?: string;
    phone?: string | null;
    phoneSecondary?: string | null;
    email?: string | null;
    displayTitle?: string | null;
    notes?: string | null;
    isActive?: boolean;
    staffId?: string | null;
  }
) {
  const landlord = await findLandlord(id);
  if (!landlord) throw new Error("Landlord not found");
  await prisma.landlord.update({
    where: { id },
    data: {
      fullName: input.fullName?.trim() ?? landlord.full_name,
      phone: input.phone !== undefined ? input.phone?.trim() || null : landlord.phone,
      phoneSecondary:
        input.phoneSecondary !== undefined
          ? input.phoneSecondary?.trim() || null
          : landlord.phone_secondary,
      email: input.email !== undefined ? input.email?.trim() || null : landlord.email,
      displayTitle:
        input.displayTitle !== undefined
          ? input.displayTitle?.trim() || null
          : landlord.display_title,
      notes: input.notes !== undefined ? input.notes?.trim() || null : landlord.notes,
      isActive: input.isActive === undefined ? !!landlord.is_active : input.isActive,
    },
  });
  await insertAudit(randomUUID(), input.staffId || null, "landlord.update", "landlord", id, null);
}

export async function deleteLandlord(id: string, staffId?: string | null) {
  const landlord = await findLandlord(id);
  if (!landlord) throw new Error("Landlord not found");
  const owned = await prisma.property.count({ where: { landlordId: id } });
  if (owned > 0) {
    throw new Error("Reassign or delete this landlord's properties first");
  }
  await prisma.landlord.delete({ where: { id } });
  await insertAudit(
    randomUUID(),
    staffId || null,
    "landlord.delete",
    "landlord",
    id,
    landlord.full_name
  );
}

export async function updateStaff(
  id: string,
  input: {
    fullName?: string;
    email?: string;
    role?: "admin" | "collector";
    isActive?: boolean;
    staffId?: string | null;
  }
) {
  const staff = await findStaffById(id);
  if (!staff) throw new Error("User not found");
  await prisma.staff.update({
    where: { id },
    data: {
      fullName: input.fullName?.trim() ?? staff.full_name,
      email: input.email ? String(input.email).toLowerCase().trim() : staff.email,
      role: input.role ?? staff.role,
      isActive: input.isActive === undefined ? !!staff.is_active : input.isActive,
    },
  });
  await insertAudit(randomUUID(), input.staffId || null, "staff.update", "staff", id, null);
}

export async function deleteStaff(id: string, actorId?: string | null) {
  if (actorId && actorId === id) throw new Error("You cannot delete your own account");
  const staff = await findStaffById(id);
  if (!staff) throw new Error("User not found");
  const payments = await prisma.payment.count({ where: { recordedById: id } });
  if (payments > 0) {
    await prisma.staff.update({
      where: { id },
      data: { isActive: false },
    });
    await insertAudit(randomUUID(), actorId || null, "staff.deactivate", "staff", id, staff.email);
    return { deactivated: true as const };
  }
  await prisma.staff.delete({ where: { id } });
  await insertAudit(randomUUID(), actorId || null, "staff.delete", "staff", id, staff.email);
  return { deactivated: false as const };
}
