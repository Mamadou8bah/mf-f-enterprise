import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import {
  findTenant,
  tenanciesByTenant,
  tenancyUnitLinks,
  findUnit,
  findProperty,
  allUnits,
  allProperties,
  paymentsByTenancy,
  findReceiptByPayment,
  findStaffById,
} from "@/lib/data";
import { formatGmd, telUrl, whatsappUrl, periodLabel } from "@garawol/shared";
import type { RentPeriod } from "@garawol/shared";
import { tenantIdLabel } from "@/lib/tenant-id";
import { recorderLabel } from "@/lib/roles";
import {
  PageHeader,
  PageShell,
  SoftList,
  SoftListItem,
  SoftCard,
  PillLink,
  BackLink,
} from "@/components/ui";
import { EditTenantForm } from "@/components/EditTenantForm";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { AssignUnitForm } from "@/components/AssignUnitForm";
import { EndTenancyButton } from "@/components/EndTenancyButton";

export const dynamic = "force-dynamic";

export default async function TenantPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const tenant = await findTenant(id);
  if (!tenant) notFound();
  const tens = (await tenanciesByTenant(id)).sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (b.status === "active" && a.status !== "active") return 1;
    return (b.start_date || "").localeCompare(a.start_date || "");
  });
  const active = tens.filter((t) => t.status === "active");
  const propMap = Object.fromEntries((await allProperties()).map((p) => [p.id, p]));
  const vacantUnits = (await allUnits())
    .filter((u) => u.status === "vacant")
    .map((u) => ({
      id: u.id,
      label: `${u.code} · ${propMap[u.property_id]?.name || "Property"}${
        u.asking_rent_gmd != null ? ` · asking ${formatGmd(u.asking_rent_gmd)}` : ""
      }`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const allPayments = (
    await Promise.all(
      tens.map(async (t) => {
        const links = await tenancyUnitLinks(t.id);
        const codes = (
          await Promise.all(links.map(async (l) => (await findUnit(l.unit_id))?.code))
        )
          .filter(Boolean)
          .join(", ");
        const payments = await paymentsByTenancy(t.id);
        return payments.map((p) => ({
          ...p,
          tenancyId: t.id,
          unitCodes: codes,
          tenancyStatus: t.status,
        }));
      })
    )
  )
    .flat()
    .sort((a, b) => (b.paid_at || "").localeCompare(a.paid_at || "") || b.id.localeCompare(a.id));

  const activeRows = await Promise.all(
    active.map(async (t) => {
      const links = await tenancyUnitLinks(t.id);
      const codes = (
        await Promise.all(links.map(async (l) => (await findUnit(l.unit_id))?.code))
      )
        .filter(Boolean)
        .join(", ");
      const unit = links[0] ? await findUnit(links[0].unit_id) : null;
      const prop = unit ? await findProperty(unit.property_id) : null;
      return { t, codes, unit, prop };
    })
  );

  const paymentRows = await Promise.all(
    allPayments.map(async (p) => {
      const receipt = await findReceiptByPayment(p.id);
      const staff = await findStaffById(p.recorded_by);
      return { p, receipt, staff };
    })
  );

  const pastRows = await Promise.all(
    tens
      .filter((t) => t.status !== "active")
      .map(async (t) => {
        const links = await tenancyUnitLinks(t.id);
        const codes = (
          await Promise.all(links.map(async (l) => (await findUnit(l.unit_id))?.code))
        )
          .filter(Boolean)
          .join(", ");
        return { t, codes };
      })
  );
  return (
    <PageShell>
      <BackLink href="/tenants">Tenants</BackLink>
      <PageHeader
        eyebrow="Tenant file"
        title={tenant.full_name}
        description={
          [
            tenant.phone,
            tenant.phone_secondary,
            tenantIdLabel(tenant.id_type, tenant.id_number),
          ]
            .filter(Boolean)
            .join(" · ") || "No phone or ID on file"
        }
        actions={
          <>
            {tenant.phone ? (
              <>
                <a
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#0B1220] px-4 py-2.5 text-sm font-semibold text-white"
                  href={telUrl(tenant.phone)}
                >
                  Call
                </a>
                <a
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-garawol-ink shadow-sm"
                  href={whatsappUrl(tenant.phone)}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </>
            ) : null}
            <EditTenantForm
              id={tenant.id}
              fullName={tenant.full_name}
              phone={tenant.phone}
              phoneSecondary={tenant.phone_secondary}
              idType={tenant.id_type}
              idNumber={tenant.id_number}
              notes={tenant.notes}
              isActive={!!tenant.is_active}
            />
            <ConfirmDeleteButton
              title="Delete tenant?"
              description="Removes this person if they have no payment history. Move them out of units first."
              endpoint="/api/tenants"
              body={{ id: tenant.id }}
              redirectTo="/tenants"
            />
          </>
        }
      />

      {tenant.notes && (
        <p className="rounded-[1.25rem] bg-white px-4 py-3 text-sm text-garawol-muted shadow-card">
          {tenant.notes}
        </p>
      )}

      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-garawol-muted">
          Current occupancy
        </h2>

        {active.length === 0 && (
          <SoftCard>
            <p className="mb-3 text-sm text-garawol-muted">
              This person is not in a unit yet. Assign a vacant room to start collecting rent.
            </p>
            <AssignUnitForm tenantId={id} vacantUnits={vacantUnits} />
          </SoftCard>
        )}

        <SoftList>
          {activeRows.map(({ t, codes, unit, prop }) => (
              <SoftListItem key={t.id}>
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-garawol-ink">
                        {codes} · {prop?.name}
                      </p>
                      <p className="text-xs text-garawol-muted">
                        {formatGmd(t.amount_gmd)} · {periodLabel(t.period as RentPeriod)} · due{" "}
                        {t.next_due || "—"}
                      </p>
                      <p className="mt-1 text-xs text-garawol-muted">
                        Balance {formatGmd(t.balance_gmd)}
                        {t.deposit_gmd != null ? ` · deposit ${formatGmd(t.deposit_gmd)}` : ""}
                        {t.start_date ? ` · since ${t.start_date}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/pay/${t.id}`}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#0B1220] px-4 py-2 text-sm font-semibold text-white sm:w-auto"
                      >
                        Record payment
                      </Link>
                      {unit && (
                        <PillLink href={`/units/${unit.id}`} variant="secondary">
                          Unit
                        </PillLink>
                      )}
                    </div>
                  </div>
                  <EndTenancyButton tenancyId={t.id} tenantName={tenant.full_name} />
                </div>
              </SoftListItem>
            ))}
        </SoftList>

        {active.length > 0 && vacantUnits.length > 0 && (
          <div className="pt-1">
            <AssignUnitForm tenantId={id} vacantUnits={vacantUnits} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-garawol-muted">
            Payment history
          </h2>
          <p className="text-xs text-garawol-muted">
            {allPayments.length} payment{allPayments.length === 1 ? "" : "s"} · open any receipt to
            reprint
          </p>
        </div>
        <SoftList>
          {paymentRows.map(({ p, receipt, staff }) => (
              <SoftListItem key={p.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-garawol-ink">
                      {formatGmd(p.amount_gmd)}
                      {receipt ? (
                        <span className="ml-2 text-sm font-medium text-garawol-muted">
                          {receipt.receipt_no}
                          {receipt.status === "void" ? " · VOID" : ""}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-garawol-muted">
                      Paid {p.paid_at}
                      {p.method ? ` · ${p.method}` : ""}
                      {p.unitCodes ? ` · ${p.unitCodes}` : ""}
                    </p>
                    <p className="text-xs text-garawol-muted">
                      Recorded by {recorderLabel(staff?.full_name, staff?.role)}
                    </p>
                    <p className="text-xs text-garawol-muted">
                      Covered {p.period_start} – {p.period_end}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {receipt && (
                      <>
                        <PillLink href={`/receipts/${receipt.id}`} variant="secondary">
                          View
                        </PillLink>
                        <Link
                          href={`/receipts/${receipt.id}?print=1`}
                          className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#0B1220] px-4 py-2 text-sm font-semibold text-white sm:w-auto"
                        >
                          Print
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SoftListItem>
            ))}
          {allPayments.length === 0 && (
            <li className="p-8 text-center text-sm text-garawol-muted">No payments yet.</li>
          )}
        </SoftList>
      </div>

      {pastRows.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-garawol-muted">
            Past tenancies
          </h2>
          <SoftList>
            {pastRows.map(({ t, codes }) => (
                  <SoftListItem key={t.id}>
                    <p className="font-semibold text-garawol-ink">
                      {codes || "Unit"} · {t.status}
                    </p>
                    <p className="text-xs text-garawol-muted">
                      {formatGmd(t.amount_gmd)}
                      {t.start_date ? ` · from ${t.start_date}` : ""}
                    </p>
                  </SoftListItem>
                ))}
          </SoftList>
        </div>
      )}
    </PageShell>
  );
}
