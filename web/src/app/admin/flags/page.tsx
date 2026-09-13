import { requireAdmin } from "@/lib/session";
import { prisma } from "@garawol/db";
import { ResolveFlagButton } from "@/components/admin/ResolveFlagButton";
import {
  PageHeader,
  PageShell,
  SoftList,
  SoftListItem,
  BackLink,
  StatTile,
  Pagination,
} from "@/components/ui";
import { parsePage, paginate } from "@/lib/pagination";
import { PageSearch } from "@/components/PageSearch";
import { matchesQuery } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function FlagsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const term = q.toLowerCase();
  const raw = await prisma.importFlag.findMany({
    where: { resolved: false },
    orderBy: { createdAt: "desc" },
  });
  const flags = raw
    .map((f) => ({
      id: f.id,
      source_file: f.sourceFile,
      raw_text: f.rawText,
      reason: f.reason,
    }))
    .filter((f) => matchesQuery(term, f.reason, f.source_file, f.raw_text));
  const paged = paginate(flags, parsePage(sp.page));

  return (
    <PageShell>
      <BackLink href="/admin">Admin</BackLink>
      <PageHeader
        eyebrow="Admin"
        title="Import fix queue"
        description="Review rows the Word import could not parse cleanly"
      />
      <StatTile label="Open flags" value={String(paged.total)} accent={paged.total > 0} />
      <PageSearch initialQ={q} placeholder="Search this list by reason, file, or text…" />
      <SoftList>
        {paged.items.map((f) => (
          <SoftListItem key={f.id}>
            <p className="font-semibold text-garawol-ink">{f.reason}</p>
            <p className="text-xs text-garawol-muted">{f.source_file}</p>
            {f.raw_text && (
              <p className="mt-1 line-clamp-2 text-sm text-garawol-muted">{f.raw_text}</p>
            )}
            <div className="mt-2">
              <ResolveFlagButton id={f.id} />
            </div>
          </SoftListItem>
        ))}
      </SoftList>
      <Pagination
        pathname="/admin/flags"
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
