"use client";

import { useEffect, useRef, useState } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);

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
      router.replace(next, { scroll: false });
    }, 160);
    return () => clearTimeout(t);
  }, [q, pathname, router, keepKey]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        className="field shadow-card pr-16"
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {q ? (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-garawol-muted hover:bg-garawol-mist"
          onClick={() => {
            setQ("");
            inputRef.current?.focus();
          }}
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
