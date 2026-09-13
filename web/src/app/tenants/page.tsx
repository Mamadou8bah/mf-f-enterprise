import Link from "next/link";
import { requireSession } from "@/lib/session";
import {
  allTenants,
  allTenancies,
  allUnits,
  allProperties,
  tenancyUnitLinks,
  findUnit,
  findProperty,
} from "@/lib/data";
import { formatGmd } from "@garawol/shared";
import { tenantIdLabel, matchesTenantIdQuery } from "@/lib/tenant-id";
import { RegisterTenantForm } from "@/components/RegisterTenantForm";
import {
  PageHeader,
  PageShell,
  SoftList,
  SoftListItem,
  PillLink,
  StatTile,
  Pagination,
} from "@/components/ui";
import { ArrowUpRightIcon } from "@/components/icons";
import { TenantsFilter } from "@/components/TenantsFilter";
import { paginate, parsePage } from "@/lib/pagination";

export const dynamic = "force-dynamic";

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; page?: string; register?: string }>;
}) {
  await requireSession();
  const sp = await searchParams;
  const q = (sp.q || "").trim().toLowerCase();
  const filter = sp.filter || "all";

  const tenancies = await allTenancies();
  const activeByTenant = new Map<
    string,
    { unitCode: string; propertyName: string; amount: number; nextDue: string | null; status: string }[]
  >();

  for (const t of tenancies) {
    if (t.status !== "active") continue;
    const links = await tenancyUnitLinks(t.id);
    const units = [];
    for (const l of links) {
      const unit = await findUnit(l.unit_id);
      const prop = unit ? await findProperty(unit.property_id) : null;
      units.push({
        unitCode: unit?.code || "?",
        propertyName: prop?.name || "?",
        amount: t.amount_gmd,
        nextDue: t.next_due,
        status: t.status,
      });
    }
    const existing = activeByTenant.get(t.tenant_id) || [];
    activeByTenant.set(t.tenant_id, [...existing, ...units]);
  }

  let tenants = (await allTenants()).sort((a, b) => a.full_name.localeCompare(b.full_name));
  if (q) {
    tenants = tenants.filter(
      (t) =>
        t.full_name.toLowerCase().includes(q) ||
        (t.phone || "").includes(q) ||
        (t.phone_secondary || "").includes(q) ||
        matchesTenantIdQuery(q, t.id_type, t.id_number)
    );
  }

  const withUnit = tenants.filter((t) => (activeByTenant.get(t.id)?.length || 0) > 0);
  const withoutUnit = tenants.filter((t) => !(activeByTenant.get(t.id)?.length));

  const shown =
    filter === "housed"
      ? withUnit
      : filter === "unassigned"
        ? withoutUnit
        : tenants;

  const paged = paginate(shown, parsePage(sp.page));

  const properties = await allProperties();
  const vacantUnits = (await allUnits())
    .filter((u) => u.status === "vacant")
    .map((u) => {
      const prop = properties.find((p) => p.id === u.property_id);
      return {
        id: u.id,
        label: `${u.code} · ${prop?.name || "Property"}${
          u.asking_rent_gmd != null ? ` · asking ${formatGmd(u.asking_rent_gmd)}` : ""
        }`,
        askingRent: u.asking_rent_gmd,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <PageShell>
      <PageHeader
        eyebrow="Directory"
        title="Tenants"
        description="Register people, assign units, and open a file to take payment"
        actions={
          <>
            <RegisterTenantForm redirectTo defaultOpen={sp.register === "1"} />
            <PillLink href="/documents/vacancy" variant="secondary">
              Vacant units
            </PillLink>
          </>
        }
      />

      <div className="hidden grid-cols-3 gap-2 lg:grid">
        <StatTile label="All" value={String(tenants.length)} />
        <StatTile label="In a unit" value={String(withUnit.length)} />
        <StatTile
          label="Unassigned"
          value={String(withoutUnit.length)}
          accent={withoutUnit.length > 0}
        />
      </div>

      <TenantsFilter initialQ={sp.q || ""} filter={filter} />

      <SoftList>
        {paged.items.map((t) => {
          const places = activeByTenant.get(t.id) || [];
          return (
            <SoftListItem key={t.id}>
              <Link href={`/tenants/${t.id}`} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-garawol-ink">{t.full_name}</p>
                  <p className="text-xs text-garawol-muted">
                    {[t.phone || "No phone", tenantIdLabel(t.id_type, t.id_number)]
                      .filter(Boolean)
                      .join(" · ")}
                    {places.length > 0
                      ? ` · ${places.map((p) => `${p.unitCode} @ ${p.propertyName}`).join(", ")}`
                      : " · Not in a unit"}
                  </p>
                  {places[0] && (
                    <p className="mt-0.5 text-xs text-garawol-muted">
                      {formatGmd(places[0].amount)}
                      {places[0].nextDue ? ` · due ${places[0].nextDue}` : ""}
                    </p>
                  )}
                </div>
                <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-garawol-soft" />
              </Link>
            </SoftListItem>
          );
        })}
        {paged.total === 0 && (
          <li className="p-8 text-center text-sm text-garawol-muted">No tenants match.</li>
        )}
      </SoftList>
      <Pagination
        pathname="/tenants"
        page={paged.page}
        pageCount={paged.pageCount}
        total={paged.total}
        from={paged.from}
        to={paged.to}
        params={{ q: sp.q, filter: filter === "all" ? undefined : filter }}
      />
    </PageShell>
  );
}
