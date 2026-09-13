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

export default async function DirectoryPage({
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
          eyebrow="Live sheets"
          title="Unit directory"
          description="Pick a property to view or print"
          actions={<PillLink href="/documents" variant="secondary">Documents</PillLink>}
        />
        <PageSearch initialQ={q} placeholder="Search this list by building or area…" />
        <div className="grid gap-2 sm:grid-cols-2">
          {props.map((p) => (
            <NavCard
              key={p.id}
              href={`/documents/directory?propertyId=${p.id}`}
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
  const rows = term
    ? data.rows.filter(
        (r) =>
          matchesQuery(
            term,
            r.unit.code,
            r.unit.type,
            r.unit.status,
            r.tenant?.full_name,
            r.tenant?.phone,
            r.tenant?.phone_secondary
          ) || matchesTenantIdQuery(term, r.tenant?.id_type, r.tenant?.id_number)
      )
    : data.rows;

  return (
    <>
    <div className="no-print">
    <PageShell>
      <BackLink href="/documents/directory">All properties</BackLink>
      <PageHeader
        eyebrow="Directory"
        title={data.property.name}
        description={`Landlord: ${data.landlord?.full_name || "—"}`}
        actions={<PrintButton />}
      />
      <PageSearch
        initialQ={q}
        placeholder="Search this directory by shop, tenant, phone, or ID…"
        keep={{ propertyId }}
      />
      <SoftCard padded={false} className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-garawol-line text-xs uppercase text-garawol-muted">
              <th className="px-5 py-3">Unit</th>
              <th className="px-3 py-3">Tenant</th>
              <th className="px-3 py-3">Contact</th>
              <th className="px-3 py-3">Amount</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.unit.id} className="border-b border-garawol-line">
                <td className="px-5 py-3 font-semibold">{r.unit.code}</td>
                <td className="px-3 py-3">{r.tenant?.full_name || "EMPTY"}</td>
                <td className="px-3 py-3 text-garawol-muted">{r.tenant?.phone || "—"}</td>
                <td className="px-3 py-3 tabular-nums">
                  {r.tenancy
                    ? `${formatGmd(r.tenancy.amount_gmd)} / ${periodLabel(r.tenancy.period as RentPeriod)}`
                    : r.unit.asking_rent_gmd != null
                      ? formatGmd(r.unit.asking_rent_gmd)
                      : "—"}
                </td>
                <td className="px-5 py-3 capitalize text-garawol-muted">{r.unit.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SoftCard>
    </PageShell>
    </div>
    <PrintSheet
      title={`Unit directory · ${data.property.name}`}
      subtitle={`Landlord: ${data.landlord?.full_name || "—"}`}
    >
      <PrintSummary
        items={[
          { label: "Units", value: String(rows.length) },
          {
            label: "Occupied",
            value: String(rows.filter((r) => r.unit.status === "occupied").length),
          },
          {
            label: "Vacant",
            value: String(rows.filter((r) => r.unit.status === "vacant").length),
          },
        ]}
      />
      <PrintTable
        columns={["Unit", "Tenant", "Contact", "Amount", "Status"]}
        rows={rows.map((r) => [
          r.unit.code,
          r.tenant?.full_name || "EMPTY",
          r.tenant?.phone || "—",
          r.tenancy
            ? `${formatGmd(r.tenancy.amount_gmd)} / ${periodLabel(r.tenancy.period as RentPeriod)}`
            : r.unit.asking_rent_gmd != null
              ? formatGmd(r.unit.asking_rent_gmd)
              : "—",
          r.unit.status,
        ])}
      />
    </PrintSheet>
    </>
  );
}
