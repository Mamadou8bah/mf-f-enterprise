"use client";

import { PillTab } from "@/components/ui";
import { PageSearch } from "@/components/PageSearch";
import {
  COLLECTION_RANGES,
  collectionsPath,
  type CollectionRangeId,
} from "@/lib/collection-range";

export function CollectionsFilter({
  range,
  q,
  from,
  to,
}: {
  range: CollectionRangeId;
  q: string;
  from: string;
  to: string;
}) {
  return (
    <div className="space-y-3">
      <PageSearch
        initialQ={q}
        placeholder="Search this list by property, area, or owner…"
        keep={{
          range: range === "month" ? undefined : range,
          from: range === "custom" ? from : undefined,
          to: range === "custom" ? to : undefined,
        }}
      />
      <div className="flex flex-wrap gap-2">
        {COLLECTION_RANGES.map((item) => (
          <PillTab
            key={item.id}
            prefetch={false}
            href={collectionsPath({
              range: item.id,
              q,
              from: item.id === "custom" ? from : undefined,
              to: item.id === "custom" ? to : undefined,
            })}
            active={range === item.id}
          >
            {item.label}
          </PillTab>
        ))}
      </div>
      {range === "custom" && (
        <form
          method="get"
          action="/documents/collections"
          className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end"
        >
          <input type="hidden" name="range" value="custom" />
          {q.trim() ? <input type="hidden" name="q" value={q.trim()} /> : null}
          <label className="block min-w-0 sm:w-40">
            <span className="label">From</span>
            <input className="field" type="date" name="from" defaultValue={from} required />
          </label>
          <label className="block min-w-0 sm:w-40">
            <span className="label">To</span>
            <input className="field" type="date" name="to" defaultValue={to} required />
          </label>
          <button type="submit" className="btn-secondary col-span-2 sm:w-auto">
            Apply dates
          </button>
        </form>
      )}
    </div>
  );
}
