export type RentPeriod =
  | "monthly"
  | "2_months"
  | "3_months"
  | "6_months"
  | "yearly";

export type UnitType =
  | "shop"
  | "apartment"
  | "office"
  | "room_parlour"
  | "canteen"
  | "land"
  | "other";

export type UnitStatus =
  | "occupied"
  | "vacant"
  | "family_free"
  | "unknown_rent";

export type PropertyType = "plaza" | "market" | "residential" | "mixed";

export type StaffRole = "admin" | "collector";

export type PaymentMethod = "cash" | "transfer" | "cheque" | "other";

export type ReceiptStatus = "issued" | "void";

export type TenancyStatus = "active" | "ended" | "pending";
