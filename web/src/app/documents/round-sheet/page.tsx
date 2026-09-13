import { requireSession } from "@/lib/session";
import { allProperties } from "@/lib/data";
import { getPropertyRound } from "@/lib/queries";
import { formatGmd, periodLabel } from "@garawol/shared";
import type { RentPeriod } from "@garawol/shared";
import { PrintButton } from "@/components/PrintButton";
import { PrintSheet, PrintSummary, PrintTable } from "@/components/PrintSheet";
import {
  PageHeader,
  PageShell,
  SoftCard,
  PillLink,
  NavCard,
  BackLink,
} from "@/components/ui";
import { PropertyIcon } from "@/components/PropertyIcon";
import { PageSearch } from "@/components/PageSearch";
import { matchesQuery } from "@/lib/search";
import { matchesTenantIdQuery } from "@/lib/tenant-id";

export const dynamic = "force-dynamic";

export default async function RoundSheetPage({
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
          eyebrow="Print"
          title="Round sheet"
          description="Pick a property for overdue and due-soon units"
          actions={<PillLink href="/documents" variant="secondary">Documents</PillLink>}
        />
        <PageSearch initialQ={q} placeholder="Search this list by building or area…" />
        <div className="grid gap-2 sm:grid-cols-2">
          {props.map((p) => (
            <NavCard
              key={p.id}
              href={`/documents/round-sheet?propertyId=${p.id}`}
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
  const dueRows = data.rows.filter((r) => r.dueState === "overdue" || r.dueState === "due_soon");
  const rows = term
    ? dueRows.filter(
        (r) =>
          matchesQuery(
            term,
            r.unit.code,
            r.tenant?.full_name,
            r.tenant?.phone,
            r.tenant?.phone_secondary
          ) || matchesTenantIdQuery(term, r.tenant?.id_type, r.tenant?.id_number)
      )
    : dueRows;
  const printedOn = new Date().toLocaleDateString("en-GB");

  return (
    <>
    <div className="no-print">
    <PageShell>
      <BackLink href="/documents/round-sheet">All properties</BackLink>
      <PageHeader
        eyebrow="Round sheet"
        title={data.property.name}
        description={printedOn}
        actions={<PrintButton />}
      />
      <PageSearch
        initialQ={q}
        placeholder="Search this sheet by shop, tenant, phone, or ID…"
        keep={{ propertyId }}
      />
      <SoftCard padded={false} className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-garawol-line text-xs uppercase text-garawol-muted">
              <th className="px-5 py-3">Unit</th>
              <th className="px-3 py-3">Tenant</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Owed</th>
              <th className="px-5 py-3">Due</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.unit.id} className="border-b border-garawol-line">
                <td className="px-5 py-3 font-semibold">{r.unit.code}</td>
                <td className="px-3 py-3">{r.tenant?.full_name || "—"}</td>
                <td className="px-3 py-3 text-garawol-muted">{r.tenant?.phone || "—"}</td>
                <td className="px-3 py-3 tabular-nums">
                  {r.tenancy
                    ? `${formatGmd(r.tenancy.balance_gmd || r.tenancy.amount_gmd)} (${periodLabel(r.tenancy.period as RentPeriod)})`
                    : "—"}
                </td>
                <td className="px-5 py-3">{r.tenancy?.next_due || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-8 text-center text-sm text-garawol-muted">
            {q ? `No units match “${q}”.` : "Nothing due on this round."}
          </p>
        )}
      </SoftCard>
    </PageShell>
    </div>
    <PrintSheet title={`Collection round · ${data.property.name}`} subtitle={printedOn}>
      <PrintSummary
        items={[
          { label: "To visit", value: String(rows.length) },
          {
            label: "Overdue",
            value: String(rows.filter((r) => r.dueState === "overdue").length),
          },
          {
            label: "Due soon",
            value: String(rows.filter((r) => r.dueState === "due_soon").length),
          },
        ]}
      />
      <PrintTable
        columns={["Unit", "Tenant", "Phone", "Owed", "Due", "Status"]}
        rows={rows.map((r) => [
          r.unit.code,
          r.tenant?.full_name || "—",
          r.tenant?.phone || "—",
          r.tenancy
            ? `${formatGmd(r.tenancy.balance_gmd || r.tenancy.amount_gmd)} (${periodLabel(r.tenancy.period as RentPeriod)})`
            : "—",
          r.tenancy?.next_due || "—",
          r.dueState === "overdue" ? "Overdue" : "Due soon",
        ])}
        empty="Nothing due on this round."
      />
    </PrintSheet>
    </>
  );
}
