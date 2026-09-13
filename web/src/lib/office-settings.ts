import { prisma } from "@garawol/db";
import { DEFAULT_OFFICE, type OfficeSettings } from "@/lib/brand";

export type { OfficeSettings };

function fromRow(row: {
  companyName: string;
  companyShort: string;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  receiptPrefix: string;
  receiptFooter: string | null;
} | null): OfficeSettings {
  if (!row) return { ...DEFAULT_OFFICE };
  return {
    companyName: row.companyName || DEFAULT_OFFICE.companyName,
    companyShort: row.companyShort || DEFAULT_OFFICE.companyShort,
    tagline: row.tagline || DEFAULT_OFFICE.tagline,
    phone: row.phone || "",
    email: row.email || "",
    address: row.address || "",
    receiptPrefix: (row.receiptPrefix || DEFAULT_OFFICE.receiptPrefix).toUpperCase(),
    receiptFooter: row.receiptFooter || DEFAULT_OFFICE.receiptFooter,
  };
}

export async function ensureOfficeSettings() {
  const existing = await prisma.officeSettings.findUnique({ where: { id: "office" } });
  if (existing) return;
  await prisma.officeSettings.create({
    data: {
      id: "office",
      companyName: DEFAULT_OFFICE.companyName,
      companyShort: DEFAULT_OFFICE.companyShort,
      tagline: DEFAULT_OFFICE.tagline,
      phone: "",
      email: "",
      address: "",
      receiptPrefix: DEFAULT_OFFICE.receiptPrefix,
      receiptFooter: DEFAULT_OFFICE.receiptFooter,
    },
  });
}

export async function getOfficeSettings(): Promise<OfficeSettings> {
  await ensureOfficeSettings();
  const row = await prisma.officeSettings.findUnique({ where: { id: "office" } });
  return fromRow(row);
}

export async function saveOfficeSettings(input: Partial<OfficeSettings>): Promise<OfficeSettings> {
  await ensureOfficeSettings();
  const current = await getOfficeSettings();
  const next: OfficeSettings = {
    companyName: (input.companyName ?? current.companyName).trim() || DEFAULT_OFFICE.companyName,
    companyShort: (input.companyShort ?? current.companyShort).trim() || DEFAULT_OFFICE.companyShort,
    tagline: (input.tagline ?? current.tagline).trim() || DEFAULT_OFFICE.tagline,
    phone: (input.phone ?? current.phone).trim(),
    email: (input.email ?? current.email).trim(),
    address: (input.address ?? current.address).trim(),
    receiptPrefix: sanitizePrefix(input.receiptPrefix ?? current.receiptPrefix),
    receiptFooter: (input.receiptFooter ?? current.receiptFooter).trim() || DEFAULT_OFFICE.receiptFooter,
  };
  await prisma.officeSettings.update({
    where: { id: "office" },
    data: {
      companyName: next.companyName,
      companyShort: next.companyShort,
      tagline: next.tagline,
      phone: next.phone,
      email: next.email,
      address: next.address,
      receiptPrefix: next.receiptPrefix,
      receiptFooter: next.receiptFooter,
    },
  });
  return next;
}

export function sanitizePrefix(raw: string) {
  const cleaned = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8);
  return cleaned.length >= 2 ? cleaned : DEFAULT_OFFICE.receiptPrefix;
}

export function officeContactLine(office: OfficeSettings) {
  return [office.address, office.phone, office.email].filter(Boolean).join(" · ");
}
