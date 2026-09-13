import { formatGmd } from "./money";
import { formatDate, periodLabel } from "./periods";
import type { RentPeriod } from "./types";

const COMPANY = "MF & F Enterprise";

export function paymentReminderText(opts: {
  tenantName: string;
  unitCodes: string;
  propertyName: string;
  amount: number;
  dueDate: Date | string;
  period: RentPeriod;
}): string {
  return [
    `Assalamu alaikum ${opts.tenantName},`,
    ``,
    `This is a reminder from ${COMPANY} regarding rent for ${opts.unitCodes} at ${opts.propertyName}.`,
    `Amount due: ${formatGmd(opts.amount)} (${periodLabel(opts.period)})`,
    `Due date: ${formatDate(opts.dueDate)}`,
    ``,
    `Please visit our office to make payment. Thank you.`,
    `— ${COMPANY}`,
  ].join("\n");
}

export function receiptWhatsAppText(opts: {
  receiptNo: string;
  tenantName: string;
  unitCodes: string;
  propertyName: string;
  landlordName: string;
  amount: number;
  periodStart: Date | string;
  periodEnd: Date | string;
  paidAt: Date | string;
  balanceRemaining: number;
  collectorName: string;
}): string {
  const lines = [
    `*${COMPANY} — Receipt*`,
    `No: ${opts.receiptNo}`,
    `Tenant: ${opts.tenantName}`,
    `Unit: ${opts.unitCodes} @ ${opts.propertyName}`,
    `Collected for: ${opts.landlordName}`,
    `Amount: ${formatGmd(opts.amount)}`,
    `Period: ${formatDate(opts.periodStart)} – ${formatDate(opts.periodEnd)}`,
    `Date paid: ${formatDate(opts.paidAt)}`,
  ];
  if (opts.balanceRemaining > 0) {
    lines.push(`Balance remaining: ${formatGmd(opts.balanceRemaining)}`);
  }
  lines.push(`Issued by: ${opts.collectorName}`, `Thank you.`);
  return lines.join("\n");
}

export function vacancyBlurb(opts: {
  propertyName: string;
  unitCode: string;
  unitType: string;
  askingRent: number | null;
  period?: RentPeriod | null;
  photoUrl?: string | null;
}): string {
  const rent =
    opts.askingRent != null
      ? `${formatGmd(opts.askingRent)}${opts.period ? ` / ${periodLabel(opts.period)}` : ""}`
      : "Rent on request";
  const lines = [
    `Vacant ${opts.unitType} available`,
    `${opts.unitCode} — ${opts.propertyName}`,
    rent,
    `Contact ${COMPANY}`,
  ];
  if (opts.photoUrl) lines.push(opts.photoUrl);
  return lines.join("\n");
}

export function whatsappUrl(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountry =
    digits.length === 7 ? `220${digits}` : digits.startsWith("220") ? digits : digits;
  const base = `https://wa.me/${withCountry}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function telUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `tel:+${digits.length === 7 ? `220${digits}` : digits}`;
}
