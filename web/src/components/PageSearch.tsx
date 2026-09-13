"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function PageSearch({
  initialQ = "",
  placeholder,
  keep = {},
}: {
  initialQ?: string;
  placeholder: string;
  keep?: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(initialQ);
  const keepKey = JSON.stringify(keep);

  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      const kept = JSON.parse(keepKey) as Record<string, string | undefined>;
      for (const [key, value] of Object.entries(kept)) {
        if (value) params.set(key, value);
      }
      if (q.trim()) params.set("q", q.trim());
      const qs = params.toString();
      const next = qs ? `${pathname}?${qs}` : pathname;
      const current = `${window.location.pathname}${window.location.search}`;
      if (current === next) return;
      router.replace(next);
    }, 250);
    return () => clearTimeout(t);
  }, [q, pathname, router, keepKey]);

  return (
    <input
      className="field shadow-card"
      placeholder={placeholder}
      value={q}
      onChange={(e) => setQ(e.target.value)}
      type="search"
      enterKeyHint="search"
    />
  );
}
