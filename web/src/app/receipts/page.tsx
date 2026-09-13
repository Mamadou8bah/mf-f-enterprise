import Link from "next/link";
import { requireSession } from "@/lib/session";
import { listReceiptRows } from "@/lib/queries";
import { formatGmd, formatDate } from "@garawol/shared";
import { PageHeader, PageShell, SoftList, SoftListItem, PillLink, Pagination } from "@/components/ui";
import { ArrowUpRightIcon } from "@/components/icons";
import { PageSearch } from "@/components/PageSearch";
import { paginate, parsePage } from "@/lib/pagination";
import { matchesQuery } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  await requireSession();
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const term = q.toLowerCase();
  const rows = (await listReceiptRows()).filter((r) =>
    matchesQuery(
      term,
      r.receiptNo,
      r.status,
      r.paidAt,
      r.amount,
      r.tenantName,
      r.unitCodes,
      r.propertyName,
      r.recordedBy
    )
  );
  const paged = paginate(rows, parsePage(sp.page));

  return (
    <PageShell>
      <PageHeader
        eyebrow="Official documents"
        title="Receipts"
        description="Issued and void receipts"
        actions={
          <PillLink href="/search" variant="primary">
            + Record payment
          </PillLink>
        }
      />
      <PageSearch
        initialQ={q}
        placeholder="Search this list by receipt no, tenant, shop, or property…"
      />
      <SoftList>
        {paged.items.map((r) => (
          <SoftListItem key={r.id}>
            <Link href={`/receipts/${r.id}`} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-garawol-ink">{r.receiptNo}</p>
                <p className="text-xs text-garawol-muted">
                  {[
                    r.paidAt ? formatDate(r.paidAt) : null,
                    r.amount != null ? formatGmd(r.amount) : null,
                    r.tenantName,
                    r.unitCodes,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-0.5 text-xs text-garawol-muted">Recorded by {r.recordedBy}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`badge ${
                    r.status === "void"
                      ? "bg-red-100 text-red-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {r.status}
                </span>
                <ArrowUpRightIcon className="h-4 w-4 text-garawol-soft" />
              </div>
            </Link>
          </SoftListItem>
        ))}
        {paged.total === 0 && (
          <li className="p-8 text-center text-sm text-garawol-muted">
            {q ? `No receipts match “${q}”.` : "No receipts yet."}
          </li>
        )}
      </SoftList>
      <Pagination
        pathname="/receipts"
        page={paged.page}
        pageCount={paged.pageCount}
        total={paged.total}
        from={paged.from}
        to={paged.to}
        params={{ q: q || undefined }}
      />
    </PageShell>
  );
}
