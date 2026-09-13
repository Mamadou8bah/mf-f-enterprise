import Link from "next/link";
import { requireSession } from "@/lib/session";
import { getCollectionsByProperty } from "@/lib/queries";
import {
  collectionBounds,
  collectionRangeLabel,
  parseCollectionRange,
} from "@/lib/collection-range";
import { formatGmd, formatGmdCompact } from "@garawol/shared";
import { PrintButton } from "@/components/PrintButton";
import { PrintSheet, PrintSummary, PrintTable } from "@/components/PrintSheet";
import {
  PageHeader,
  PageShell,
  SoftList,
  SoftListItem,
  PillLink,
  StatTile,
} from "@/components/ui";
import { CollectionsFilter } from "@/components/CollectionsFilter";
import { PropertyIcon } from "@/components/PropertyIcon";
import { matchesQuery } from "@/lib/search";
import { ArrowUpRightIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; range?: string; from?: string; to?: string }>;
}) {
  await requireSession();
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const range = parseCollectionRange(sp.range);
  const { start, end } = collectionBounds(range, sp.from, sp.to);
  const data = await getCollectionsByProperty(start, end);
  const term = q.toLowerCase();
  const rows = data.rows.filter((row) =>
    matchesQuery(term, row.name, row.area, row.type, row.landlordName)
  );
  const listedTotal = rows.reduce((s, r) => s + r.collected, 0);
  const listedPayments = rows.reduce((s, r) => s + r.payments, 0);
  const periodLabel = collectionRangeLabel(range, start, end);

  return (
    <>
      <div className="no-print">
        <PageShell>
          <PageHeader
            eyebrow="Collections"
            title="Collected by property"
            description={periodLabel}
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
            <StatTile label="Collected" value={formatGmdCompact(listedTotal)} accent />
            <StatTile label="Receipts" value={String(listedPayments)} />
            <StatTile
              label="Properties paid"
              value={`${rows.filter((r) => r.collected > 0).length}/${rows.length}`}
            />
          </div>
          <CollectionsFilter range={range} q={q} from={start} to={end} />
          <SoftList>
            {rows.map((row) => (
              <SoftListItem key={row.propertyId}>
                <Link
                  href={`/properties/${row.propertyId}/round`}
                  prefetch={false}
                  className="flex items-center gap-3"
                >
                  <PropertyIcon type={row.type} name={row.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-garawol-ink">{row.name}</p>
                        <p className="truncate text-xs text-garawol-muted">
                          {[row.area, row.landlordName].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold tabular-nums text-garawol-ink">
                          {formatGmd(row.collected)}
                        </p>
                        <p className="text-xs text-garawol-muted">
                          {row.payments} {row.payments === 1 ? "receipt" : "receipts"}
                          {row.collected > 0 ? ` · ${row.share}%` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-garawol-mist">
                      <div
                        className="h-full rounded-full bg-garawol-green"
                        style={{ width: `${row.collected > 0 ? Math.max(row.share, 2) : 0}%` }}
                      />
                    </div>
                  </div>
                  <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-garawol-muted" />
                </Link>
              </SoftListItem>
            ))}
            {rows.length === 0 && (
              <li className="p-8 text-center text-sm text-garawol-muted">
                {q ? `No properties match “${q}”.` : "No properties on file."}
              </li>
            )}
          </SoftList>
        </PageShell>
      </div>
      <PrintSheet title="Collected by property" subtitle={periodLabel}>
        <PrintSummary
          items={[
            { label: "Collected", value: formatGmd(listedTotal) },
            { label: "Receipts", value: String(listedPayments) },
            {
              label: "Properties paid",
              value: `${rows.filter((r) => r.collected > 0).length}/${rows.length}`,
            },
          ]}
        />
        <PrintTable
          columns={["Property", "Area", "Receipts", "Collected", "Share"]}
          rows={rows.map((row) => [
            row.name,
            row.area || "—",
            String(row.payments),
            formatGmd(row.collected),
            row.collected > 0 ? `${row.share}%` : "—",
          ])}
          empty="No collections in this period."
        />
      </PrintSheet>
    </>
  );
}
