"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { PageHeader, PageShell, SoftList, SoftListItem } from "@/components/ui";
import { ArrowUpRightIcon } from "@/components/icons";
import { tenantIdLabel } from "@/lib/tenant-id";

type SearchResult = {
  tenants: {
    id: string;
    fullName: string;
    phone: string | null;
    idType: string | null;
    idNumber: string | null;
  }[];
  units: { id: string; code: string; propertyId: string }[];
  receipts: { id: string; receiptNo: string }[];
};

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<SearchResult | null>(null);
  const filtering = Boolean(q.trim());

  useEffect(() => {
    const delay = filtering ? 200 : 0;
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      setData(await res.json());
    }, delay);
    return () => clearTimeout(t);
  }, [q, filtering]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Office counter"
        title="Find tenant"
        description="Pick a tenant below, or type a name, phone, ID, shop number, or receipt"
      />
      <input
        className="field shadow-card"
        placeholder="Filter by name, phone, ID, shop no, receipt…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      {data && (
        <div className="space-y-5">
          <Section title="Tenants">
            <SoftList>
              {data.tenants.map((t) => (
                <SoftListItem key={t.id}>
                  <Link href={`/tenants/${t.id}`} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-garawol-ink">{t.fullName}</p>
                      <p className="text-xs text-garawol-muted">
                        {[t.phone, tenantIdLabel(t.idType, t.idNumber)].filter(Boolean).join(" · ") ||
                          "No phone"}
                      </p>
                    </div>
                    <ArrowUpRightIcon className="h-4 w-4 text-garawol-soft" />
                  </Link>
                </SoftListItem>
              ))}
              {data.tenants.length === 0 && (
                <li className="p-6 text-sm text-garawol-muted">
                  {filtering ? "No tenants matched" : "No tenants yet"}
                </li>
              )}
            </SoftList>
            {filtering && data.tenants.length >= 40 && (
              <Link
                href={`/tenants?q=${encodeURIComponent(q.trim())}`}
                className="inline-flex text-sm font-semibold text-garawol-green"
              >
                See all matching tenants
              </Link>
            )}
            {!filtering && data.tenants.length > 0 && (
              <Link href="/tenants" className="inline-flex text-sm font-semibold text-garawol-green">
                Open full tenant list
              </Link>
            )}
          </Section>
          {filtering ? (
            <div className="space-y-5">
              <Section title="Units">
                <SoftList>
                  {data.units.map((u) => (
                    <SoftListItem key={u.id}>
                      <Link href={`/units/${u.id}`} className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-garawol-ink">{u.code}</p>
                        <ArrowUpRightIcon className="h-4 w-4 text-garawol-soft" />
                      </Link>
                    </SoftListItem>
                  ))}
                  {data.units.length === 0 && (
                    <li className="p-6 text-sm text-garawol-muted">No units matched</li>
                  )}
                </SoftList>
              </Section>
              <Section title="Receipts">
                <SoftList>
                  {data.receipts.map((r) => (
                    <SoftListItem key={r.id}>
                      <Link href={`/receipts/${r.id}`} className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-garawol-ink">{r.receiptNo}</p>
                        <ArrowUpRightIcon className="h-4 w-4 text-garawol-soft" />
                      </Link>
                    </SoftListItem>
                  ))}
                  {data.receipts.length === 0 && (
                    <li className="p-6 text-sm text-garawol-muted">No receipts matched</li>
                  )}
                </SoftList>
                {data.receipts.length >= 40 && (
                  <Link href="/receipts" className="inline-flex text-sm font-semibold text-garawol-green">
                    Browse all receipts
                  </Link>
                )}
              </Section>
            </div>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-garawol-muted">{title}</h2>
      {children}
    </section>
  );
}
