import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import {
  findUnit,
  findProperty,
  photosByUnit,
  tenancyUnitLinks,
  findTenancy,
  findTenant,
  allTenants,
  allTenancies,
} from "@/lib/data";
import { formatGmd, vacancyBlurb, periodLabel, telUrl, whatsappUrl } from "@garawol/shared";
import type { RentPeriod } from "@garawol/shared";
import { UnitPhotoUploader } from "@/components/UnitPhotoUploader";
import { OccupyUnitForm } from "@/components/OccupyUnitForm";
import { EndTenancyButton } from "@/components/EndTenancyButton";
import { VacantUnitPanel } from "@/components/VacantUnitPanel";
import { EditUnitForm } from "@/components/EditUnitForm";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import {
  PageHeader,
  PageShell,
  SoftCard,
  BackLink,
  PillLink,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function UnitPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const unit = await findUnit(id);
  if (!unit) notFound();
  const property = await findProperty(unit.property_id);
  const photos = await photosByUnit(id);
  const link = await tenancyUnitLinks(undefined, id);
  let tenancy = null as Awaited<ReturnType<typeof findTenancy>> | null;
  let tenant = null as Awaited<ReturnType<typeof findTenant>> | null;
  for (const l of link) {
    const t = await findTenancy(l.tenancy_id);
    if (t?.status === "active") {
      tenancy = t;
      tenant = (await findTenant(t.tenant_id)) || null;
      break;
    }
  }

  const occupiedTenantIds = new Set(
    (await allTenancies())
      .filter((t) => t.status === "active")
      .map((t) => t.tenant_id)
  );
  const allTenantRows = await allTenants();
  const freeTenants = allTenantRows
    .filter((t) => t.is_active && !occupiedTenantIds.has(t.id))
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
    .map((t) => ({
      id: t.id,
      label: `${t.full_name}${t.phone ? ` · ${t.phone}` : ""}`,
    }));
  const tenantOptions =
    freeTenants.length > 0
      ? freeTenants
      : allTenantRows
          .filter((t) => t.is_active)
          .sort((a, b) => a.full_name.localeCompare(b.full_name))
          .map((t) => ({
            id: t.id,
            label: `${t.full_name}${t.phone ? ` · ${t.phone}` : ""}`,
          }));

  const isVacant = unit.status === "vacant" && !tenancy;
  const blurb = vacancyBlurb({
    propertyName: property?.name || "",
    unitCode: unit.code,
    unitType: unit.type,
    askingRent: unit.asking_rent_gmd,
    photoUrl: photos[0]?.url || null,
  });

  const statusLabel = isVacant
    ? "Vacant"
    : tenancy
      ? "Occupied"
      : unit.status;

  return (
    <PageShell>
      <BackLink href={`/properties/${unit.property_id}/round`}>Property</BackLink>
      <PageHeader
        eyebrow={property?.name || "Unit"}
        title={unit.code}
        description={[
          unit.type.replace(/_/g, " "),
          unit.asking_rent_gmd != null ? `Asking ${formatGmd(unit.asking_rent_gmd)}` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <EditUnitForm
              unit={{
                id: unit.id,
                code: unit.code,
                type: unit.type,
                status: unit.status,
                askingRentGmd: unit.asking_rent_gmd,
                notes: unit.notes,
              }}
            />
            <ConfirmDeleteButton
              title="Delete unit?"
              description="Removes this unit if it is vacant and has no payment history."
              endpoint="/api/units"
              body={{ id: unit.id }}
              redirectTo={`/properties/${unit.property_id}/round`}
            />
            {tenancy ? (
              <PillLink href={`/pay/${tenancy.id}`} variant="primary">
                Record payment
              </PillLink>
            ) : (
              <span className="inline-flex items-center justify-center rounded-full bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-800">
                {statusLabel}
              </span>
            )}
          </div>
        }
      />

      {isVacant && (
        <VacantUnitPanel
          unitId={unit.id}
          tenants={tenantOptions}
          defaultAsking={unit.asking_rent_gmd}
          blurb={blurb}
        />
      )}

      {tenant && tenancy && (
        <SoftCard>
          <p className="text-xs font-semibold uppercase tracking-wide text-garawol-muted">
            Current tenant
          </p>
          <p className="mt-1 text-lg font-semibold text-garawol-ink">{tenant.full_name}</p>
          <p className="text-sm text-garawol-muted">{tenant.phone || "No phone"}</p>
          <p className="mt-2 text-sm text-garawol-muted">
            {formatGmd(tenancy.amount_gmd)} · {periodLabel(tenancy.period as RentPeriod)} · due{" "}
            {tenancy.next_due || "—"}
          </p>
          <p className="text-xs text-garawol-muted">
            Balance {formatGmd(tenancy.balance_gmd)}
            {tenancy.deposit_gmd != null ? ` · deposit ${formatGmd(tenancy.deposit_gmd)}` : ""}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/tenants/${tenant.id}`}
              className="rounded-full bg-[#0B1220] px-4 py-2 text-sm font-semibold text-white"
            >
              Open tenant file
            </Link>
            {tenant.phone && (
              <>
                <a
                  className="rounded-full bg-garawol-mist px-4 py-2 text-sm font-semibold text-garawol-ink"
                  href={telUrl(tenant.phone)}
                >
                  Call
                </a>
                <a
                  className="rounded-full bg-garawol-mist px-4 py-2 text-sm font-semibold text-garawol-ink"
                  href={whatsappUrl(tenant.phone)}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </>
            )}
          </div>
          <div className="mt-4 border-t border-garawol-line pt-4">
            <EndTenancyButton tenancyId={tenancy.id} tenantName={tenant.full_name} />
          </div>
        </SoftCard>
      )}

      {!isVacant && !tenancy && (
        <SoftCard>
          <p className="text-sm text-garawol-muted">
            Marked {unit.status} but no active tenancy on file.
          </p>
          <div className="mt-4">
            <OccupyUnitForm
              unitId={unit.id}
              tenants={tenantOptions}
              defaultAsking={unit.asking_rent_gmd}
            />
          </div>
        </SoftCard>
      )}

      <SoftCard>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-garawol-muted">
          Photos
        </h2>
        <div className="mb-4 flex flex-wrap gap-2">
          {photos.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.id} src={p.url} alt="" className="h-24 w-24 rounded-2xl object-cover" />
          ))}
          {photos.length === 0 && <p className="text-sm text-garawol-muted">No photos yet.</p>}
        </div>
        <UnitPhotoUploader unitId={unit.id} />
      </SoftCard>
    </PageShell>
  );
}
