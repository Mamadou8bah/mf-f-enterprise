import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { allProperties, allLandlords } from "@/lib/data";
import { CreatePropertyForm } from "@/components/admin/CreatePropertyForm";
import { ToggleFavoriteButton } from "@/components/admin/ToggleFavoriteButton";
import {
  PageHeader,
  PageShell,
  SoftList,
  SoftListItem,
  BackLink,
} from "@/components/ui";
import { PropertyIcon } from "@/components/PropertyIcon";
import { PageSearch } from "@/components/PageSearch";
import { matchesQuery } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function PropertiesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const term = q.toLowerCase();
  const all = await allProperties();
  const landlords = await allLandlords();
  const landlordMap = Object.fromEntries(landlords.map((l) => [l.id, l]));
  const props = all.filter((p) =>
    matchesQuery(term, p.name, p.area, p.type, landlordMap[p.landlord_id]?.full_name)
  );

  return (
    <PageShell>
      <BackLink href="/admin">Admin</BackLink>
      <PageHeader
        eyebrow="Admin"
        title="Properties"
        description={`${all.length} buildings`}
        actions={
          <CreatePropertyForm
            landlords={landlords.map((l) => ({ id: l.id, name: l.full_name }))}
            defaultOpen={all.length === 0}
            canClose={all.length > 0}
          />
        }
      />
      <PageSearch initialQ={q} placeholder="Search this list by building, landlord, or area…" />
      <SoftList>
        {props.map((p) => (
          <SoftListItem key={p.id}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <PropertyIcon type={p.type} name={p.name} favorite={!!p.is_favorite} />
                <div className="min-w-0">
                  <p className="font-semibold text-garawol-ink">{p.name}</p>
                  <p className="text-xs text-garawol-muted">
                    {landlordMap[p.landlord_id]?.full_name} · {p.area} · {p.type}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <ToggleFavoriteButton propertyId={p.id} isFavorite={!!p.is_favorite} />
                <Link
                  href={`/properties/${p.id}/round`}
                  className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-garawol-ink shadow-sm"
                >
                  Open
                </Link>
              </div>
            </div>
          </SoftListItem>
        ))}
        {props.length === 0 && (
          <li className="p-8 text-center text-sm text-garawol-muted">
            {q ? `No properties match “${q}”.` : "No properties yet."}
          </li>
        )}
      </SoftList>
    </PageShell>
  );
}
