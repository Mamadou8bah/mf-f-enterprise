import type { RentPeriod } from "./types";

const MONTHS: Record<RentPeriod, number> = {
  monthly: 1,
  "2_months": 2,
  "3_months": 3,
  "6_months": 6,
  yearly: 12,
};

export function periodMonths(period: RentPeriod): number {
  return MONTHS[period];
}

export function periodLabel(period: RentPeriod): string {
  switch (period) {
    case "monthly":
      return "Monthly";
    case "2_months":
      return "2 months";
    case "3_months":
      return "3 months";
    case "6_months":
      return "6 months";
    case "yearly":
      return "Yearly";
  }
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d;
}

export function periodEndFromStart(start: Date, period: RentPeriod): Date {
  const end = addMonths(start, periodMonths(period));
  end.setDate(end.getDate() - 1);
  return end;
}

export function nextDueAfterClear(currentDue: Date, period: RentPeriod): Date {
  return addMonths(currentDue, periodMonths(period));
}

/** Next billing start is the day after the covered period ends. */
export function nextDueFromPeriodEnd(periodEnd: Date | string): Date {
  const d = typeof periodEnd === "string" ? new Date(periodEnd) : new Date(periodEnd);
  d.setDate(d.getDate() + 1);
  return d;
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Banjul",
  });
}

export function startOfDayBanjul(d = new Date()): Date {
  const s = d.toLocaleDateString("en-CA", { timeZone: "Africa/Banjul" });
  return new Date(`${s}T00:00:00`);
}

export function daysBetween(a: Date, b: Date): number {
  const ms = startOfDayBanjul(b).getTime() - startOfDayBanjul(a).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

/** Heuristic parse from Word docs e.g. "D10,500 @ 3 MONTHS", "300,000 yearly" */
export function parseRentBlob(raw: string): {
  amount: number | null;
  period: RentPeriod | null;
  confidence: "high" | "low";
} {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text || /no idea|unknown|empty/i.test(text)) {
    return { amount: null, period: null, confidence: "low" };
  }

  // Prefer explicit currency / @ rent markers over bare digit runs (phones).
  const marked =
    text.match(/(?:D|GMD|dalasi)\s*([\d,]+(?:\.\d+)?)/i) ||
    text.match(/@\s*([\d,]+(?:\.\d+)?)/);
  const numMatch = marked || text.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  let amount = numMatch ? Math.round(Number(String(numMatch[1]).replace(/,/g, ""))) : null;

  // 7–9 digit bare numbers are usually phone numbers, not rent.
  if (amount != null && amount >= 1_000_000) {
    amount = null;
  }

  let period: RentPeriod | null = null;
  if (/year|annual/i.test(text)) period = "yearly";
  else if (/six\s*month|6\s*month/i.test(text)) period = "6_months";
  else if (/three\s*month|3\s*month/i.test(text)) period = "3_months";
  else if (/two\s*month|2\s*month/i.test(text)) period = "2_months";
  else if (/month/i.test(text)) period = "monthly";

  const confidence: "high" | "low" =
    amount != null && period != null ? "high" : "low";
  return { amount, period, confidence };
}
