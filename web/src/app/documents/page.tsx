import { requireSession } from "@/lib/session";
import { allProperties, allLandlords } from "@/lib/data";
import { PageHeader, PageShell, NavCard, StatTile } from "@/components/ui";
import { PageSearch } from "@/components/PageSearch";
import { matchesQuery } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string; q?: string }>;
}) {
  await requireSession();
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const term = q.toLowerCase();
  const props = await allProperties();
  const landlordsList = await allLandlords();
  const propertyQs = sp.propertyId ? `?propertyId=${sp.propertyId}` : "";

  const items = [
    {
      href: `/documents/round-sheet${propertyQs}`,
      title: "Round sheet",
      desc: "Print overdue + due-soon with phones",
    },
    {
      href: "/documents/collections",
      title: "Collected by property",
      desc: "Totals by building, with date filters",
    },
    { href: "/tenants", title: "Tenants directory", desc: "Register, edit, assign, move out" },
    { href: "/documents/vacancy", title: "Vacancy list", desc: "Empty units + asking rent" },
    { href: "/documents/arrears", title: "Due & overdue", desc: "Late rent + payments due in 7 days" },
    { href: "/documents/directory", title: "Unit directory", desc: "Live replacement for Word sheets" },
    { href: "/api/export/csv?type=payments", title: "CSV · Payments", desc: "Download payments export" },
    { href: "/api/export/csv?type=tenancies", title: "CSV · Tenancies", desc: "Download tenancies export" },
    { href: "/api/export/csv?type=arrears", title: "CSV · Arrears", desc: "Download arrears export" },
  ];

  const shown = term
    ? items.filter((item) => matchesQuery(term, item.title, item.desc))
    : items;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Reports & print"
        title="Documents"
        description="Collections, directories, and exports"
      />
      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Properties" value={String(props.length)} />
        <StatTile label="Landlords" value={String(landlordsList.length)} />
        <StatTile label="Reports" value={String(items.length)} />
      </div>
      <PageSearch initialQ={q} placeholder="Search these reports by name…" />
      <div className="grid gap-2 sm:grid-cols-2">
        {shown.map((item) => (
          <NavCard key={item.href} href={item.href} title={item.title} description={item.desc} />
        ))}
        {shown.length === 0 && (
          <p className="col-span-full p-8 text-center text-sm text-garawol-muted">
            No reports match “{q}”.
          </p>
        )}
      </div>
    </PageShell>
  );
}
