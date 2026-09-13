import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getReceiptBundle, findStaffById } from "@/lib/queries";
import { formatGmd, receiptWhatsAppText, whatsappUrl } from "@garawol/shared";
import { VoidReceiptButton } from "@/components/VoidReceiptButton";
import { PrintButton } from "@/components/PrintButton";
import { AutoPrintReceipt } from "@/components/AutoPrintReceipt";
import { ReceiptDocument } from "@/components/ReceiptDocument";
import { recorderLabel } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const sp = await searchParams;
  const justPaid = sp.print === "1" || sp.print === "true";
  const bundle = await getReceiptBundle(id);
  if (!bundle?.receipt || !bundle.payment || !bundle.tenant || !bundle.property) {
    notFound();
  }
  const collector = await findStaffById(bundle.payment.recorded_by);
  const unitCodes = (bundle.units || []).map((u) => u.code).join(", ");
  const landlordName = bundle.landlord?.full_name || "Owner";
  const collectorName = collector?.full_name || "Staff";
  const wa = receiptWhatsAppText({
    receiptNo: bundle.receipt.receipt_no,
    tenantName: bundle.tenant.full_name,
    unitCodes,
    propertyName: bundle.property.name,
    landlordName,
    amount: bundle.payment.amount_gmd,
    periodStart: bundle.payment.period_start,
    periodEnd: bundle.payment.period_end,
    paidAt: bundle.payment.paid_at,
    balanceRemaining: 0,
    collectorName,
  });

  return (
    <div className="receipt-page space-y-5 lg:space-y-7">
      <AutoPrintReceipt enabled={justPaid} />

      <div className="no-print space-y-4">
        {justPaid ? (
          <div className="rounded-[1.5rem] bg-garawol-greenSoft px-5 py-4 text-garawol-green shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide">
              Payment saved
            </p>
            <p className="mt-1 text-xl font-semibold tracking-tight">
              {formatGmd(bundle.payment.amount_gmd)} · {bundle.tenant.full_name}
            </p>
            <p className="mt-1 text-sm">
              Receipt {bundle.receipt.receipt_no} — print dialog opens automatically. Hand the
              printed copy to the tenant.
            </p>
          </div>
        ) : (
          <p className="text-sm font-medium text-garawol-muted">Official receipt</p>
        )}

        <h1 className="text-2xl font-semibold tracking-tight text-garawol-ink lg:text-3xl">
          {bundle.receipt.receipt_no}
        </h1>
        <p className="text-sm text-garawol-muted">
          Recorded by {recorderLabel(collectorName, collector?.role)}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">
          <PrintButton
            label={justPaid ? "Print receipt now" : "Print receipt"}
            autofocus={justPaid}
          />
          {bundle.tenant.phone && (
            <a
              className="btn-secondary"
              href={whatsappUrl(bundle.tenant.phone, wa)}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          )}
          <Link href={`/receipts/${id}/pdf`} className="btn-secondary">
            Download PDF
          </Link>
          <Link href={`/tenants/${bundle.tenant.id}`} className="btn-secondary">
            Tenant payments
          </Link>
          <Link href="/search" className="btn-secondary">
            Next payment
          </Link>
          <Link href="/" className="btn-secondary">
            Done
          </Link>
          {session.user.role === "admin" && bundle.receipt.status === "issued" && (
            <VoidReceiptButton receiptId={bundle.receipt.id} />
          )}
        </div>
      </div>

      <div className="receipt-sheet-wrap">
        <ReceiptDocument
          receiptNo={bundle.receipt.receipt_no}
          status={bundle.receipt.status}
          tenantName={bundle.tenant.full_name}
          tenantPhone={bundle.tenant.phone}
          unitCodes={unitCodes}
          propertyName={bundle.property.name}
          landlordName={landlordName}
          amountGmd={bundle.payment.amount_gmd}
          periodStart={bundle.payment.period_start}
          periodEnd={bundle.payment.period_end}
          paidAt={bundle.payment.paid_at}
          method={bundle.payment.method}
          collectorName={collectorName}
          collectorRole={collector?.role}
          notes={bundle.payment.notes}
        />
      </div>
    </div>
  );
}
