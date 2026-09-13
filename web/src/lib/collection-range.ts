import { formatDate } from "@garawol/shared";

export const COLLECTION_RANGES = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "year", label: "This year" },
  { id: "custom", label: "Custom" },
] as const;

export type CollectionRangeId = (typeof COLLECTION_RANGES)[number]["id"];

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function banjulYmd(d = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Africa/Banjul" });
}

export function parseCollectionRange(raw?: string | null): CollectionRangeId {
  return COLLECTION_RANGES.some((r) => r.id === raw) ? (raw as CollectionRangeId) : "month";
}

export function isYmd(value?: string | null): value is string {
  return !!value && YMD.test(value);
}

function utcNoon(ymd: string) {
  return new Date(`${ymd}T12:00:00Z`);
}

function ymdFromUtc(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function collectionBounds(
  range: CollectionRangeId,
  from?: string | null,
  to?: string | null
): { start: string; end: string } {
  const today = banjulYmd();
  const now = utcNoon(today);
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  if (range === "today") return { start: today, end: today };

  if (range === "week") {
    const monday = new Date(now);
    const dow = monday.getUTCDay();
    monday.setUTCDate(monday.getUTCDate() - ((dow + 6) % 7));
    return { start: ymdFromUtc(monday), end: today };
  }

  if (range === "month") {
    return { start: `${year}-${String(month + 1).padStart(2, "0")}-01`, end: today };
  }

  if (range === "last_month") {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    return { start: ymdFromUtc(start), end: ymdFromUtc(end) };
  }

  if (range === "year") {
    return { start: `${year}-01-01`, end: today };
  }

  let start = isYmd(from) ? from : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  let end = isYmd(to) ? to : today;
  if (start > end) [start, end] = [end, start];
  return { start, end };
}

export function collectionRangeLabel(range: CollectionRangeId, start: string, end: string) {
  const named = COLLECTION_RANGES.find((r) => r.id === range)?.label || "Custom";
  if (start === end) return `${named} · ${formatDate(start)}`;
  return `${named} · ${formatDate(start)} – ${formatDate(end)}`;
}

export function collectionsPath(opts: {
  range: CollectionRangeId;
  q?: string;
  from?: string;
  to?: string;
}) {
  const params = new URLSearchParams();
  if (opts.range !== "month") params.set("range", opts.range);
  if (opts.range === "custom") {
    if (opts.from) params.set("from", opts.from);
    if (opts.to) params.set("to", opts.to);
  }
  if (opts.q?.trim()) params.set("q", opts.q.trim());
  const qs = params.toString();
  return qs ? `/documents/collections?${qs}` : "/documents/collections";
}
