/** Internal role codes stored in DB */
export type StaffRole = "admin" | "collector";

/** Client-facing labels: Owner (business) + Secretary (desk) */
export function roleLabel(role: string | null | undefined): string {
  if (role === "admin") return "Owner";
  if (role === "collector") return "Secretary";
  return role || "Staff";
}

export function isOwnerRole(role: string | null | undefined): boolean {
  return role === "admin";
}

/** Name plus office role, for receipts and payment history. */
export function recorderLabel(name: string | null | undefined, role: string | null | undefined) {
  const who = (name || "Staff").trim() || "Staff";
  return `${who} · ${roleLabel(role)}`;
}
