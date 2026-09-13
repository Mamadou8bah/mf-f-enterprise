"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { PageHeader, PageShell, SoftList, SoftListItem } from "@/components/ui";
import { ArrowUpRightIcon, SearchIcon } from "@/components/icons";
import { tenantIdLabel } from "@/lib/tenant-id";

type SearchResult = {
  tenants: {
    id: string;
    fullName: string;
    phone: string | null;
    idType: string | null;
    idNumber: string | null;
  }[];
  units: { id: string; code: string; propertyId: string; propertyName?: string }[];
  receipts: { id: string; receiptNo: string }[];
  properties?: { id: string; name: string; area: string | null }[];
  browsing?: boolean;
};

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const filtering = Boolean(q.trim());
  const totalHits =
    (data?.tenants.length || 0) +
    (data?.units.length || 0) +
    (data?.receipts.length || 0) +
    (data?.properties?.length || 0);

  useEffect(() => {
    const controller = new AbortController();
    const delay = filtering ? 120 : 0;
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Search failed");
        const json = (await res.json()) as SearchResult;
        setData(json);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError("Couldn’t search right now. Try again.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, delay);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q, filtering]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Office counter"
        title="Find & pay"
        description="Results update as you type — name, phone, ID, shop, building, or receipt"
      />

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-garawol-soft" />
        <input
          id={inputId}
          ref={inputRef}
          className="field shadow-card pl-11 pr-20"
          placeholder="Start typing a tenant, shop, building…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-controls="search-results"
          aria-busy={loading}
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {loading ? (
            <span className="px-2 text-xs font-medium text-garawol-soft">Searching…</span>
          ) : null}
          {q ? (
            <button
              type="button"
              className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-garawol-muted hover:bg-garawol-mist"
              onClick={() => {
                setQ("");
                inputRef.current?.focus();
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

      {!filtering && !loading ? (
        <p className="text-sm text-garawol-muted">
          Tip: type a few letters of a name or shop number. Empty search shows a short browse list.
        </p>
      ) : null}

      {filtering && !loading && data && totalHits === 0 ? (
        <div className="rounded-2xl border border-dashed border-garawol-line bg-white px-4 py-8 text-center">
          <p className="font-semibold text-garawol-ink">No matches for “{q.trim()}”</p>
          <p className="mt-1 text-sm text-garawol-muted">
            Try another spelling, phone digits, or a receipt number like MFF-2026-
          </p>
        </div>
      ) : null}

      <div id="search-results" className="space-y-5" aria-live="polite">
        {data && (data.tenants.length > 0 || !filtering) ? (
          <Section
            title={filtering ? "Tenants" : "Browse tenants"}
            count={data.tenants.length}
          >
            <SoftList>
              {data.tenants.map((t) => (
                <SoftListItem key={t.id}>
                  <div className="flex items-center gap-3">
                    <Link href={`/tenants/${t.id}`} className="min-w-0 flex-1">
                      <p className="font-semibold text-garawol-ink">{highlight(t.fullName, q)}</p>
                      <p className="text-xs text-garawol-muted">
                        {[t.phone, tenantIdLabel(t.idType, t.idNumber)].filter(Boolean).join(" · ") ||
                          "No phone"}
                      </p>
                    </Link>
                    <Link
                      href={`/tenants/${t.id}`}
                      className="shrink-0 rounded-xl bg-garawol-green px-3 py-2 text-xs font-semibold text-white"
                    >
                      Open
                    </Link>
                  </div>
                </SoftListItem>
              ))}
            </SoftList>
            {filtering && data.tenants.length >= 40 ? (
              <Link
                href={`/tenants?q=${encodeURIComponent(q.trim())}`}
                className="inline-flex text-sm font-semibold text-garawol-green"
              >
                See all matching tenants
              </Link>
            ) : null}
            {!filtering ? (
              <Link href="/tenants" className="inline-flex text-sm font-semibold text-garawol-green">
                Open full tenant list
              </Link>
            ) : null}
          </Section>
        ) : null}

        {filtering && data?.properties && data.properties.length > 0 ? (
          <Section title="Buildings" count={data.properties.length}>
            <SoftList>
              {data.properties.map((p) => (
                <SoftListItem key={p.id}>
                  <Link
                    href={`/properties/${p.id}/round`}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-garawol-ink">{highlight(p.name, q)}</p>
                      {p.area ? <p className="text-xs text-garawol-muted">{p.area}</p> : null}
                    </div>
                    <ArrowUpRightIcon className="h-4 w-4 text-garawol-soft" />
                  </Link>
                </SoftListItem>
              ))}
            </SoftList>
          </Section>
        ) : null}

        {filtering && data ? (
          <Section title="Shops / units" count={data.units.length}>
            <SoftList>
              {data.units.map((u) => (
                <SoftListItem key={u.id}>
                  <Link href={`/units/${u.id}`} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-garawol-ink">{highlight(u.code, q)}</p>
                      {u.propertyName ? (
                        <p className="text-xs text-garawol-muted">{u.propertyName}</p>
                      ) : null}
                    </div>
                    <ArrowUpRightIcon className="h-4 w-4 text-garawol-soft" />
                  </Link>
                </SoftListItem>
              ))}
              {data.units.length === 0 ? (
                <li className="p-6 text-sm text-garawol-muted">No shops matched</li>
              ) : null}
            </SoftList>
          </Section>
        ) : null}

        {filtering && data ? (
          <Section title="Receipts" count={data.receipts.length}>
            <SoftList>
              {data.receipts.map((r) => (
                <SoftListItem key={r.id}>
                  <Link
                    href={`/receipts/${r.id}`}
                    className="flex items-center justify-between gap-3"
                  >
                    <p className="font-semibold text-garawol-ink">{highlight(r.receiptNo, q)}</p>
                    <ArrowUpRightIcon className="h-4 w-4 text-garawol-soft" />
                  </Link>
                </SoftListItem>
              ))}
              {data.receipts.length === 0 ? (
                <li className="p-6 text-sm text-garawol-muted">No receipts matched</li>
              ) : null}
            </SoftList>
          </Section>
        ) : null}
      </div>
    </PageShell>
  );
}

function highlight(text: string, q: string): ReactNode {
  const term = q.trim();
  if (!term) return text;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-[#F5E6A8] px-0.5 text-inherit">{text.slice(idx, idx + term.length)}</mark>
      {text.slice(idx + term.length)}
    </>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-garawol-muted">{title}</h2>
        {typeof count === "number" ? (
          <span className="text-xs text-garawol-soft">{count}</span>
        ) : null}
      </div>
      {children}
    </section>
  );
}
