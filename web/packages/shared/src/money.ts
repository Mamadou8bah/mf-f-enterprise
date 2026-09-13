/** Amounts are integer GMD (dalasis). */

/** Rents above this are almost always parse errors (e.g. phone numbers). */
export const MAX_PLAUSIBLE_RENT_GMD = 1_000_000;

export function isPlausibleRentAmount(amount: number | null | undefined): boolean {
  if (amount == null || !Number.isFinite(amount)) return false;
  return amount > 0 && amount < MAX_PLAUSIBLE_RENT_GMD;
}

export function formatGmd(amount: number): string {
  const n = Math.round(amount);
  return `D ${n.toLocaleString("en-GM")}`;
}

/** Short form for tight mobile UI: D 12.4k / D 1.2m */
export function formatGmdCompact(amount: number): string {
  const n = Math.abs(Math.round(amount));
  const sign = amount < 0 ? "-" : "";
  if (n >= 1_000_000_000) return `${sign}D ${(n / 1_000_000_000).toFixed(1)}bn`;
  if (n >= 1_000_000) return `${sign}D ${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 10_000) return `${sign}D ${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}k`;
  return `${sign}D ${n.toLocaleString("en-GM")}`;
}

export function parseGmdInput(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Math.round(Number(cleaned));
  return Number.isFinite(n) ? n : null;
}
