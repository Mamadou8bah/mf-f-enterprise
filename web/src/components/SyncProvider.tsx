"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getOutboxCount, processOutbox } from "@/lib/offline";

type SyncState = {
  online: boolean;
  pending: number;
  syncing: boolean;
  lastError: string | null;
  refresh: () => Promise<void>;
};

const Ctx = createContext<SyncState | null>(null);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setPending(await getOutboxCount());
  }, []);

  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    refresh();
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [refresh]);

  useEffect(() => {
    if (!online || pending === 0) return;
    let cancelled = false;
    (async () => {
      setSyncing(true);
      setLastError(null);
      try {
        await processOutbox();
        if (!cancelled) await refresh();
      } catch (e) {
        if (!cancelled) setLastError(e instanceof Error ? e.message : "Sync failed");
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [online, pending, refresh]);

  const value = useMemo(
    () => ({ online, pending, syncing, lastError, refresh }),
    [online, pending, syncing, lastError, refresh]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSync() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSync outside provider");
  return ctx;
}
