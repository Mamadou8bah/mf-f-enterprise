import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  allPayments,
  allReceipts,
  allTenancies,
  findTenant,
  findUnit,
  findProperty,
  tenancyUnitLinks,
} from "@/lib/data";
import { daysBetween, startOfDayBanjul } from "@garawol/shared";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const type = new URL(req.url).searchParams.get("type") || "payments";
  let csv = "";

  if (type === "payments") {
    csv = "receipt_no,paid_at,amount,method,tenancy_id\n";
    const receipts = Object.fromEntries((await allReceipts()).map((r) => [r.payment_id, r]));
    for (const p of await allPayments()) {
      csv += `${receipts[p.id]?.receipt_no || ""},${p.paid_at},${p.amount_gmd},${p.method},${p.tenancy_id}\n`;
    }
  } else if (type === "tenancies") {
    csv = "tenant,units,property,amount,period,next_due,status\n";
    for (const t of await allTenancies()) {
      const tenant = await findTenant(t.tenant_id);
      const links = await tenancyUnitLinks(t.id);
      const codes = (
        await Promise.all(links.map(async (l) => (await findUnit(l.unit_id))?.code))
      )
        .filter(Boolean)
        .join("|");
      const unit = links[0] ? await findUnit(links[0].unit_id) : null;
      const prop = unit ? await findProperty(unit.property_id) : null;
      csv += `"${tenant?.full_name || ""}","${codes}","${prop?.name || ""}",${t.amount_gmd},${t.period},${t.next_due || ""},${t.status}\n`;
    }
  } else {
    csv = "tenant,units,property,amount,days_overdue,next_due\n";
    const today = startOfDayBanjul();
    const todayStr = today.toISOString().slice(0, 10);
    for (const t of (await allTenancies()).filter((x) => x.status === "active")) {
      if (!t.next_due || t.next_due >= todayStr) continue;
      const tenant = await findTenant(t.tenant_id);
      const links = await tenancyUnitLinks(t.id);
      const codes = (
        await Promise.all(links.map(async (l) => (await findUnit(l.unit_id))?.code))
      )
        .filter(Boolean)
        .join("|");
      const unit = links[0] ? await findUnit(links[0].unit_id) : null;
      const prop = unit ? await findProperty(unit.property_id) : null;
      const days = daysBetween(new Date(t.next_due), today);
      csv += `"${tenant?.full_name || ""}","${codes}","${prop?.name || ""}",${t.balance_gmd || t.amount_gmd},${days},${t.next_due}\n`;
    }
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="mff-${type}.csv"`,
    },
  });
}
