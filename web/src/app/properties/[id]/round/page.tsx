import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getPropertyRound } from "@/lib/queries";
import {
  formatGmd,
  formatGmdCompact,
  periodLabel,
  telUrl,
  whatsappUrl,
  isPlausibleRentAmount,
} from "@garawol/shared";
import type { RentPeriod } from "@garawol/shared";
import { RoundCacheClient } from "@/components/RoundCacheClient";
import { CreateUnitForm } from "@/components/CreateUnitForm";
import { EditPropertyForm } from "@/components/EditPropertyForm";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { PropertyIcon } from "@/components/PropertyIcon";
import { PageSearch } from "@/components/PageSearch";
import { matchesQuery } from "@/lib/search";
import { matchesTenantIdQuery } from "@/lib/tenant-id";
import { BackLink } from "@/components/ui";
import { allLandlords } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function RoundPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const sp = await searchParams;
  const filter = sp.filter || "all";
  const q = (sp.q || "").trim();
  const term = q.toLowerCase();
  const data = await getPropertyRound(id);
  if (!data) notFound();
  const { property, landlord, rows } = data;
  const landlords = (await allLandlords()).map((l) => ({ id: l.id, name: l.full_name }));

  const overdue = rows.filter((r) => r.dueState === "overdue").length;
  const dueSoon = rows.filter((r) => r.dueState === "due_soon").length;
  const vacant = rows.filter((r) => r.unit.status === "vacant").length;
  const occupied = rows.filter((r) => r.unit.status === "occupied").length;

  const filtered =
    filter === "overdue"
      ? rows.filter((r) => r.dueState === "overdue")
      : filter === "due_soon"
        ? rows.filter((r) => r.dueState === "due_soon")
        : filter === "vacant"
          ? rows.filter((r) => r.unit.status === "vacant")
          : rows;
  const shown = term
    ? filtered.filter(
        (r) =>
          matchesQuery(
            term,
            r.unit.code,
            r.unit.type,
            r.tenant?.full_name,
            r.tenant?.phone,
            r.tenant?.phone_secondary
          ) || matchesTenantIdQuery(term, r.tenant?.id_type, r.tenant?.id_number)
      )
    : filtered;

  function roundHref(nextFilter = "all") {
    const params = new URLSearchParams();
    if (nextFilter !== "all") params.set("filter", nextFilter);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/properties/${id}/round?${qs}` : `/properties/${id}/round`;
  }

  return (
    <div className="space-y-5 lg:space-y-7">
      <RoundCacheClient propertyId={id} payload={JSON.parse(JSON.stringify(data))} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <BackLink href="/properties">All properties</BackLink>
          <div className="mt-1 flex items-center gap-3">
            <PropertyIcon
              type={property.type}
              name={property.name}
              favorite={!!property.is_favorite}
              size="lg"
            />
            <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-garawol-ink lg:text-3xl">
              {property.name}
            </h1>
          </div>
          <p className="mt-1 text-sm text-garawol-muted">
            {landlord?.full_name || "No landlord"}
            {property.area ? ` · ${property.area}` : ""}
            {property.type ? ` · ${property.type}` : ""}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <EditPropertyForm
            property={{
              id: property.id,
              name: property.name,
              landlordId: property.landlord_id,
              area: property.area,
              type: property.type,
              notes: property.notes,
            }}
            landlords={landlords}
          />
          <ConfirmDeleteButton
            title="Delete property?"
            description="Removes this building and empty units. Occupied units or payment history will block deletion."
            endpoint="/api/admin/properties"
            body={{ id: property.id }}
            redirectTo="/properties"
          />
          <CreateUnitForm propertyId={id} />
          <Link
            href="/tenants"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-garawol-ink shadow-sm sm:w-auto"
          >
            Tenants
          </Link>
          <Link
            href={`/documents/round-sheet?propertyId=${id}`}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-garawol-ink shadow-sm sm:w-auto"
          >
            Print sheet
          </Link>
          <Link
            href="/search"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#0B1220] px-4 py-2.5 text-sm font-semibold text-white sm:w-auto"
          >
            + Record payment
          </Link>
        </div>
      </div>

      <div className="hidden grid-cols-2 gap-3 lg:grid lg:grid-cols-4">
        <SummaryStat label="Units" value={String(rows.length)} />
        <SummaryStat label="Occupied" value={String(occupied)} />
        <SummaryStat label="Overdue" value={String(overdue)} accent={overdue > 0} />
        <SummaryStat label="Vacant" value={String(vacant)} />
      </div>

      <div className="chip-row">
        <FilterPill href={roundHref()} active={filter === "all"}>
          All ({rows.length})
        </FilterPill>
        <FilterPill href={roundHref("overdue")} active={filter === "overdue"}>
          Overdue ({overdue})
        </FilterPill>
        <FilterPill href={roundHref("due_soon")} active={filter === "due_soon"}>
          Due soon ({dueSoon})
        </FilterPill>
        <FilterPill href={roundHref("vacant")} active={filter === "vacant"}>
          Vacant ({vacant})
        </FilterPill>
      </div>

      <PageSearch
        initialQ={q}
        placeholder="Search this building by shop, tenant, phone, or ID…"
        keep={{ filter: filter === "all" ? undefined : filter }}
      />

      <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-card">
        {shown.length === 0 && (
          <p className="p-8 text-center text-sm text-garawol-muted">
            {q ? `No units match “${q}”.` : "No units in this filter."}
          </p>
        )}
        <ul className="divide-y divide-garawol-line">
          {shown.map((row) => {
            const amount = row.tenancy
              ? row.tenancy.balance_gmd || row.tenancy.amount_gmd
              : null;
            const showAmount = amount != null && isPlausibleRentAmount(amount);

            return (
              <li key={row.unit.id} className="p-4 hover:bg-garawol-mist lg:px-6 lg:py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                        row.dueState === "overdue"
                          ? "bg-red-500"
                          : row.dueState === "due_soon"
                            ? "bg-amber-400"
                            : row.unit.status === "vacant"
                              ? "bg-sky-400"
                              : "bg-emerald-400"
                      }`}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-garawol-ink">{row.unit.code}</p>
                        <span className="text-xs capitalize text-garawol-soft">{row.unit.type}</span>
                        {row.dueState === "overdue" && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                            Overdue {row.daysOverdue}d
                          </span>
                        )}
                        {row.dueState === "due_soon" && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                            Due soon
                          </span>
                        )}
                        {row.unit.status === "vacant" && (
                          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800">
                            Vacant
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-garawol-ink">
                        {row.tenant?.full_name || (
                          <span className="text-garawol-soft">Vacant — no tenant</span>
                        )}
                      </p>
                      {row.tenancy && (
                        <p className="mt-0.5 text-xs text-garawol-muted">
                          {showAmount ? formatGmd(amount!) : "Amount needs review"} ·{" "}
                          {periodLabel(row.tenancy.period as RentPeriod)}
                          {row.tenancy.next_due ? ` · due ${row.tenancy.next_due}` : ""}
                        </p>
                      )}
                    </div>
                    {row.photos[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.photos[0].url}
                        alt=""
                        className="ml-auto h-12 w-12 rounded-xl object-cover lg:hidden"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center lg:shrink-0">
                    {showAmount && row.dueState === "overdue" && (
                      <span className="col-span-2 mr-1 hidden text-sm font-bold tabular-nums text-garawol-goldInk lg:inline">
                        {formatGmdCompact(amount!)}
                      </span>
                    )}
                    {row.tenancy && row.dueState !== "skip" && (
                      <Link
                        href={`/pay/${row.tenancy.id}`}
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-garawol-green px-4 py-2 text-sm font-semibold text-white"
                      >
                        Pay
                      </Link>
                    )}
                    {row.unit.status === "vacant" && !row.tenancy && (
                      <Link
                        href={`/units/${row.unit.id}`}
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#0B1220] px-4 py-2 text-sm font-semibold text-white"
                      >
                        Place tenant
                      </Link>
                    )}
                    {row.tenant && (
                      <Link
                        href={`/tenants/${row.tenant.id}`}
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-garawol-mist px-3.5 py-2 text-sm font-semibold text-garawol-ink"
                      >
                        Tenant
                      </Link>
                    )}
                    {row.tenant?.phone && (
                      <>
                        <a
                          href={telUrl(row.tenant.phone)}
                          className="inline-flex min-h-11 items-center justify-center rounded-full bg-garawol-mist px-3.5 py-2 text-sm font-semibold text-garawol-ink"
                        >
                          Call
                        </a>
                        <a
                          href={whatsappUrl(row.tenant.phone)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-11 items-center justify-center rounded-full bg-garawol-mist px-3.5 py-2 text-sm font-semibold text-garawol-ink"
                        >
                          WhatsApp
                        </a>
                      </>
                    )}
                    <Link
                      href={`/units/${row.unit.id}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-full px-3.5 py-2 text-sm font-semibold text-garawol-muted hover:text-garawol-green"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

    </div>
  );
}

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[1.25rem] bg-white px-3 py-3 shadow-card sm:px-4 lg:px-5 lg:py-4">
      <p className="truncate text-xs font-semibold uppercase tracking-wide text-garawol-soft">{label}</p>
      <p
        className={`mt-1 truncate text-xl font-bold tabular-nums sm:text-2xl lg:text-xl ${
          accent ? "text-garawol-goldInk" : "text-garawol-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "inline-flex min-h-11 items-center rounded-full bg-[#0B1220] px-4 py-2 text-sm font-semibold text-white"
          : "inline-flex min-h-11 items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-garawol-ink shadow-sm"
      }
    >
      {children}
    </Link>
  );
}
