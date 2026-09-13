import { requireSession } from "@/lib/session";
import {
  paymentsOnDate,
  allStaff,
  findTenancy,
  findTenant,
  tenancyUnitLinks,
  findUnit,
  findProperty,
} from "@/lib/data";
import { formatGmd, formatGmdCompact, startOfDayBanjul } from "@garawol/shared";
import { PrintButton } from "@/components/PrintButton";
import { PrintSheet, PrintSummary, PrintTable } from "@/components/PrintSheet";
import {
  PageHeader,
  PageShell,
  SoftCard,
  SoftList,
  SoftListItem,
  PillLink,
  StatTile,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CashUpPage() {
  await requireSession();
  const today = startOfDayBanjul().toISOString().slice(0, 10);
  const list = await paymentsOnDate(today);
  const byMethod: Record<string, number> = {};
  const byCollector: Record<string, number> = {};
  for (const p of list) {
    byMethod[p.method] = (byMethod[p.method] || 0) + p.amount_gmd;
    byCollector[p.recorded_by] = (byCollector[p.recorded_by] || 0) + p.amount_gmd;
  }
  const staffMap = Object.fromEntries((await allStaff()).map((s) => [s.id, s.full_name]));
  const total = list.reduce((s, p) => s + p.amount_gmd, 0);
  const lines = await Promise.all(
    list.map(async (p) => {
      const t = await findTenancy(p.tenancy_id);
      const tenant = t ? await findTenant(t.tenant_id) : null;
      const links = t ? await tenancyUnitLinks(t.id) : [];
      const link = links[0] || null;
      const unit = link ? await findUnit(link.unit_id) : null;
      const prop = unit ? await findProperty(unit.property_id) : null;
      return {
        p,
        tenantName: tenant?.full_name || "—",
        unitCode: unit?.code || "—",
        propertyName: prop?.name || "—",
        staffName: staffMap[p.recorded_by] || p.recorded_by,
      };
    })
  );

  return (
    <>
    <div className="no-print">
    <PageShell>
      <PageHeader
        eyebrow="Today’s desk"
        title="Daily cash-up"
        description={today}
        actions={
          <>
            <PrintButton />
            <PillLink href="/documents" variant="secondary">
              Documents
            </PillLink>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile label="Total" value={formatGmdCompact(total)} />
        <StatTile label="Payments" value={String(list.length)} />
        <StatTile label="Methods" value={String(Object.keys(byMethod).length)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SoftCard>
          <h2 className="text-sm font-semibold text-garawol-ink">By method</h2>
          <div className="mt-3 space-y-2">
            {Object.entries(byMethod).map(([k, v]) => (
              <p key={k} className="flex justify-between text-sm">
                <span className="capitalize text-garawol-muted">{k}</span>
                <span className="font-semibold tabular-nums">{formatGmd(v)}</span>
              </p>
            ))}
            {Object.keys(byMethod).length === 0 && (
              <p className="text-sm text-garawol-muted">No payments yet today.</p>
            )}
          </div>
        </SoftCard>
        <SoftCard>
          <h2 className="text-sm font-semibold text-garawol-ink">By staff</h2>
          <div className="mt-3 space-y-2">
            {Object.entries(byCollector).map(([k, v]) => (
              <p key={k} className="flex justify-between text-sm">
                <span className="text-garawol-muted">{staffMap[k] || k}</span>
                <span className="font-semibold tabular-nums">{formatGmd(v)}</span>
              </p>
            ))}
            {Object.keys(byCollector).length === 0 && (
              <p className="text-sm text-garawol-muted">No payments yet today.</p>
            )}
          </div>
        </SoftCard>
      </div>
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-garawol-muted">
          Payment lines
        </h2>
        <SoftList>
          {lines.map(({ p, unitCode, propertyName }) => (
              <SoftListItem key={p.id}>
                <p className="font-semibold tabular-nums text-garawol-ink">
                  {formatGmd(p.amount_gmd)}
                </p>
                <p className="text-xs text-garawol-muted">
                  {p.method} · {unitCode} @ {propertyName}
                </p>
              </SoftListItem>
            ))}
          {list.length === 0 && (
            <li className="p-8 text-center text-sm text-garawol-muted">Nothing recorded today.</li>
          )}
        </SoftList>
      </div>
    </PageShell>
    </div>
    <PrintSheet title="Daily cash-up" subtitle={today}>
      <PrintSummary
        items={[
          { label: "Total collected", value: formatGmd(total) },
          { label: "Payments", value: String(list.length) },
          { label: "Methods", value: String(Object.keys(byMethod).length) },
        ]}
      />
      <p className="print-section-label">By method</p>
      <PrintTable
        columns={["Method", "Amount"]}
        rows={Object.entries(byMethod).map(([k, v]) => [k, formatGmd(v)])}
        empty="No payments yet today."
      />
      <p className="print-section-label">By staff</p>
      <PrintTable
        columns={["Staff", "Amount"]}
        rows={Object.entries(byCollector).map(([k, v]) => [staffMap[k] || k, formatGmd(v)])}
        empty="No payments yet today."
      />
      <p className="print-section-label">Payment lines</p>
      <PrintTable
        columns={["Tenant", "Unit", "Property", "Method", "Amount", "Staff"]}
        rows={lines.map(({ p, tenantName, unitCode, propertyName, staffName }) => [
          tenantName,
          unitCode,
          propertyName,
          p.method,
          formatGmd(p.amount_gmd),
          staffName,
        ])}
        empty="Nothing recorded today."
      />
    </PrintSheet>
    </>
  );
}
