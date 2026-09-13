import { requireSession } from "@/lib/session";
import { findStaffById } from "@/lib/data";
import { getOfficeSettings } from "@/lib/office-settings";
import { roleLabel } from "@/lib/roles";
import { PageHeader, PageShell, SoftCard, NavCard } from "@/components/ui";
import { AccountForm } from "@/components/settings/AccountForm";
import { OfficeForm } from "@/components/settings/OfficeForm";
import { InstallPwaButton } from "@/components/InstallPwaButton";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireSession();
  const staff = session.user.id ? await findStaffById(session.user.id) : undefined;
  const office = await getOfficeSettings();
  const isAdmin = session.user.role === "admin";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Office"
        title="Settings"
        description={
          isAdmin
            ? "Your sign-in, company details, and owner tools"
            : "Your name, phone, email, and password"
        }
      />

      <SoftCard>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-garawol-muted">
          Your account
        </h2>
        <AccountForm
          fullName={staff?.full_name || session.user.name || ""}
          phone={staff?.phone || ""}
          email={staff?.email || session.user.email || ""}
          roleLabel={roleLabel(session.user.role)}
        />
      </SoftCard>

      <SoftCard>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-garawol-muted">
          Install on this phone
        </h2>
        <p className="mb-4 text-sm text-garawol-muted">
          Add the desk as an app with the MF &amp; F logo on your home screen.
        </p>
        <InstallPwaButton />
      </SoftCard>

      {isAdmin && (
        <>
          <SoftCard>
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-garawol-muted">
              Company & receipts
            </h2>
            <p className="mb-4 text-sm text-garawol-muted">
              Shown on printed receipts, PDFs, and office reports.
            </p>
            <OfficeForm initial={office} />
          </SoftCard>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-garawol-muted">
              Owner tools
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <NavCard href="/admin/staff" title="Office users" description="Owner and Secretary accounts" />
              <NavCard href="/admin/landlords" title="Landlords" description="Property owners on file" />
              <NavCard href="/admin/properties" title="Properties" description="Buildings and areas" />
              <NavCard href="/admin/import" title="Import Word documents" description="Seed from docx files" />
              <NavCard href="/admin/flags" title="Import fix queue" description="Open flags from imports" />
              <NavCard href="/admin/pay-links" title="Payment link stubs" description="Future tenant pay links" />
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}
