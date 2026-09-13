"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_OFFICE, type OfficeSettings } from "@/lib/brand";

const OfficeContext = createContext<OfficeSettings>(DEFAULT_OFFICE);

export function useOffice() {
  return useContext(OfficeContext);
}

export function OfficeProvider({ children }: { children: ReactNode }) {
  const [office, setOffice] = useState<OfficeSettings>(DEFAULT_OFFICE);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.companyName) setOffice(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return <OfficeContext.Provider value={office}>{children}</OfficeContext.Provider>;
}
