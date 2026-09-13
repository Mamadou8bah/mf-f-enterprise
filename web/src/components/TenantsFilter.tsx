"use client";

import { useRouter } from "next/navigation";
import { PageSearch } from "@/components/PageSearch";

export function TenantsFilter({
  initialQ,
  filter,
}: {
  initialQ: string;
  filter: string;
}) {
  const router = useRouter();

  function pushFilter(nextFilter: string) {
    const params = new URLSearchParams();
    if (initialQ.trim()) params.set("q", initialQ.trim());
    if (nextFilter && nextFilter !== "all") params.set("filter", nextFilter);
    const qs = params.toString();
    router.push(qs ? `/tenants?${qs}` : "/tenants");
  }

  return (
    <div className="space-y-3">
      <PageSearch
        initialQ={initialQ}
        placeholder="Search this list by name, phone, or ID…"
        keep={{ filter: filter === "all" ? undefined : filter }}
      />
      <div className="chip-row">
        {(
          [
            ["all", "All"],
            ["housed", "In a unit"],
            ["unassigned", "Unassigned"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => pushFilter(id)}
            className={
              filter === id
                ? "min-h-11 rounded-full bg-[#0B1220] px-4 py-2 text-sm font-semibold text-white"
                : "min-h-11 rounded-full bg-white px-4 py-2 text-sm font-semibold text-garawol-ink shadow-sm"
            }
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
