import { requireAdmin } from "@/lib/session";
import { allStaff } from "@/lib/data";
import { roleLabel } from "@/lib/roles";
import { CreateStaffForm } from "@/components/admin/CreateStaffForm";
import { EditStaffForm } from "@/components/admin/EditStaffForm";
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

export default async function StaffAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const term = q.toLowerCase();
  const all = await allStaff();
  const list = all.filter((s) =>
    matchesQuery(term, s.full_name, s.email, s.phone, s.role)
  );

  return (
    <PageShell>
      <BackLink href="/admin">Owner settings</BackLink>
      <PageHeader
        eyebrow="Accounts"
        title="Office users"
        description="Owner and Secretary sign-ins"
        actions={<CreateStaffForm />}
      />
      <PageSearch initialQ={q} placeholder="Search this list by name, email, or role…" />
      <SoftList>
        {list.map((s) => (
          <SoftListItem key={s.id}>
            <p className="font-semibold text-garawol-ink">{s.full_name}</p>
            <p className="text-xs text-garawol-muted">
              {s.email} · {roleLabel(s.role)} · {s.is_active ? "active" : "inactive"}
            </p>
            <EditStaffForm
              staff={{
                id: s.id,
                fullName: s.full_name,
                email: s.email,
                role: s.role,
                isActive: !!s.is_active,
              }}
            />
          </SoftListItem>
        ))}
        {list.length === 0 && (
          <li className="p-8 text-center text-sm text-garawol-muted">
            {q ? `No users match “${q}”.` : "No office users yet."}
          </li>
        )}
      </SoftList>
    </PageShell>
  );
}
