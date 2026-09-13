export const COMPANY_NAME = "MF & F Enterprise";
export const COMPANY_SHORT = "MF & F";
export const RECEIPT_PREFIX = "MFF";
export const COMPANY_TAGLINE = "Property & rent management";
export const RECEIPT_FOOTER = "Thank you";

export type OfficeSettings = {
  companyName: string;
  companyShort: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  receiptPrefix: string;
  receiptFooter: string;
};

export const DEFAULT_OFFICE: OfficeSettings = {
  companyName: COMPANY_NAME,
  companyShort: COMPANY_SHORT,
  tagline: COMPANY_TAGLINE,
  phone: "",
  email: "",
  address: "",
  receiptPrefix: RECEIPT_PREFIX,
  receiptFooter: RECEIPT_FOOTER,
};
