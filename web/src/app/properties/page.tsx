import Link from "next/link";
import { requireSession } from "@/lib/session";
import { allProperties, allLandlords, allUnits, allTenancies, tenancyUnitLinks } from "@/lib/data";
import { scopedPropertyFilter } from "@/lib/queries";
import { startOfDayBanjul } from "@garawol/shared";
import { ArrowUpRightIcon } from "@/components/icons";
import { PropertyIcon } from "@/components/PropertyIcon";
import { CreatePropertyForm } from "@/components/admin/CreatePropertyForm";
import { PageSearch } from "@/components/PageSearch";
import { matchesQuery } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; q?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const term = q.toLowerCase();
  const scope = scopedPropertyFilter(session.user.propertyScope);
  let props = await allProperties();
  if (scope) props = props.filter((p) => scope.includes(p.id));
  props.sort(
    (a, b) => Number(b.is_favorite) - Number(a.is_favorite) || a.name.localeCompare(b.name)
  );
  const landlords = await allLandlords();
  const landlordMap = Object.fromEntries(landlords.map((l) => [l.id, l]));
  const listedCount = props.length;
  if (term) {
    props = props.filter((p) =>
      matchesQuery(term, p.name, p.area, p.type, p.address, landlordMap[p.landlord_id]?.full_name)
    );
  }
  const units = await allUnits();
  const links = await tenancyUnitLinks();
  const tenancies = (await allTenancies()).filter((t) => t.status === "active");
  const tenancyById = Object.fromEntries(tenancies.map((t) => [t.id, t]));
  const today = startOfDayBanjul().toISOString().slice(0, 10);

  const statsByProp: Record<
    string,
    { units: number; vacant: number; overdue: number; occupied: number }
  > = {};
  for (const u of units) {
    if (!statsByProp[u.property_id]) {
      statsByProp[u.property_id] = { units: 0, vacant: 0, overdue: 0, occupied: 0 };
    }
    const s = statsByProp[u.property_id];
    s.units++;
    if (u.status === "vacant") s.vacant++;
    if (u.status === "occupied") s.occupied++;
    const link = links.find((l) => l.unit_id === u.id);
    const t = link ? tenancyById[link.tenancy_id] : null;
    if (t?.next_due && t.next_due < today && u.status !== "family_free") s.overdue++;
  }

  return (
    <div className="space-y-5 lg:space-y-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-garawol-muted">Buildings & units</p>
          <h1 className="mt-1 break-words text-2xl font-semibold tracking-tight text-garawol-ink lg:text-3xl">
            Properties
          </h1>
          <p className="mt-1 text-sm text-garawol-muted">
            {q
              ? `${props.length} match “${q}” of ${listedCount}`
              : `${listedCount} on file · open one to record payments by unit`}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <CreatePropertyForm
            landlords={landlords.map((l) => ({ id: l.id, name: l.full_name }))}
            defaultOpen={sp.new === "1" || listedCount === 0}
            canClose={listedCount > 0}
            redirectOnSave
          />
          <Link
            href="/search"
            className="hidden rounded-full bg-[#0B1220] px-5 py-3 text-sm font-semibold text-white lg:inline-flex"
          >
            + Record payment
          </Link>
        </div>
      </div>

      <PageSearch
        initialQ={q}
        placeholder="Search this list by building, landlord, or area…"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {props.map((p) => {
          const s = statsByProp[p.id] || { units: 0, vacant: 0, overdue: 0, occupied: 0 };
          return (
            <Link
              key={p.id}
              href={`/properties/${p.id}/round`}
              className="group flex min-h-[7.5rem] flex-col rounded-[1.5rem] bg-white p-5 shadow-card active:bg-garawol-mist lg:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <PropertyIcon type={p.type} name={p.name} favorite={!!p.is_favorite} size="lg" />
                  <div className="min-w-0">
                    <p className="text-lg font-semibold leading-snug text-garawol-ink">{p.name}</p>
                    <p className="mt-1 text-sm text-garawol-muted">
                      {landlordMap[p.landlord_id]?.full_name || "No landlord"}
                    </p>
                  </div>
                </div>
                <ArrowUpRightIcon className="mt-1 h-5 w-5 shrink-0 text-garawol-soft lg:hidden" />
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.area && (
                  <span className="rounded-full bg-garawol-mist px-2.5 py-1 text-sm font-semibold text-garawol-muted">
                    {p.area}
                  </span>
                )}
                {p.type && (
                  <span className="rounded-full bg-garawol-mist px-2.5 py-1 text-sm font-semibold capitalize text-garawol-muted">
                    {p.type}
                  </span>
                )}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-garawol-line pt-4">
                <div>
                  <p className="text-sm font-medium text-garawol-soft">Units</p>
                  <p className="text-xl font-bold tabular-nums text-garawol-ink">{s.units}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-garawol-soft">Occupied</p>
                  <p className="text-xl font-bold tabular-nums text-garawol-ink">{s.occupied}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-garawol-soft">Overdue</p>
                  <p
                    className={`text-lg font-bold tabular-nums ${
                      s.overdue > 0 ? "text-garawol-goldInk" : "text-garawol-ink"
                    }`}
                  >
                    {s.overdue}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {props.length === 0 && (
        <div className="rounded-[1.5rem] bg-white p-8 text-center shadow-card">
          <p className="text-base text-garawol-muted">
            {q ? `No properties match “${q}”.` : "No properties yet. Add one above."}
          </p>
        </div>
      )}
    </div>
  );
}
