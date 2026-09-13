import { prisma, assertDatabaseUrl } from "@garawol/db";
import type {
  Staff as PStaff,
  Landlord as PLandlord,
  Property as PProperty,
  Unit as PUnit,
  UnitPhoto as PUnitPhoto,
  Tenant as PTenant,
  Tenancy as PTenancy,
  Payment as PPayment,
  Receipt as PReceipt,
} from "@prisma/client";

assertDatabaseUrl();

export type Staff = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string;
  password_hash: string;
  role: "admin" | "collector";
  is_active: number;
  property_scope: string | null;
};

export type Landlord = {
  id: string;
  full_name: string;
  display_title: string | null;
  phone: string | null;
  phone_secondary: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_no: string | null;
  is_active: number;
};

export type Property = {
  id: string;
  landlord_id: string;
  name: string;
  area: string | null;
  address: string | null;
  type: string;
  notes: string | null;
  is_favorite: number;
};

export type Unit = {
  id: string;
  property_id: string;
  code: string;
  type: string;
  status: string;
  asking_rent_gmd: number | null;
  notes: string | null;
};

export type UnitPhoto = {
  id: string;
  unit_id: string;
  url: string;
  sort_order: number;
};

export type Tenant = {
  id: string;
  full_name: string;
  phone: string | null;
  phone_secondary: string | null;
  id_type: string | null;
  id_number: string | null;
  notes: string | null;
  is_active: number;
};

export type Tenancy = {
  id: string;
  tenant_id: string;
  amount_gmd: number;
  period: string;
  start_date: string | null;
  next_due: string | null;
  balance_gmd: number;
  deposit_gmd: number | null;
  status: string;
  notes: string | null;
};

export type Payment = {
  id: string;
  tenancy_id: string;
  amount_gmd: number;
  paid_at: string;
  period_start: string;
  period_end: string;
  method: string;
  recorded_by: string;
  sync_status: string;
  local_receipt_no: string | null;
  notes: string | null;
};

export type Receipt = {
  id: string;
  payment_id: string;
  receipt_no: string;
  status: string;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
  created_at: string;
};

export type TenancyUnitLink = {
  id: string;
  tenancy_id: string;
  unit_id: string;
};

function toStaff(r: PStaff): Staff {
  return {
    id: r.id,
    full_name: r.fullName,
    phone: r.phone,
    email: r.email,
    password_hash: r.passwordHash,
    role: r.role as "admin" | "collector",
    is_active: r.isActive ? 1 : 0,
    property_scope: r.propertyScope,
  };
}

function toLandlord(r: PLandlord): Landlord {
  return {
    id: r.id,
    full_name: r.fullName,
    display_title: r.displayTitle,
    phone: r.phone,
    phone_secondary: r.phoneSecondary,
    email: r.email,
    address: r.address,
    notes: r.notes,
    bank_name: r.bankName,
    bank_account_name: r.bankAccountName,
    bank_account_no: r.bankAccountNo,
    is_active: r.isActive ? 1 : 0,
  };
}

function toProperty(r: PProperty): Property {
  return {
    id: r.id,
    landlord_id: r.landlordId,
    name: r.name,
    area: r.area,
    address: r.address,
    type: r.type,
    notes: r.notes,
    is_favorite: r.isFavorite ? 1 : 0,
  };
}

function toUnit(r: PUnit): Unit {
  return {
    id: r.id,
    property_id: r.propertyId,
    code: r.code,
    type: r.type,
    status: r.status,
    asking_rent_gmd: r.askingRentGmd,
    notes: r.notes,
  };
}

function toPhoto(r: PUnitPhoto): UnitPhoto {
  return {
    id: r.id,
    unit_id: r.unitId,
    url: r.url,
    sort_order: r.sortOrder,
  };
}

function toTenant(r: PTenant): Tenant {
  return {
    id: r.id,
    full_name: r.fullName,
    phone: r.phone,
    phone_secondary: r.phoneSecondary,
    id_type: r.idType,
    id_number: r.idNumber,
    notes: r.notes,
    is_active: r.isActive ? 1 : 0,
  };
}

function toTenancy(r: PTenancy): Tenancy {
  return {
    id: r.id,
    tenant_id: r.tenantId,
    amount_gmd: r.amountGmd,
    period: r.period,
    start_date: r.startDate,
    next_due: r.nextDue,
    balance_gmd: r.balanceGmd,
    deposit_gmd: r.depositGmd,
    status: r.status,
    notes: r.notes,
  };
}

function toPayment(r: PPayment): Payment {
  return {
    id: r.id,
    tenancy_id: r.tenancyId,
    amount_gmd: r.amountGmd,
    paid_at: r.paidAt,
    period_start: r.periodStart,
    period_end: r.periodEnd,
    method: r.method,
    recorded_by: r.recordedById,
    sync_status: r.syncStatus,
    local_receipt_no: r.localReceiptNo,
    notes: r.notes,
  };
}

function toReceipt(r: PReceipt): Receipt {
  return {
    id: r.id,
    payment_id: r.paymentId,
    receipt_no: r.receiptNo,
    status: r.status,
    voided_at: r.voidedAt ? r.voidedAt.toISOString() : null,
    voided_by: r.voidedById,
    void_reason: r.voidReason,
    created_at: r.createdAt.toISOString(),
  };
}

/** @deprecated Prefer prisma helpers. Kept for call sites that imported `db`. */
export function db() {
  return prisma;
}

export async function allStaff() {
  return (await prisma.staff.findMany({ orderBy: { fullName: "asc" } })).map(toStaff);
}
export async function findStaffByEmail(email: string) {
  const row = await prisma.staff.findUnique({ where: { email } });
  return row ? toStaff(row) : undefined;
}
export async function findStaffById(id: string) {
  const row = await prisma.staff.findUnique({ where: { id } });
  return row ? toStaff(row) : undefined;
}

