import {
  allProperties,
  allUnits,
  allPayments,
  findLandlord,
  findProperty,
  findTenant,
  findTenancy,
  findUnit,
  findReceipt,
  findPayment,
  findReceiptByPayment,
  findStaffById,
  paymentsByTenancy,
  paymentsOnDate,
  photosByUnit,
  tenancyUnitLinks,
  allTenancies,
  allTenants,
  allReceipts,
  collectionsByPropertyRange,
  unitsByProperty,
  type Tenancy,
  type Tenant,
  type Unit,
} from "@/lib/data";
import { daysBetween, startOfDayBanjul, isPlausibleRentAmount } from "@garawol/shared";
import { matchesTenantIdQuery } from "@/lib/tenant-id";
import { recorderLabel } from "@/lib/roles";

export function scopedPropertyFilter(
  propertyScope: string | null | undefined
): string[] | null {
  if (!propertyScope) return null;
  try {
    const ids = JSON.parse(propertyScope) as string[];
    return Array.isArray(ids) ? ids : null;
  } catch {
    return null;
  }
}

export async function getTodayStats(staffId?: string, propertyScope?: string | null) {
  const today = startOfDayBanjul().toISOString().slice(0, 10);
  const weekEnd = new Date(startOfDayBanjul());
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);
  const scope = scopedPropertyFilter(propertyScope);

  let props = await allProperties();
  if (scope) props = props.filter((p) => scope.includes(p.id));
  const propIds = new Set(props.map((p) => p.id));
  const propertyUnits = (await allUnits()).filter((u) => propIds.has(u.property_id));
  const unitIds = new Set(propertyUnits.map((u) => u.id));
  const links = (await tenancyUnitLinks()).filter((l) => unitIds.has(l.unit_id));
  const tenancyIds = new Set(links.map((l) => l.tenancy_id));
  const activeTenancies = (await allTenancies()).filter(
    (t) => t.status === "active" && tenancyIds.has(t.id)
  );

  let overdue = 0;
  let dueSoon = 0;
  let overdueAmount = 0;
  let overdueSkipped = 0;
  for (const t of activeTenancies) {
    if (!t.next_due) continue;
    const unitLink = links.find((l) => l.tenancy_id === t.id);
    const unit = unitLink ? propertyUnits.find((u) => u.id === unitLink.unit_id) : null;
    if (unit?.status === "family_free") continue;
    if (t.next_due < today) {
      overdue++;
      const due = t.balance_gmd || t.amount_gmd;
      if (isPlausibleRentAmount(due)) overdueAmount += due;
      else overdueSkipped++;
    } else if (t.next_due <= weekEndStr) {
      dueSoon++;
    }
  }

  const vacancies = propertyUnits.filter((u) => u.status === "vacant").length;
  const occupied = propertyUnits.filter((u) => u.status === "occupied").length;
  let collectionsToday = await paymentsOnDate(today);
  if (staffId) collectionsToday = collectionsToday.filter((p) => p.recorded_by === staffId);
  const collectedAmount = collectionsToday.reduce(
    (s, p) => s + (isPlausibleRentAmount(p.amount_gmd) ? p.amount_gmd : 0),
    0
  );
  const favorites = props.filter((p) => p.is_favorite);
  const tenantIds = new Set(activeTenancies.map((t) => t.tenant_id));

  const monthPrefix = today.slice(0, 7);
  let monthCollected = 0;
  const allPay = await allPayments();
  for (const p of allPay) {
    if (!p.paid_at.startsWith(monthPrefix)) continue;
    if (!isPlausibleRentAmount(p.amount_gmd)) continue;
    const tLinks = await tenancyUnitLinks(p.tenancy_id);
    const unit = tLinks[0] ? propertyUnits.find((u) => u.id === tLinks[0].unit_id) : null;
    if (scope && (!unit || !propIds.has(unit.property_id))) continue;
    monthCollected += p.amount_gmd;
  }

  const weekSeries: { label: string; date: string; amount: number; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfDayBanjul());
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const dayPayments = allPay.filter(
      (p) =>
        p.paid_at.startsWith(date) &&
        isPlausibleRentAmount(p.amount_gmd) &&
        (!staffId || p.recorded_by === staffId)
    );
    weekSeries.push({
      label: d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "Africa/Banjul" }),
      date,
      amount: dayPayments.reduce((s, p) => s + p.amount_gmd, 0),
      count: dayPayments.length,
    });
  }

  const monthLabel = startOfDayBanjul().toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "Africa/Banjul",
  });

  return {
    overdue,
    dueSoon,
    overdueAmount,
    overdueSkipped,
    vacancies,
    occupied,
    unitCount: propertyUnits.length,
    tenantCount: tenantIds.size,
    propertyCount: props.length,
    collectionsCount: collectionsToday.length,
    collectedAmount,
    monthCollected,
    revenueAmount: monthCollected + overdueAmount,
    monthLabel,
    favorites,
    properties: props,
    weekSeries,
  };
}

