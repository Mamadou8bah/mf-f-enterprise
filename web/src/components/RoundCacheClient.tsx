"use client";

import { useEffect } from "react";
import { cacheRound } from "@/lib/offline";

export function RoundCacheClient({
  propertyId,
  payload,
}: {
  propertyId: string;
  payload: unknown;
}) {
  useEffect(() => {
    cacheRound(propertyId, payload).catch(() => {});
  }, [propertyId, payload]);
  return null;
}
