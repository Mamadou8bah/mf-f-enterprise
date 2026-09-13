import Image from "next/image";
import { formatGmd, formatDate } from "@garawol/shared";
import { getOfficeSettings, officeContactLine } from "@/lib/office-settings";
import { roleLabel } from "@/lib/roles";

export type ReceiptDocumentProps = {
  receiptNo: string;
  status: string;
  tenantName: string;
  tenantPhone?: string | null;
  unitCodes: string;
  propertyName: string;
  landlordName: string;
  amountGmd: number;
  periodStart: string;
  periodEnd: string;
  paidAt: string;
  method: string;
  collectorName: string;
  collectorRole?: string | null;
  notes?: string | null;
};

function methodLabel(method: string) {
  const map: Record<string, string> = {
    cash: "Cash",
    wave: "Wave",
    bank: "Bank transfer",
    orange_money: "Orange Money",
    other: "Other",
  };
  return map[method] || method;
}

export async function ReceiptDocument(props: ReceiptDocumentProps) {
  const isVoid = props.status === "void";
  const office = await getOfficeSettings();
  const contact = officeContactLine(office);

  return (
    <article className="receipt-a4" aria-label={`Receipt ${props.receiptNo}`}>
      {isVoid && <div className="receipt-void-stamp">VOID</div>}

      <header className="receipt-header">
        <div className="receipt-brand">
          <Image
            src="/mf_logo.png"
            alt={office.companyName}
            width={72}
            height={72}
            className="receipt-logo"
            priority
          />
          <div>
            <p className="receipt-company">{office.companyName}</p>
            <p className="receipt-tagline">{office.tagline}</p>
          </div>
        </div>
        <div className="receipt-title-block">
          <p className="receipt-doc-label">Official rent receipt</p>
          <p className="receipt-no">{props.receiptNo}</p>
          <p className="receipt-paid-date">Paid {formatDate(props.paidAt)}</p>
        </div>
      </header>

      <section className="receipt-amount-band">
        <div>
          <p className="receipt-amount-label">Amount received</p>
          <p className="receipt-amount-value">{formatGmd(props.amountGmd)}</p>
        </div>
        <div className="receipt-amount-meta">
          <p>
            <span>Method</span>
            {methodLabel(props.method)}
          </p>
          <p>
            <span>Period</span>
            {formatDate(props.periodStart)} – {formatDate(props.periodEnd)}
          </p>
        </div>
      </section>

      <section className="receipt-grid">
        <div className="receipt-field">
          <p className="receipt-label">Received from (tenant)</p>
          <p className="receipt-value">{props.tenantName}</p>
          {props.tenantPhone && <p className="receipt-sub">{props.tenantPhone}</p>}
        </div>
        <div className="receipt-field">
          <p className="receipt-label">Unit / property</p>
          <p className="receipt-value">{props.unitCodes || "—"}</p>
          <p className="receipt-sub">{props.propertyName}</p>
        </div>
        <div className="receipt-field">
          <p className="receipt-label">Collected for</p>
          <p className="receipt-value">{props.landlordName}</p>
          <p className="receipt-sub">via {office.companyShort}</p>
        </div>
        <div className="receipt-field">
          <p className="receipt-label">Issued by</p>
          <p className="receipt-value">{props.collectorName}</p>
          <p className="receipt-sub">
            {[roleLabel(props.collectorRole), office.companyName].filter(Boolean).join(" · ")}
          </p>
        </div>
      </section>

      {props.notes && (
        <section className="receipt-notes">
          <p className="receipt-label">Notes</p>
          <p className="receipt-value">{props.notes}</p>
        </section>
      )}

      <section className="receipt-ack">
        <p>
          This receipt confirms that <strong>{office.companyName}</strong> has received the amount
          stated above as rent payment for the unit and period shown. Payment covers only the rent
          period listed on this receipt and does not replace a tenancy agreement, alter any outstanding
          balance outside that period, or waive other charges owed under the tenancy. Please keep this
          copy for your records. If any detail appears incorrect, contact the office promptly with this
          receipt number so the record can be checked and corrected if needed.
        </p>
      </section>

      <section className="receipt-signatures">
        <div className="receipt-sign">
          <div className="receipt-sign-line" />
          <p className="receipt-sign-label">Collector signature</p>
          <p className="receipt-sign-name">
            {props.collectorName}
            {props.collectorRole ? ` · ${roleLabel(props.collectorRole)}` : ""}
          </p>
        </div>
        <div className="receipt-sign">
          <div className="receipt-sign-line" />
          <p className="receipt-sign-label">Tenant signature</p>
          <p className="receipt-sign-name">{props.tenantName}</p>
        </div>
      </section>

      <footer className="receipt-footer">
        <p>
          {office.companyName} · Receipt {props.receiptNo}
        </p>
        {contact ? <p>{contact}</p> : null}
        <p>{office.receiptFooter}</p>
      </footer>
    </article>
  );
}
