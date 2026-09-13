import { requireAdmin } from "@/lib/session";
import { prisma } from "@garawol/db";
import { PageHeader, PageShell, StatTile, NavCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const [landlords, properties, units, tenants, staff, flags, payLinks] = await Promise.all([
    prisma.landlord.count(),
    prisma.property.count(),
    prisma.unit.count(),
    prisma.tenant.count(),
    prisma.staff.count(),
    prisma.importFlag.count({ where: { resolved: false } }),
    prisma.paymentRequest.count(),
  ]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="MF & F"
        title="Admin"
        description="Import, landlords, staff, and fix queues"
      />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatTile label="Landlords" value={String(landlords)} />
        <StatTile label="Properties" value={String(properties)} />
        <StatTile label="Units" value={String(units)} />
        <StatTile label="Tenants" value={String(tenants)} />
        <StatTile label="Staff" value={String(staff)} />
        <StatTile label="Import flags" value={String(flags)} accent={flags > 0} />
        <StatTile label="Pay-link stubs" value={String(payLinks)} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <NavCard href="/admin/import" title="Import Word documents" description="Seed from docx files" />
        <NavCard href="/admin/landlords" title="Landlords" description="Owners on file" />
        <NavCard href="/admin/properties" title="Properties" description="Buildings & areas" />
        <NavCard href="/admin/staff" title="Staff" description="Office sign-in accounts" />
        <NavCard
          href="/admin/flags"
          title="Import fix queue"
          description={`${flags} open flags`}
        />
        <NavCard href="/admin/pay-links" title="Payment link stubs" description="Future pay links" />
      </div>
    </PageShell>
  );
}
