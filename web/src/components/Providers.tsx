"use client";

import { SessionProvider } from "next-auth/react";
import { SyncProvider } from "@/components/SyncProvider";
import { OfficeProvider } from "@/components/OfficeProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <OfficeProvider>
        <SyncProvider>
          <ServiceWorkerRegister />
          {children}
        </SyncProvider>
      </OfficeProvider>
    </SessionProvider>
  );
}
