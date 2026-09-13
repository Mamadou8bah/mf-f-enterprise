import { prisma } from "@garawol/db";

export type SearchTenantDoc = {
  id: string;
  fullName: string;
  phone: string | null;
  phoneSecondary: string | null;
  idType: string | null;
  idNumber: string | null;
};

export type SearchUnitDoc = {
  id: string;
  code: string;
  propertyId: string;
  propertyName: string;
};

export type SearchReceiptDoc = {
  id: string;
  receiptNo: string;
};

export type SearchPropertyDoc = {
  id: string;
  name: string;
  area: string | null;
};

export type SearchCatalog = {
  tenants: SearchTenantDoc[];
  units: SearchUnitDoc[];
  receipts: SearchReceiptDoc[];
  properties: SearchPropertyDoc[];
  builtAt: number;
};

const TTL_MS = 45_000;

const globalForSearch = globalThis as unknown as {
  garawolSearchCatalog?: { data: SearchCatalog; expiresAt: number } | null;
};

async function buildCatalog(): Promise<SearchCatalog> {
  const [tenants, units, receipts, properties] = await Promise.all([
    prisma.tenant.findMany({
      where: { isActive: true },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        phone: true,
        phoneSecondary: true,
        idType: true,
        idNumber: true,
      },
    }),
    prisma.unit.findMany({
      select: {
        id: true,
        code: true,
        propertyId: true,
        property: { select: { name: true } },
      },
      orderBy: { code: "asc" },
    }),
    prisma.receipt.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { id: true, receiptNo: true },
    }),
    prisma.property.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, area: true },
    }),
  ]);

  return {
    tenants: tenants.map((t) => ({
      id: t.id,
      fullName: t.fullName,
      phone: t.phone,
      phoneSecondary: t.phoneSecondary,
      idType: t.idType,
      idNumber: t.idNumber,
    })),
    units: units.map((u) => ({
      id: u.id,
      code: u.code,
      propertyId: u.propertyId,
      propertyName: u.property.name,
    })),
    receipts: receipts.map((r) => ({
      id: r.id,
      receiptNo: r.receiptNo,
    })),
    properties: properties.map((p) => ({
      id: p.id,
      name: p.name,
      area: p.area,
    })),
    builtAt: Date.now(),
  };
}

/** Warm catalog for typeahead. Cached ~45s per server instance. */
export async function getSearchCatalog(): Promise<SearchCatalog> {
  const hit = globalForSearch.garawolSearchCatalog;
  if (hit && hit.expiresAt > Date.now()) return hit.data;

  const data = await buildCatalog();
  globalForSearch.garawolSearchCatalog = {
    data,
    expiresAt: Date.now() + TTL_MS,
  };
  return data;
}

export function invalidateSearchCatalog() {
  globalForSearch.garawolSearchCatalog = null;
}
