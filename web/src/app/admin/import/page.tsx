import { requireAdmin } from "@/lib/session";
import { ImportButton } from "@/components/ImportButton";
import { PageHeader, PageShell, SoftCard, BackLink } from "@/components/ui";

export default async function ImportAdminPage() {
  await requireAdmin();
  return (
    <PageShell>
      <BackLink href="/admin">Admin</BackLink>
      <PageHeader
        eyebrow="Admin"
        title="Import documents"
        description="Reads every .docx in packages/import/doccuments and creates landlords, properties, units, and tenancies"
      />
      <SoftCard>
        <ImportButton />
      </SoftCard>
    </PageShell>
  );
}
