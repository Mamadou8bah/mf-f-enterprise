import Link from "next/link";
import { requireSession } from "@/lib/session";
import { allUnits, allProperties, photosByUnit } from "@/lib/data";
import { formatGmd, vacancyBlurb } from "@garawol/shared";
import { CopyButton } from "@/components/CopyButton";
import {
  PageHeader,
  PageShell,
  SoftList,
  SoftListItem,
  PillLink,
  StatTile,
  BackLink,
  Pagination,
} from "@/components/ui";
import { paginate, parsePage } from "@/lib/pagination";
import { PageSearch } from "@/components/PageSearch";
import { matchesQuery } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function VacancyPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  await requireSession();
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const term = q.toLowerCase();
  const vacant = (await allUnits()).filter((u) => u.status === "vacant");
  const propMap = Object.fromEntries((await allProperties()).map((p) => [p.id, p]));
  const matched = term
    ? vacant.filter((u) =>
        matchesQuery(
          term,
          u.code,
          u.type,
          u.notes,
          propMap[u.property_id]?.name,
          propMap[u.property_id]?.area
        )
      )
    : vacant;
  const paged = paginate(matched, parsePage(sp.page));
  const rows = await Promise.all(
    paged.items.map(async (u) => {
      const photos = await photosByUnit(u.id);
      const prop = propMap[u.property_id];
      const blurb = vacancyBlurb({
        propertyName: prop?.name || "",
        unitCode: u.code,
        unitType: u.type,
        askingRent: u.asking_rent_gmd,
        photoUrl: photos[0]?.url,
      });
      return { u, photos, prop, blurb };
    })
  );

  return (
    <PageShell>
      <BackLink href="/documents">Documents</BackLink>
      <PageHeader
        eyebrow="Availability"
        title="Vacancies"
        description={`${vacant.length} empty units — assign a tenant or copy a listing blurb`}
        actions={
          <>
            <PillLink href="/tenants" variant="secondary">
              Register tenant
            </PillLink>
            <PillLink href="/documents" variant="secondary">
              Documents
            </PillLink>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Vacant" value={String(vacant.length)} accent={vacant.length > 0} />
        <StatTile label="Properties" value={String(Object.keys(propMap).length)} />
      </div>
      <PageSearch
        initialQ={q}
        placeholder="Search this list by shop, property, or unit type…"
      />
      <SoftList>
        {rows.map(({ u, photos, prop, blurb }) => (
          <SoftListItem key={u.id}>
            <div className="flex gap-3">
              {photos[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photos[0].url}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-garawol-ink">
                  {u.code} · {prop?.name}
                </p>
                <p className="text-xs text-garawol-muted">
                  {u.type}
                  {u.asking_rent_gmd != null ? ` · ${formatGmd(u.asking_rent_gmd)}` : ""}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                  <Link
                    href={`/units/${u.id}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#0B1220] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Assign / open
                  </Link>
                  <CopyButton text={blurb} label="Copy blurb" />
                </div>
              </div>
            </div>
          </SoftListItem>
        ))}
        {paged.total === 0 && (
          <li className="p-8 text-center text-sm text-garawol-muted">
            {q ? `No vacant units match “${q}”.` : "No vacant units."}
          </li>
        )}
      </SoftList>
      <Pagination
        pathname="/documents/vacancy"
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
