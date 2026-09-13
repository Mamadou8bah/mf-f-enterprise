"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function DueFilter({
  initialQ,
  filter,
}: {
  initialQ: string;
  filter: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);

  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (filter && filter !== "overdue") params.set("filter", filter);
      if (q.trim()) params.set("q", q.trim());
      const next = params.toString()
        ? `/documents/arrears?${params.toString()}`
        : "/documents/arrears";
      const current = `${window.location.pathname}${window.location.search}`;
      if (current === next) return;
      router.replace(next);
    }, 250);
    return () => clearTimeout(t);
  }, [q, filter, router]);

  return (
    <input
      className="field shadow-card"
      placeholder="Search tenant, phone, ID, shop, or property…"
      value={q}
      onChange={(e) => setQ(e.target.value)}
      type="search"
      enterKeyHint="search"
    />
  );
}