export type DueCollectionRow = {
  tenancyId: string;
  tenantId: string;
  tenantName: string;
  phone: string | null;
  idType: string | null;
  idNumber: string | null;
  unitCodes: string;
  propertyName: string;
  amount: number;
  nextDue: string;
  days: number;
  status: "overdue" | "due_soon";
};

/** Active tenancies that are overdue or due within the next 7 days. */
export async function getDueCollections(): Promise<{
  overdue: DueCollectionRow[];
  dueSoon: DueCollectionRow[];
  overdueTotal: number;
  dueSoonTotal: number;
}> {
  const today = startOfDayBanjul();
  const todayStr = today.toISOString().slice(0, 10);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  const overdue: DueCollectionRow[] = [];
  const dueSoon: DueCollectionRow[] = [];

  for (const t of await allTenancies()) {
    if (t.status !== "active" || !t.next_due) continue;
    const links = await tenancyUnitLinks(t.id);
    const units = (
      await Promise.all(links.map(async (l) => findUnit(l.unit_id)))
    ).filter(Boolean) as Unit[];
    if (units.some((u) => u.status === "family_free")) continue;
    const codes = units.map((u) => u.code).join(", ");
    const prop = units[0] ? await findProperty(units[0].property_id) : null;
    const tenant = await findTenant(t.tenant_id);
    const amount = t.balance_gmd || t.amount_gmd;
    const base = {
      tenancyId: t.id,
      tenantId: t.tenant_id,
      tenantName: tenant?.full_name || "Unknown",
      phone: tenant?.phone || null,
      idType: tenant?.id_type || null,
      idNumber: tenant?.id_number || null,
      unitCodes: codes,
      propertyName: prop?.name || "—",
      amount,
      nextDue: t.next_due,
    };

    if (t.next_due < todayStr) {
      overdue.push({
        ...base,
        days: daysBetween(new Date(t.next_due), today),
        status: "overdue",
      });
    } else if (t.next_due <= weekEndStr) {
      dueSoon.push({
        ...base,
        days: daysBetween(today, new Date(t.next_due)),
        status: "due_soon",
      });
    }
  }

  overdue.sort((a, b) => b.days - a.days);
  dueSoon.sort((a, b) => a.days - b.days);

  return {
    overdue,
    dueSoon,
    overdueTotal: overdue.reduce(
      (s, r) => s + (isPlausibleRentAmount(r.amount) ? r.amount : 0),
      0
    ),
    dueSoonTotal: dueSoon.reduce(
      (s, r) => s + (isPlausibleRentAmount(r.amount) ? r.amount : 0),
      0
    ),
  };
}

export async function getPropertyRound(propertyId: string) {
  const property = await findProperty(propertyId);
  if (!property) return null;
  const landlord = await findLandlord(property.landlord_id);
  const propertyUnits = await unitsByProperty(propertyId);
  const today = startOfDayBanjul().toISOString().slice(0, 10);

  const rows = await Promise.all(
    propertyUnits.map(async (unit) => {
      const unitLinks = await tenancyUnitLinks(undefined, unit.id);
      let tenancy: Tenancy | null = null;
      let tenant: Tenant | null = null;
      for (const l of unitLinks) {
        const t = await findTenancy(l.tenancy_id);
        if (t?.status === "active") {
          tenancy = t;
          tenant = (await findTenant(t.tenant_id)) || null;
          break;
        }
      }
      const photos = await photosByUnit(unit.id);
      let dueState: "overdue" | "due_soon" | "ok" | "skip" = "ok";
      let daysOverdue = 0;
      if (unit.status === "family_free") dueState = "skip";
      else if (tenancy?.next_due) {
        if (tenancy.next_due < today) {
          dueState = "overdue";
          daysOverdue = daysBetween(new Date(tenancy.next_due), startOfDayBanjul());
        } else {
          const week = new Date(startOfDayBanjul());
          week.setDate(week.getDate() + 7);
          if (tenancy.next_due <= week.toISOString().slice(0, 10)) dueState = "due_soon";
        }
      }
      return { unit, tenancy, tenant, photos, dueState, daysOverdue };
    })
  );

  const order = { overdue: 0, due_soon: 1, ok: 2, skip: 3 };
  rows.sort(
    (a, b) => order[a.dueState] - order[b.dueState] || a.unit.code.localeCompare(b.unit.code)
  );

  return { property, landlord, rows };
}

