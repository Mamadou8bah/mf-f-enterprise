import Link from "next/link";
import { requireSession } from "@/lib/session";
import { getDueCollections, type DueCollectionRow } from "@/lib/queries";
import {
  formatGmd,
  formatGmdCompact,
  formatDate,
  isPlausibleRentAmount,
  telUrl,
  whatsappUrl,
} from "@garawol/shared";
import { PrintButton } from "@/components/PrintButton";
import { PrintSheet, PrintSummary, PrintTable } from "@/components/PrintSheet";
import {
  PageHeader,
  PageShell,
  SoftList,
  SoftListItem,
  PillLink,
  PillTab,
  StatTile,
  Pagination,
} from "@/components/ui";
import { paginate, parsePage } from "@/lib/pagination";
import { PageSearch } from "@/components/PageSearch";
import { matchesTenantIdQuery } from "@/lib/tenant-id";

export const dynamic = "force-dynamic";

type Filter = "overdue" | "due_soon" | "all";

export default async function ArrearsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string; q?: string }>;
}) {
  await requireSession();
  const sp = await searchParams;
  const filter: Filter =
    sp.filter === "due_soon" || sp.filter === "all" ? sp.filter : "overdue";
  const q = (sp.q || "").trim();
  const data = await getDueCollections();

  const rows: DueCollectionRow[] =
    filter === "overdue"
      ? data.overdue
      : filter === "due_soon"
        ? data.dueSoon
        : [...data.overdue, ...data.dueSoon];

  const term = q.toLowerCase();
  const matched = term
    ? rows.filter(
        (r) =>
          r.tenantName.toLowerCase().includes(term) ||
          (r.phone || "").toLowerCase().includes(term) ||
          matchesTenantIdQuery(term, r.idType, r.idNumber) ||
          r.unitCodes.toLowerCase().includes(term) ||
          r.propertyName.toLowerCase().includes(term)
      )
    : rows;

  const paged = paginate(matched, parsePage(sp.page));
  const filterQs = (f: Filter) => {
    const params = new URLSearchParams();
    if (f !== "overdue") params.set("filter", f);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/documents/arrears?${qs}` : "/documents/arrears";
  };
  const printTitle =
    filter === "due_soon"
      ? "Due in 7 days"
      : filter === "all"
        ? "Due & overdue rent"
        : "Overdue rent";
  const printTotal = matched.reduce(
    (s, r) => s + (isPlausibleRentAmount(r.amount) ? r.amount : 0),
    0
  );

  return (
    <>
    <div className="no-print">
    <PageShell>
      <PageHeader
        eyebrow="Collections"
        title="Due & overdue"
        description="Who must pay soon, and who is already late"
        actions={<PrintButton label="Print list" />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href={filterQs("overdue")} className="block">
          <StatTile
            label="Overdue"
            value={String(data.overdue.length)}
            meta={formatGmdCompact(data.overdueTotal)}
            accent={data.overdue.length > 0}
          />
        </Link>
        <Link href={filterQs("due_soon")} className="block">
          <StatTile
            label="Due in 7 days"
            value={String(data.dueSoon.length)}
            meta={formatGmdCompact(data.dueSoonTotal)}
          />
        </Link>
        <StatTile
          label="Need follow-up"
          value={String(data.overdue.length + data.dueSoon.length)}
        />
        <StatTile
          label="Oldest overdue"
          value={data.overdue[0] ? `${data.overdue[0].days}d` : "—"}
        />
      </div>

      <PageSearch
        initialQ={q}
        placeholder="Search this list by tenant, phone, ID, shop, or property…"
        keep={{ filter: filter === "overdue" ? undefined : filter }}
      />

      <div className="flex flex-wrap gap-2">
        <PillTab href={filterQs("overdue")} active={filter === "overdue"}>
          Overdue ({data.overdue.length})
        </PillTab>
        <PillTab href={filterQs("due_soon")} active={filter === "due_soon"}>
          Due in 7 days ({data.dueSoon.length})
        </PillTab>
        <PillTab href={filterQs("all")} active={filter === "all"}>
          All ({data.overdue.length + data.dueSoon.length})
        </PillTab>
      </div>

      <SoftList>
        {paged.items.map((r) => (
          <SoftListItem key={r.tenancyId}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-garawol-ink">
                    {r.tenantName}
                    {r.unitCodes ? ` · ${r.unitCodes}` : ""}
                  </p>
                  {r.status === "overdue" ? (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                      {r.days}d overdue
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      Due in {r.days} day{r.days === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-garawol-muted">{r.propertyName}</p>
                <p className="mt-1 text-sm text-garawol-muted">
                  {isPlausibleRentAmount(r.amount) ? formatGmd(r.amount) : "Amount review"} · due{" "}
                  {formatDate(r.nextDue)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/pay/${r.tenancyId}`}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#0B1220] px-4 py-2 text-sm font-semibold text-white sm:w-auto"
                >
                  Record payment
                </Link>
                <PillLink href={`/tenants/${r.tenantId}`} variant="secondary">
                  Tenant
                </PillLink>
                {r.phone && (
                  <>
                    <a
                      href={telUrl(r.phone)}
                      className="inline-flex rounded-full bg-garawol-mist px-3.5 py-2 text-sm font-semibold text-garawol-ink"
                    >
                      Call
                    </a>
                    <a
                      href={whatsappUrl(r.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-full bg-garawol-mist px-3.5 py-2 text-sm font-semibold text-garawol-ink"
                    >
                      WhatsApp
                    </a>
                  </>
                )}
              </div>
            </div>
          </SoftListItem>
        ))}
        {paged.total === 0 && (
          <li className="p-8 text-center text-sm text-garawol-muted">
            {q
              ? `No matches for “${q}”.`
              : filter === "due_soon"
                ? "Nothing due in the next 7 days."
                : filter === "overdue"
                  ? "No overdue rent right now."
                  : "No due or overdue payments right now."}
          </li>
        )}
      </SoftList>

      <Pagination
        pathname="/documents/arrears"
        page={paged.page}
        pageCount={paged.pageCount}
        total={paged.total}
        from={paged.from}
        to={paged.to}
        params={{
          filter: filter === "overdue" ? undefined : filter,
          q: q || undefined,
        }}
      />
    </PageShell>
    </div>
    <PrintSheet title={printTitle} subtitle={`${matched.length} tenancies${q ? ` · “${q}”` : ""}`}>
      <PrintSummary
        items={[
          { label: "Records", value: String(matched.length) },
          { label: "Amount", value: formatGmd(printTotal) },
          {
            label: "Oldest",
            value:
              filter === "due_soon"
                ? matched[0]
                  ? `${matched[0].days}d`
                  : "—"
                : data.overdue[0]
                  ? `${data.overdue[0].days}d overdue`
                  : "—",
          },
        ]}
      />
      <PrintTable
        columns={["Tenant", "Unit", "Property", "Phone", "Amount", "Due", "Status"]}
        rows={matched.map((r) => [
          r.tenantName,
          r.unitCodes || "—",
          r.propertyName,
          r.phone || "—",
          isPlausibleRentAmount(r.amount) ? formatGmd(r.amount) : "Review",
          formatDate(r.nextDue),
          r.status === "overdue" ? `${r.days}d overdue` : `Due in ${r.days}d`,
        ])}
        empty="No due or overdue payments."
      />
    </PrintSheet>
    </>
  );
}
