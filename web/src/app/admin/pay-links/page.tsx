import { requireAdmin } from "@/lib/session";
import { prisma } from "@garawol/db";
import { allTenancies, findTenant } from "@/lib/data";
import { formatGmd } from "@garawol/shared";
import { CreatePayLinkStubForm } from "@/components/admin/CreatePayLinkStubForm";
import {
  PageHeader,
  PageShell,
  SoftList,
  SoftListItem,
  BackLink,
  Pagination,
} from "@/components/ui";
import { paginate, parsePage } from "@/lib/pagination";
import { PageSearch } from "@/components/PageSearch";
import { matchesQuery } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function PayLinksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const term = q.toLowerCase();
  const raw = await prisma.paymentRequest.findMany({ orderBy: { createdAt: "desc" } });
  const list = raw.map((p) => ({
    id: p.id,
    tenancy_id: p.tenancyId,
    amount_gmd: p.amountGmd,
    status: p.status,
    link_url: p.linkUrl,
  }));
  const tenancies = await allTenancies();
  const activeTenancies = (
    await Promise.all(
      tenancies
        .filter((t) => t.status === "active")
        .slice(0, 100)
        .map(async (t) => {
          const tenant = await findTenant(t.tenant_id);
          return {
            id: t.id,
            label: `${tenant?.full_name || "Tenant"} · ${formatGmd(t.amount_gmd)}`,
          };
        })
    )
  );

  const tenancyMap = Object.fromEntries(tenancies.map((t) => [t.id, t]));
  const matched = [];
  for (const p of list) {
    const tenancy = tenancyMap[p.tenancy_id];
    const tenant = tenancy ? await findTenant(tenancy.tenant_id) : undefined;
    if (matchesQuery(term, p.status, p.amount_gmd, p.link_url, p.tenancy_id, tenant?.full_name)) {
      matched.push({ ...p, tenantName: tenant?.full_name || "—" });
    }
  }
  const paged = paginate(matched, parsePage(sp.page));

  return (
    <PageShell>
      <BackLink href="/admin">Admin</BackLink>
      <PageHeader
        eyebrow="Admin"
        title="Payment link stubs"
        description="Placeholder for future tenant pay links — records stay in draft"
        actions={<CreatePayLinkStubForm tenancies={activeTenancies} />}
      />
      <PageSearch initialQ={q} placeholder="Search stubs…" />
      <SoftList>
        {paged.items.map((p) => (
          <SoftListItem key={p.id}>
            <p className="font-semibold text-garawol-ink">{p.tenantName}</p>
            <p className="text-sm text-garawol-muted">
              {formatGmd(p.amount_gmd)} · {p.status}
              {p.link_url ? ` · ${p.link_url}` : ""}
            </p>
          </SoftListItem>
        ))}
      </SoftList>
      <Pagination
        pathname="/admin/pay-links"
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