export async function allLandlords() {
  return (await prisma.landlord.findMany({ orderBy: { fullName: "asc" } })).map(toLandlord);
}
export async function findLandlord(id: string) {
  const row = await prisma.landlord.findUnique({ where: { id } });
  return row ? toLandlord(row) : undefined;
}

export async function allProperties() {
  return (await prisma.property.findMany({ orderBy: { name: "asc" } })).map(toProperty);
}
export async function findProperty(id: string) {
  const row = await prisma.property.findUnique({ where: { id } });
  return row ? toProperty(row) : undefined;
}

export async function unitsByProperty(propertyId: string) {
  return (await prisma.unit.findMany({ where: { propertyId }, orderBy: { code: "asc" } })).map(
    toUnit
  );
}
export async function findUnit(id: string) {
  const row = await prisma.unit.findUnique({ where: { id } });
  return row ? toUnit(row) : undefined;
}
export async function allUnits() {
  return (await prisma.unit.findMany({ orderBy: { code: "asc" } })).map(toUnit);
}

export async function photosByUnit(unitId: string) {
  return (
    await prisma.unitPhoto.findMany({ where: { unitId }, orderBy: { sortOrder: "asc" } })
  ).map(toPhoto);
}

export async function findTenant(id: string) {
  const row = await prisma.tenant.findUnique({ where: { id } });
  return row ? toTenant(row) : undefined;
}
export async function allTenants() {
  return (await prisma.tenant.findMany({ orderBy: { fullName: "asc" } })).map(toTenant);
}

export async function findTenancy(id: string) {
  const row = await prisma.tenancy.findUnique({ where: { id } });
  return row ? toTenancy(row) : undefined;
}
export async function allTenancies() {
  return (await prisma.tenancy.findMany()).map(toTenancy);
}
export async function tenanciesByTenant(tenantId: string) {
  return (await prisma.tenancy.findMany({ where: { tenantId } })).map(toTenancy);
}

export async function tenancyUnitLinks(tenancyId?: string, unitId?: string) {
  const rows = await prisma.tenancyUnit.findMany({
    where: tenancyId ? { tenancyId } : unitId ? { unitId } : undefined,
  });
  return rows.map(
    (r): TenancyUnitLink => ({
      id: r.id,
      tenancy_id: r.tenancyId,
      unit_id: r.unitId,
    })
  );
}

export async function paymentsByTenancy(tenancyId: string) {
  return (
    await prisma.payment.findMany({ where: { tenancyId }, orderBy: { paidAt: "desc" } })
  ).map(toPayment);
}
export async function paymentsOnDate(date: string) {
  return (await prisma.payment.findMany({ where: { paidAt: date } })).map(toPayment);
}
export async function allPayments() {
  return (await prisma.payment.findMany()).map(toPayment);
}

export type PropertyCollectionSqlRow = {
  propertyId: string;
  name: string;
  area: string | null;
  type: string;
  landlordName: string;
  collected: number;
  payments: number;
};

/** One row per property. Payments attributed to the tenancy's first unit. */
export async function collectionsByPropertyRange(start: string, end: string) {
  const properties = await prisma.property.findMany({
    include: { landlord: true },
    orderBy: { name: "asc" },
  });
  const payments = await prisma.payment.findMany({
    where: {
      paidAt: { gte: start, lte: end },
      amountGmd: { not: 0 },
      OR: [{ receipt: null }, { receipt: { status: { not: "void" } } }],
    },
    include: {
      tenancy: {
        include: {
          units: { include: { unit: true }, orderBy: { id: "asc" }, take: 1 },
        },
      },
    },
  });

  const byProperty = new Map<string, { collected: number; payments: number }>();
  for (const pay of payments) {
    const unit = pay.tenancy.units[0]?.unit;
    if (!unit) continue;
    const cur = byProperty.get(unit.propertyId) || { collected: 0, payments: 0 };
    cur.collected += pay.amountGmd;
    cur.payments += 1;
    byProperty.set(unit.propertyId, cur);
  }

  return properties
    .map((p) => {
      const stats = byProperty.get(p.id) || { collected: 0, payments: 0 };
      return {
        propertyId: p.id,
        name: p.name,
        area: p.area,
        type: p.type,
        landlordName: p.landlord?.fullName || "—",
        collected: stats.collected,
        payments: stats.payments,
      };
    })
    .sort((a, b) => b.collected - a.collected || a.name.localeCompare(b.name));
}

export async function findPayment(id: string) {
  const row = await prisma.payment.findUnique({ where: { id } });
  return row ? toPayment(row) : undefined;
}

export async function findReceipt(id: string) {
  const row = await prisma.receipt.findUnique({ where: { id } });
  return row ? toReceipt(row) : undefined;
}
export async function findReceiptByPayment(paymentId: string) {
  const row = await prisma.receipt.findUnique({ where: { paymentId } });
  return row ? toReceipt(row) : undefined;
}
export async function allReceipts() {
  return (await prisma.receipt.findMany({ orderBy: { createdAt: "desc" } })).map(toReceipt);
}
export async function countReceipts() {
  return prisma.receipt.count();
}
export async function receiptsPage(limit: number, offset: number) {
  return (
    await prisma.receipt.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    })
  ).map(toReceipt);
}

export async function insertAudit(
  id: string,
  staffId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  detail?: string | null
) {
  await prisma.auditLog.create({
    data: {
      id,
      staffId,
      action,
      entityType,
      entityId,
      detail: detail ?? null,
    },
  });
}
