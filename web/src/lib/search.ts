export function matchesQuery(term: string, ...parts: Array<string | number | null | undefined>) {
  if (!term) return true;
  return parts.some((part) => String(part ?? "").toLowerCase().includes(term));
}
