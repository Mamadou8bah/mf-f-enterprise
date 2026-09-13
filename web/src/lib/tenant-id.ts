export type TenantIdType = "national_id" | "passport";

export function normalizeTenantId(
  idType?: string | null,
  idNumber?: string | null
): { idType: TenantIdType | null; idNumber: string | null } {
  const number = idNumber?.trim() || null;
  if (!number) return { idType: null, idNumber: null };
  const type = idType === "passport" ? "passport" : "national_id";
  return { idType: type, idNumber: number };
}

export function tenantIdLabel(idType?: string | null, idNumber?: string | null) {
  const number = idNumber?.trim();
  if (!number) return null;
  if (idType === "passport") return `Passport ${number}`;
  if (idType === "national_id") return `ID ${number}`;
  return number;
}

export function matchesTenantIdQuery(
  term: string,
  idType?: string | null,
  idNumber?: string | null
) {
  if (!term) return false;
  const compact = term.replace(/\s+/g, "");
  const number = (idNumber || "").toLowerCase();
  const compactNumber = number.replace(/\s+/g, "");
  if (number.includes(term) || (compactNumber && compactNumber.includes(compact))) return true;
  const label = tenantIdLabel(idType, idNumber);
  return label ? label.toLowerCase().includes(term) : false;
}