export async function getTenancyDetail(tenancyId: string) {
  const tenancy = await findTenancy(tenancyId);
  if (!tenancy) return null;
  const tenant = await findTenant(tenancy.tenant_id);
  const detailLinks = await tenancyUnitLinks(tenancyId);
  const unitList = (
    await Promise.all(detailLinks.map(async (l) => findUnit(l.unit_id)))
  ).filter(Boolean) as Unit[];
  const property = unitList[0] ? await findProperty(unitList[0].property_id) : null;
  const landlord = property ? await findLandlord(property.landlord_id) : null;
  const paymentList = await paymentsByTenancy(tenancyId);
  const receiptMap: Record<string, Awaited<ReturnType<typeof findReceiptByPayment>>> = {};
  for (const p of paymentList) {
    receiptMap[p.id] = await findReceiptByPayment(p.id);
  }
  return { tenancy, tenant, units: unitList, property, landlord, payments: paymentList, receiptMap };
}

export async function searchAll(q: string, limit = 40) {
  const term = q.trim().toLowerCase();
  const tenantRows = (await allTenants())
    .slice()
    .sort((a, b) => a.full_name.localeCompare(b.full_name, undefined, { sensitivity: "base" }));
  const tenants = (term
    ? tenantRows.filter(
        (t) =>
          t.full_name.toLowerCase().includes(term) ||
          (t.phone || "").includes(term) ||
          (t.phone_secondary || "").includes(term) ||
          matchesTenantIdQuery(term, t.id_type, t.id_number)
      )
    : tenantRows
  )
    .slice(0, term ? limit : undefined)
    .map((t) => ({
      id: t.id,
      fullName: t.full_name,
      phone: t.phone,
      idType: t.id_type,
      idNumber: t.id_number,
    }));

  if (!term) return { tenants, units: [], receipts: [] };

  const units = (await allUnits())
    .filter((u) => u.code.toLowerCase().includes(term))
    .slice(0, limit)
    .map((u) => ({ id: u.id, code: u.code, propertyId: u.property_id }));
  const receipts = (await allReceipts())
    .filter((r) => r.receipt_no.toLowerCase().includes(term))
    .slice(0, limit)
    .map((r) => ({ id: r.id, receiptNo: r.receipt_no }));
  return { tenants, units, receipts };
}

export async function getReceiptBundle(receiptId: string) {
  const receipt = await findReceipt(receiptId);
  if (!receipt) return null;
  const payment = await findPayment(receipt.payment_id);
  if (!payment) return null;
  const detail = await getTenancyDetail(payment.tenancy_id);
  return { receipt, payment, ...detail };
}

export type ReceiptListRow = {
  id: string;
  receiptNo: string;
  status: string;
  paidAt: string | null;
  amount: number | null;
  tenantName: string | null;
  unitCodes: string;
  propertyName: string | null;
  recordedBy: string;
};

export async function listReceiptRows(): Promise<ReceiptListRow[]> {
  const receipts = await allReceipts();
  return Promise.all(
    receipts.map(async (r) => {
      const payment = await findPayment(r.payment_id);
      const tenancy = payment ? await findTenancy(payment.tenancy_id) : null;
      const tenant = tenancy ? await findTenant(tenancy.tenant_id) : null;
      const links = payment ? await tenancyUnitLinks(payment.tenancy_id) : [];
      const units = (
        await Promise.all(links.map(async (l) => findUnit(l.unit_id)))
      ).filter(Boolean) as Unit[];
      const property = units[0] ? await findProperty(units[0].property_id) : null;
      const staff = payment ? await findStaffById(payment.recorded_by) : undefined;
      return {
        id: r.id,
        receiptNo: r.receipt_no,
        status: r.status,
        paidAt: payment?.paid_at || r.created_at,
        amount: payment?.amount_gmd ?? null,
        tenantName: tenant?.full_name || null,
        unitCodes: units.map((u) => u.code).join(", "),
        propertyName: property?.name || null,
        recordedBy: recorderLabel(staff?.full_name, staff?.role),
      };
    })
  );
}

export type PropertyCollectionRow = {
  propertyId: string;
  name: string;
  area: string | null;
  type: string;
  landlordName: string;
  collected: number;
  payments: number;
  share: number;
};

export async function getCollectionsByProperty(start: string, end: string) {
  const raw = await collectionsByPropertyRange(start, end);
  const totalCollected = raw.reduce((s, r) => s + r.collected, 0);
  const paymentCount = raw.reduce((s, r) => s + r.payments, 0);
  const rows: PropertyCollectionRow[] = raw.map((r) => ({
    ...r,
    share: totalCollected > 0 ? Math.round((r.collected / totalCollected) * 100) : 0,
  }));
  return {
    rows,
    totalCollected,
    paymentCount,
    propertiesWithTake: rows.filter((r) => r.collected > 0).length,
  };
}

export { findStaffById };
