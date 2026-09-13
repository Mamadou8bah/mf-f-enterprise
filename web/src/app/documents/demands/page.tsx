import { requireSession } from "@/lib/session";
import { allProperties } from "@/lib/data";
import { getPropertyRound } from "@/lib/queries";
import { paymentReminderText, formatGmd } from "@garawol/shared";
import type { RentPeriod } from "@garawol/shared";
import { BatchCopyReminders } from "@/components/BatchCopyReminders";
import { PrintButton } from "@/components/PrintButton";
import { PrintSheet, PrintSummary } from "@/components/PrintSheet";
import {
  PageHeader,
  PageShell,
  SoftList,
  SoftListItem,
  PillLink,
  NavCard,
  BackLink,
  StatTile,
} from "@/components/ui";
import { PropertyIcon } from "@/components/PropertyIcon";
import { PageSearch } from "@/components/PageSearch";
import { matchesQuery } from "@/lib/search";
import { matchesTenantIdQuery } from "@/lib/tenant-id";

export const dynamic = "force-dynamic";

export default async function DemandsPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string; q?: string }>;
}) {
  await requireSession();
  const { propertyId, q: rawQ } = await searchParams;
  const q = (rawQ || "").trim();
  const term = q.toLowerCase();

  if (!propertyId) {
    const props = (await allProperties()).filter((p) => matchesQuery(term, p.name, p.area, p.type));
    return (
      <PageShell>
        <PageHeader
          eyebrow="Reminders"
          title="Rent demands"
          description="Pick a property to copy overdue reminders"
          actions={<PillLink href="/documents" variant="secondary">Documents</PillLink>}
        />
        <PageSearch initialQ={q} placeholder="Search this list by building or area…" />
        <div className="grid gap-2 sm:grid-cols-2">
          {props.map((p) => (
            <NavCard
              key={p.id}
              href={`/documents/demands?propertyId=${p.id}`}
              title={p.name}
              icon={<PropertyIcon type={p.type} name={p.name} favorite={!!p.is_favorite} />}
            />
          ))}
          {props.length === 0 && (
            <p className="col-span-full p-8 text-center text-sm text-garawol-muted">
              {q ? `No properties match “${q}”.` : "No properties yet."}
            </p>
          )}
        </div>
      </PageShell>
    );
  }

  const data = await getPropertyRound(propertyId);
  if (!data) return <p>Not found</p>;
  const overdueAll = data.rows.filter((r) => r.dueState === "overdue" && r.tenant && r.tenancy);
  const overdue = term
    ? overdueAll.filter(
        (r) =>
          matchesQuery(
            term,
            r.unit.code,
            r.tenant?.full_name,
            r.tenant?.phone,
            r.tenant?.phone_secondary
          ) || matchesTenantIdQuery(term, r.tenant?.id_type, r.tenant?.id_number)
      )
    : overdueAll;
  const texts = overdue.map((r) =>
    paymentReminderText({
      tenantName: r.tenant!.full_name,
      unitCodes: r.unit.code,
      propertyName: data.property.name,
      amount: r.tenancy!.balance_gmd || r.tenancy!.amount_gmd,
      dueDate: r.tenancy!.next_due || new Date(),
      period: r.tenancy!.period as RentPeriod,
    })
  );

  return (
    <>
    <div className="no-print">
    <PageShell>
      <BackLink href="/documents/demands">All properties</BackLink>
      <PageHeader
        eyebrow="Demands"
        title={data.property.name}
        description={`${overdue.length} overdue tenants`}
        actions={
          <>
            <PrintButton />
            <PillLink href="/documents" variant="secondary">
              Documents
            </PillLink>
          </>
        }
      />
      <StatTile label="Reminders" value={String(overdue.length)} accent={overdue.length > 0} />
      <PageSearch
        initialQ={q}
        placeholder="Search this list by tenant, shop, phone, or ID…"
        keep={{ propertyId }}
      />
      <BatchCopyReminders texts={texts} />
      <SoftList>
        {overdue.map((r, i) => (
          <SoftListItem key={r.unit.id}>
            <p className="mb-2 text-xs font-semibold text-garawol-muted">
              {r.tenant!.full_name} · {r.unit.code}
            </p>
            <pre className="whitespace-pre-wrap font-sans text-sm text-garawol-ink">{texts[i]}</pre>
          </SoftListItem>
        ))}
        {overdue.length === 0 && (
          <li className="p-8 text-center text-sm text-garawol-muted">
            {q ? `No overdue tenants match “${q}”.` : "No overdue tenants."}
          </li>
        )}
      </SoftList>
    </PageShell>
    </div>
    <PrintSheet title={`Rent demands · ${data.property.name}`} subtitle={`${overdue.length} overdue tenants`}>
      <PrintSummary items={[{ label: "Reminders", value: String(overdue.length) }]} />
      {overdue.length === 0 ? (
        <p>No overdue tenants.</p>
      ) : (
        overdue.map((r, i) => (
          <div className="print-block" key={r.unit.id}>
            <h3>
              {r.tenant!.full_name} · {r.unit.code}
              {r.tenancy
                ? ` · ${formatGmd(r.tenancy.balance_gmd || r.tenancy.amount_gmd)}`
                : ""}
            </h3>
            <p>{texts[i]}</p>
          </div>
        ))
      )}
    </PrintSheet>
    </>
  );
}
