import Image from "next/image";
import type { ReactNode } from "react";
import { getOfficeSettings } from "@/lib/office-settings";

export async function PrintSheet({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const office = await getOfficeSettings();
  const printed = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="print-sheet print-only" aria-label={title}>
      <header className="print-letterhead">
        <div className="print-brand">
          <Image
            src="/mf_logo.png"
            alt={office.companyName}
            width={56}
            height={56}
            className="print-logo"
          />
          <div>
            <p className="print-company">{office.companyName}</p>
            <p className="print-tagline">{office.tagline}</p>
          </div>
        </div>
        <div className="print-doc-head">
          <p className="print-doc-title">{title}</p>
          {subtitle && <p className="print-doc-sub">{subtitle}</p>}
          <p className="print-doc-date">{printed}</p>
        </div>
      </header>
      <div className="print-body">{children}</div>
      <footer className="print-sheet-footer">
        <span>{office.companyName}</span>
        <span>Confidential office record</span>
      </footer>
    </article>
  );
}

export function PrintSummary({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="print-summary">
      {items.map((item) => (
        <div key={item.label} className="print-summary-item">
          <p className="print-summary-label">{item.label}</p>
          <p className="print-summary-value">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function PrintTable({
  columns,
  rows,
  empty = "No records.",
}: {
  columns: string[];
  rows: ReactNode[][];
  empty?: string;
}) {
  return (
    <table className="print-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length}>{empty}</td>
          </tr>
        ) : (
          rows.map((cells, i) => (
            <tr key={i}>
              {cells.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
