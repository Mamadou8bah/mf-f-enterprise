"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Opens the browser print dialog once after a fresh payment. */
export function AutoPrintReceipt({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (!enabled || ran.current) return;
    ran.current = true;

    const t = window.setTimeout(() => {
      window.print();
      // Drop ?print=1 so refresh / back doesn't reprint
      const url = new URL(window.location.href);
      if (url.searchParams.has("print")) {
        url.searchParams.delete("print");
        router.replace(url.pathname + (url.search || ""));
      }
    }, 450);

    return () => window.clearTimeout(t);
  }, [enabled, router]);

  return null;
}
