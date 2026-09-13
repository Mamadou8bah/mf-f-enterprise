import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getTenancyDetail } from "@/lib/queries";
import { paymentsByTenancy } from "@/lib/data";
import { QuickPayForm } from "@/components/QuickPayForm";
import { nextDueFromPeriodEnd, startOfDayBanjul } from "@garawol/shared";
import type { RentPeriod } from "@garawol/shared";

export const dynamic = "force-dynamic";

export default async function PayPage({ params }: { params: Promise<{ tenancyId: string }> }) {
  await requireSession();
  const { tenancyId } = await params;
  const detail = await getTenancyDetail(tenancyId);
  if (!detail?.tenancy || !detail.tenant || !detail.property) notFound();

  const payments = await paymentsByTenancy(tenancyId);
  const last = payments[0];
  const lastPeriodEnd = last?.period_end || null;

  // Prefer stored next_due; if missing, continue from last payment cover; else today.
  let nextDue = detail.tenancy.next_due;
  if (!nextDue && lastPeriodEnd) {
    nextDue = nextDueFromPeriodEnd(lastPeriodEnd).toISOString().slice(0, 10);
  }
  if (!nextDue) {
    nextDue = startOfDayBanjul().toISOString().slice(0, 10);
  }

  // If next_due is somehow before the last covered end, advance it.
  if (lastPeriodEnd && nextDue <= lastPeriodEnd) {
    nextDue = nextDueFromPeriodEnd(lastPeriodEnd).toISOString().slice(0, 10);
  }

  return (
    <QuickPayForm
      tenancyId={detail.tenancy.id}
      tenantId={detail.tenant.id}
      tenantName={detail.tenant.full_name}
      unitCodes={detail.units.map((u) => u.code).join(", ")}
      propertyName={detail.property.name}
      amountGmd={detail.tenancy.amount_gmd}
      period={detail.tenancy.period as RentPeriod}
      nextDue={nextDue}
    />
  );
}
