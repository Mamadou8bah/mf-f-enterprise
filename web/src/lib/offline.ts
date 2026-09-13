"use client";

import Dexie, { type Table } from "dexie";

export type OutboxItem = {
  id?: number;
  type: "payment" | "photo" | "note";
  payload: Record<string, unknown>;
  createdAt: string;
};

export type CachedRound = {
  propertyId: string;
  json: string;
  cachedAt: string;
};

class GarawolOfflineDB extends Dexie {
  outbox!: Table<OutboxItem, number>;
  rounds!: Table<CachedRound, string>;

  constructor() {
    super("garawol-offline");
    this.version(1).stores({
      outbox: "++id, type, createdAt",
      rounds: "propertyId, cachedAt",
    });
  }
}

const db = typeof window !== "undefined" ? new GarawolOfflineDB() : null;

export async function enqueueOutbox(item: Omit<OutboxItem, "id">) {
  if (!db) return;
  await db.outbox.add(item);
}

export async function getOutboxCount() {
  if (!db) return 0;
  return db.outbox.count();
}

export async function cacheRound(propertyId: string, data: unknown) {
  if (!db) return;
  await db.rounds.put({
    propertyId,
    json: JSON.stringify(data),
    cachedAt: new Date().toISOString(),
  });
}

export async function getCachedRound(propertyId: string) {
  if (!db) return null;
  const row = await db.rounds.get(propertyId);
  return row ? JSON.parse(row.json) : null;
}

export async function processOutbox() {
  if (!db) return;
  const items = await db.outbox.orderBy("id").toArray();
  for (const item of items) {
    if (item.type === "payment") {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });
      if (!res.ok) throw new Error(await res.text());
    } else if (item.type === "photo") {
      const res = await fetch("/api/units/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });
      if (!res.ok) throw new Error(await res.text());
    }
    if (item.id != null) await db.outbox.delete(item.id);
  }
}

export function localReceiptNo() {
  return `LOCAL-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}
