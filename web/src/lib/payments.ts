import { randomUUID } from "crypto";
import { prisma } from "@garawol/db";
import { findTenancy, findReceipt, insertAudit } from "@/lib/data";
import {
  nextDueFromPeriodEnd,
  periodEndFromStart,
  startOfDayBanjul,
} from "@garawol/shared";
import type { PaymentMethod, RentPeriod } from "@garawol/shared";
import { getOfficeSettings } from "@/lib/office-settings";

export function newId() {
  return randomUUID();
}

export async function audit(
  staffId: string | null | undefined,
  action: string,
  entityType: string,
  entityId: string,
  detail?: string
) {
  await insertAudit(newId(), staffId || null, action, entityType, entityId, detail || null);
}

export async function nextOfficialReceiptNo(): Promise<string> {
  const year = new Date().getFullYear();
  const office = await getOfficeSettings();
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.receiptCounter.findUnique({ where: { year } });
    if (!row) {
      await tx.receiptCounter.create({ data: { year, lastValue: 1 } });
      return 1;
    }
    const next = row.lastValue + 1;
    await tx.receiptCounter.update({ where: { year }, data: { lastValue: next } });
    return next;
  });
  return `${office.receiptPrefix}-${year}-${String(updated).padStart(5, "0")}`;
}

export async function recordPayment(input: {
  tenancyId: string;
  amountGmd: number;
  paidAt?: string;
  periodStart?: string;
  periodEnd?: string;
  method?: PaymentMethod;
  recordedBy: string;
  notes?: string;
  localReceiptNo?: string;
  syncStatus?: string;
}) {
  const tenancy = await findTenancy(input.tenancyId);
  if (!tenancy) throw new Error("Tenancy not found");

  const paidAt = input.paidAt || startOfDayBanjul().toISOString().slice(0, 10);
  const periodStart =
    input.periodStart ||
    tenancy.next_due ||
    startOfDayBanjul().toISOString().slice(0, 10);
  const periodEnd =
    input.periodEnd ||
    periodEndFromStart(new Date(periodStart), tenancy.period as RentPeriod)
      .toISOString()
      .slice(0, 10);

  const paymentId = newId();
  const receiptId = newId();
  const receiptNo = input.localReceiptNo?.startsWith("LOCAL-")
    ? input.localReceiptNo
    : await nextOfficialReceiptNo();

  const balanceBefore = tenancy.balance_gmd || tenancy.amount_gmd;
  const target = balanceBefore > 0 ? balanceBefore : tenancy.amount_gmd;
  const newBalance = Math.max(0, target - input.amountGmd);

  await prisma.payment.create({
    data: {
      id: paymentId,
      tenancyId: input.tenancyId,
      amountGmd: input.amountGmd,
      paidAt,
      periodStart,
      periodEnd,
      method: input.method || "cash",
      recordedById: input.recordedBy,
      syncStatus: input.syncStatus || "synced",
      localReceiptNo: input.localReceiptNo || null,
      notes: input.notes || null,
    },
  });

  await prisma.receipt.create({
    data: {
      id: receiptId,
      paymentId,
      receiptNo,
      status: "issued",
    },
  });

  if (newBalance === 0) {
    const nextDue = nextDueFromPeriodEnd(periodEnd).toISOString().slice(0, 10);
    await prisma.tenancy.update({
      where: { id: input.tenancyId },
      data: { balanceGmd: tenancy.amount_gmd, nextDue },
    });
  } else {
    await prisma.tenancy.update({
      where: { id: input.tenancyId },
      data: { balanceGmd: newBalance },
    });
  }

  await audit(input.recordedBy, "payment.record", "payment", paymentId, receiptNo);

  return {
    paymentId,
    receiptId,
    receiptNo,
    balanceRemaining: newBalance === 0 ? 0 : newBalance,
  };
}

export async function voidReceipt(receiptId: string, staffId: string, reason: string) {
  const receipt = await findReceipt(receiptId);
  if (!receipt || receipt.status === "void") throw new Error("Cannot void");
  await prisma.receipt.update({
    where: { id: receiptId },
    data: {
      status: "void",
      voidedAt: new Date(),
      voidedById: staffId,
      voidReason: reason,
    },
  });
  await audit(staffId, "receipt.void", "receipt", receiptId, reason);
}
