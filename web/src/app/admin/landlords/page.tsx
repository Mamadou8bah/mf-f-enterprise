import { requireAdmin } from "@/lib/session";
import { allLandlords, allProperties } from "@/lib/data";
import { CreateLandlordForm } from "@/components/admin/CreateLandlordForm";
import { EditLandlordForm } from "@/components/admin/EditLandlordForm";
import {
  PageHeader,
  PageShell,
  SoftList,
  SoftListItem,
  BackLink,
} from "@/components/ui";
import { PageSearch } from "@/components/PageSearch";
import { matchesQuery } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function LandlordsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const term = q.toLowerCase();
  const all = await allLandlords();
  const props = await allProperties();
  const list = all.filter((l) =>
    matchesQuery(term, l.full_name, l.display_title, l.phone, l.phone_secondary, l.email)
  );

  return (
    <PageShell>
      <BackLink href="/admin">Admin</BackLink>
      <PageHeader
        eyebrow="Admin"
        title="Landlords"
        description={`${all.length} on file`}
        actions={<CreateLandlordForm />}
      />
      <PageSearch initialQ={q} placeholder="Search this list by name or phone…" />
      <SoftList>
        {list.map((l) => (
          <SoftListItem key={l.id}>
            <p className="font-semibold text-garawol-ink">
              {l.display_title ? `${l.display_title} ` : ""}
              {l.full_name}
              {!l.is_active ? " · inactive" : ""}
            </p>
            <p className="text-xs text-garawol-muted">
              {l.phone || "No phone"} · {props.filter((p) => p.landlord_id === l.id).length}{" "}
              properties
            </p>
            <EditLandlordForm
              landlord={{
                id: l.id,
                fullName: l.full_name,
                phone: l.phone,
                phoneSecondary: l.phone_secondary,
                email: l.email,
                displayTitle: l.display_title,
                notes: l.notes,
                isActive: !!l.is_active,
              }}
            />
          </SoftListItem>
        ))}
        {list.length === 0 && (
          <li className="p-8 text-center text-sm text-garawol-muted">
            {q ? `No landlords match “${q}”.` : "No landlords yet."}
          </li>
        )}
      </SoftList>
    </PageShell>
  );
}
