/**
 * Import July–Dec 2026 collection ledger into a clean database.
 * Run from apps/web: npx tsx scripts/import-2026-ledger.ts
 */
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "crypto";
import path from "path";

const dbPath = path.join(__dirname, "..", "data", "garawol.db");
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON;");

type Method = "cash" | "transfer" | "cheque" | "other";
type Row = {
  landlord: string;
  property: string;
  area: string | null;
  tenant: string;
  paid: string;
  amount: number;
  details: string;
  shop: string;
  extra?: string;
};

const MONTH: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function lastDay(y: number, m: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
function addDays(date: string, days: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function monthsCovered(start: string, end: string) {
  const s = new Date(start + "T12:00:00Z");
  const next = new Date(end + "T12:00:00Z");
  next.setUTCDate(next.getUTCDate() + 1);
  return Math.max(
    1,
    (next.getUTCFullYear() - s.getUTCFullYear()) * 12 + (next.getUTCMonth() - s.getUTCMonth())
  );
}
function padName(s: string) {
  return s.replace(/\s+/g, " ").trim();
}
function monthNum(token: string) {
  const k = token.toLowerCase().replace(/[^a-z]/g, "");
  for (const [name, n] of Object.entries(MONTH)) {
    if (k.startsWith(name)) return n;
  }
  return null;
}

function parsePaid(raw: string, fallbackYear = 2026): string {
  let s = padName(raw);
  if (!s || /^bank transfer$/i.test(s)) return iso(fallbackYear, 8, 1);
  if (/october 2025/i.test(s)) return "2025-10-01";
  s = s.replace(/augst/i, "August").replace(/^(\d{1,2})(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i, "$1 $2");
  const yearM = s.match(/(20\d{2})/);
  const year = yearM ? Number(yearM[1]) : fallbackYear;

  let dm = s.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)/i);
  if (dm && monthNum(dm[2])) return iso(year, monthNum(dm[2])!, Math.min(Number(dm[1]), lastDay(year, monthNum(dm[2])!)));

  dm = s.match(/([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?/i);
  if (dm && monthNum(dm[1])) return iso(year, monthNum(dm[1])!, Math.min(Number(dm[2]), lastDay(year, monthNum(dm[1])!)));

  const only = s.match(/^([A-Za-z]+)/);
  if (only && monthNum(only[1])) return iso(year, monthNum(only[1])!, 1);

  return iso(fallbackYear, 7, 1);
}

type Span = { start: string; end: string; months: number };

function spanFromMonths(y1: number, m1: number, d1: number | null, y2: number, m2: number, d2: number | null): Span {
  const startD = d1 || 1;
  const start = iso(y1, m1, Math.min(startD, lastDay(y1, m1)));
  let end: string;
  if (d1 && d2 && d1 === d2) {
    end = addDays(iso(y2, m2, Math.min(d2, lastDay(y2, m2))), -1);
  } else if (!d2 && m1 === m2 && y2 > y1) {
    end = addDays(iso(y2, m2, Math.min(d1 || 1, lastDay(y2, m2))), -1);
  } else if (d2 && !d1) {
    end = iso(y2, m2, Math.min(d2, lastDay(y2, m2)));
  } else if (d1 && d2) {
    end = iso(y2, m2, Math.min(d2, lastDay(y2, m2)));
  } else {
    end = iso(y2, m2, lastDay(y2, m2));
  }
  if (end < start) end = iso(y2, m2, lastDay(y2, m2));
  return { start, end, months: monthsCovered(start, end) };
}

function parseCoverage(details: string, paid: string): Span {
  const paidY = Number(paid.slice(0, 4));
  const paidM = Number(paid.slice(5, 7));
  let t = padName(details)
    .replace(/with deposit/i, "")
    .replace(/with previous balance/i, "")
    .replace(/payment of balance/i, "")
    .replace(/deposit/i, "")
    .replace(/balance \d+/i, "")
    .replace(/with \d+ for/i, "to")
    .replace(/\s+/g, " ")
    .trim();

  if (!t || /^deposit$/i.test(t) || /^payment of balance$/i.test(t)) {
    return { start: paid, end: paid, months: 1 };
  }

  const and = t.match(
    new RegExp(
      `^(?:(\\d{1,2})(?:st|nd|rd|th)?\\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)(?:\\s+(20\\d{2}))?\\s*(?:&|and)\\s*(?:(\\d{1,2})(?:st|nd|rd|th)?\\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)(?:\\s+(20\\d{2}))?$`,
      "i"
    )
  );
  if (and) {
    const m1 = monthNum(and[2])!;
    const m2 = monthNum(and[5])!;
    const y2 = and[6] ? Number(and[6]) : and[3] ? Number(and[3]) : paidY;
    const y1 = and[3] ? Number(and[3]) : y2;
    return spanFromMonths(y1, m1, and[1] ? Number(and[1]) : null, y2, m2, and[4] ? Number(and[4]) : null);
  }

  const range = t.match(
    new RegExp(
      `^(?:(\\d{1,2})(?:st|nd|rd|th)?\\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)(?:\\s+(20\\d{2}))?\\s+to\\s+(?:(\\d{1,2})(?:st|nd|rd|th)?\\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)(?:\\s+(20\\d{2}))?$`,
      "i"
    )
  );
  if (range) {
    const m1 = monthNum(range[2])!;
    const m2 = monthNum(range[5])!;
    let y2 = range[6] ? Number(range[6]) : paidY;
    let y1 = range[3] ? Number(range[3]) : y2;
    if (!range[3] && !range[6]) {
      y1 = paidY;
      y2 = m2 < m1 ? paidY + 1 : paidY;
    } else if (!range[3] && range[6]) {
      y1 = m1 > m2 ? y2 - 1 : y2;
      if (m1 === m2) y1 = y2 - 1;
    } else if (range[3] && !range[6]) {
      y2 = m2 < m1 ? y1 + 1 : y1;
    }
    if (y1 === y2 && m2 < m1) y2 = y1 + 1;
    if (y2 < y1) y2 = y1 + 1;
    // "May to July 2027" paid Aug 2026 is almost certainly 2026
    if (y1 > paidY && m1 <= 7 && paidM >= 7) {
      y1 = paidY;
      y2 = m2 < m1 ? paidY + 1 : paidY;
    }
    return spanFromMonths(y1, m1, range[1] ? Number(range[1]) : null, y2, m2, range[4] ? Number(range[4]) : null);
  }

  // "1st August 2026 to July 31st 2027"
  const cross = t.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(20\d{2})\s+to\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(20\d{2})/i
  );
  if (cross) {
    return spanFromMonths(
      Number(cross[3]),
      monthNum(cross[2])!,
      Number(cross[1]),
      Number(cross[6]),
      monthNum(cross[4])!,
      Number(cross[5])
    );
  }

  const single = t.match(
    /^(?:(\d{1,2})(?:st|nd|rd|th)?\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(20\d{2}))?$/i
  );
  if (single && monthNum(single[2])) {
    const y = single[3] ? Number(single[3]) : paidY;
    const m = monthNum(single[2])!;
    const d = single[1] ? Number(single[1]) : 1;
    return spanFromMonths(y, m, single[1] ? d : null, y, m, null);
  }

  return { start: paid, end: paid, months: 1 };
}

function parseMethod(extra?: string): Method {
  const t = (extra || "").toLowerCase();
  if (/cheque/.test(t)) return "cheque";
  if (/\bbank\b|transfer/.test(t)) return "transfer";
  if (/wave|muhammed tunkara|paid to muhammed/.test(t)) return "other";
  return "cash";
}

function remainingBalance(extra?: string, details?: string): number | null {
  const t = `${extra || ""} ${details || ""}`;
  const m = t.match(/balance\s+(\d[\d,]*)/i);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}

function isBalancePayment(details: string) {
  return /payment of balance/i.test(details);
}

function isDepositOnly(details: string) {
  return /^deposit$/i.test(padName(details));
}

function unitType(code: string) {
  const t = code.toLowerCase();
  if (t.includes("apartment")) return "apartment";
  if (t.includes("canteen")) return "canteen";
  if (/^b\d|^c\d|office/.test(t)) return "office";
  return "shop";
}

function propertyType(name: string) {
  if (/plaza/i.test(name)) return "plaza";
  if (/market/i.test(name)) return "market";
  return "mixed";
}

function normalizeCode(shop: string, tenant: string) {
  let code = padName(shop)
    .replace(/^sho\s+/i, "Shop ")
    .replace(/^shop\s+/i, "Shop ");
  if (!code) code = tenant;
  if (/^\d/.test(code)) code = `Shop ${code}`;
  return code;
}

function periodForMonths(n: number): string {
  if (n >= 11) return "yearly";
  if (n >= 6) return "6_months";
  if (n >= 3) return "3_months";
  if (n === 2) return "2_months";
  return "monthly";
}

const ROWS: Row[] = [
  // Tunkara Plaza 2
  ...([
    ["Sarjo Fatty", "2nd July", 8750, "June to August", "Shop 101", "Muhammed Tunkara"],
    ["Ebrima Colley", "2nd July", 11250, "May to July 2026", "Shop 68"],
    ["Isatou Jallow", "2nd July", 11250, "May to July 2026", "Shop 32"],
    ["Bubacarr Bah", "2nd July", 11250, "May to July 2026", "Shop 56"],
    ["Muhammed Ceesay", "2nd July", 11250, "May to July 2026", "Shop 64"],
    ["Aminata Danso", "2nd July", 11250, "May to July 2026", "Shop 22"],
    ["Sarjo Conteh", "2nd July", 32500, "10th July to 10th January 2027", "Shop 49"],
    ["Maimuna Mendy", "6th July", 10000, "March to April 2026", "Shop 80"],
    ["Adama Jallow", "6th July", 11250, "May to July 2026", "Shop 30"],
    ["Fatoumatta Barhoum", "6th July", 11250, "May to July 2026", "Shop 11"],
    ["Sarra Sabally", "6th July", 10000, "April to June 2026", "Shop 79"],
    ["Binta Mendy", "6th July", 11250, "May to July 2026", "Shop 50"],
    ["Fatou Touray", "6th July", 8750, "April to June 2026", "Shop 84"],
    ["Mariama Jaiteh", "6th July", 6250, "March to May 2026", "Canteen"],
    ["Omar Ceesay", "7th July", 15000, "May to July 2026", "Shop 36"],
    ["Mariama Bah", "7th July", 15000, "May to July 2026", "Shop 37"],
    ["Ebrima Colley", "15th July", 11250, "May to July 2026", "Shop 46"],
    ["Kaddijatou Jallow", "15th July", 11250, "May to July 2026", "Shop 48"],
    ["Ndey Kebbeh", "15th July", 11250, "May to July 2026", "Shop 61"],
    ["Amadou A.C. Colley", "15th July", 25000, "February to May 2026", "Shop 38"],
    ["Fatoumata Conteh", "15th July", 20000, "June to November 2026", "Shop 77"],
    ["Lamin Colley", "15th July", 11250, "May to July 2026", "Shop 54"],
    ["Issaga Barry", "22nd July", 11250, "May to July 2026", "Shop 17"],
    ["Fatou Wally", "22nd July", 10000, "May to July 2026", "Shop 97"],
    ["Mama Arizine", "22nd July", 11250, "May to July 2026", "Shop 23"],
    ["Ben Williams", "22nd July", 8750, "May to July 2026", "Shop 104"],
    ["Matarr Ndong", "3rd August", 11250, "May to July 2026", "Shop 52"],
    ["Sainabou Ceesay", "3rd August", 11250, "May to July 2026", "Shop 31"],
    ["Alhagie Foday Jallow", "3rd August", 150000, "August to January 2027", "Shop 2"],
    ["Modou Sallah", "27th July", 30000, "June to August 2026", "Canteen 2"],
    ["Ousman Sallah", "4th August", 11250, "August to October 2026", "Shop 24"],
    ["Sait Touray", "4th August", 11250, "May to July 2026", "Shop 57"],
    ["Amulie Faal", "4th August", 11250, "May to July 2026", "Shop 59"],
    ["Nyimasatou Kanyi", "4th August", 17500, "June to November 2026", "Shop 99"],
    ["Lamin Saine", "6th August", 8750, "July to September 2026", "Shop 87"],
    ["Madi Nget", "6th August", 6000, "May to July 2026", "Canteen 3"],
    ["Lamin Saine", "6th August", 8750, "August to October 2026", "Shop 88"],
    ["Ousman Leigh", "10th August", 25000, "August to January 2027", "Shop 6"],
    ["Jainaba Balojo", "11th August", 11250, "May to July 2026", "Shop 69"],
    ["Mamasa Marega", "11th August", 20000, "June to November 2026", "Shop 90"],
    ["Jainaba Sonko", "18th August", 11250, "August to October 2026", "Shop 51"],
    ["Marie Mendy", "18th August", 11250, "August to October 2026", "Shop 45"],
    ["Muhammed Bangura", "18th August", 11250, "August to October 2026", "Shop 62"],
    ["Mariama Barry", "20th August", 25000, "August to January 2027", "Shop 27"],
    ["Samba Willian", "24th August", 22000, "September to February 2027", "Shop 91"],
    ["Ebrima Kebbeh", "25th August", 150000, "August to January 2027", "Shop 3"],
    ["Aisha Cham Sumbundu", "27th August", 11250, "May to July 2026", "Shop 60"],
    ["Omar Jafuneh", "27th August", 10000, "July to October 2026", "Shop 92"],
    ["Sainabou Secka", "27th August", 11250, "August to October 2026", "Shop 55"],
    ["Binta Jatta", "31st August", 11250, "August to October 2026", "Shop 42", "Paid on office wave"],
    ["Muhammed Ceesay", "1st September", 11250, "August to October 2026", "Shop 64"],
    ["Ebrima Bayo", "1st September", 11250, "5th September to 5th December 2026", "Shop 83"],
    ["Sally Bojang", "2nd September", 11250, "May to July 2026", "Shop 43"],
    ["Jamma Ceesay", "8th September", 10000, "May to July 2026", "Shop 75"],
  ] as [string, string, number, string, string, string?][]).map((r) => ({
    landlord: "Haji Tunkara",
    property: "Tunkara Plaza 2",
    area: "Latrikunda Sabiji Market",
    tenant: r[0],
    paid: r[1],
    amount: r[2],
    details: r[3],
    shop: r[4],
    extra: r[5],
  })),

  // New Building
  ...([
    ["Haji Tunkara", "29th June", 5000, "July 2026", ""],
    ["Malick Sarr", "3rd August", 15000, "August to October 2026", "", "Bank Deposit"],
    ["Isatou Sanneh", "3rd August", 36000, "August to January 2027", ""],
    ["Abdoul Wahab Hydara", "5th August", 15000, "May to July 2026", ""],
    ["Haji Tunkara", "14th August", 10000, "August to September 2026", ""],
  ] as [string, string, number, string, string, string?][]).map((r) => ({
    landlord: "Haji Tunkara",
    property: "Latrikunda New Building",
    area: "Latrikunda",
    tenant: r[0],
    paid: r[1],
    amount: r[2],
    details: r[3],
    shop: r[4],
    extra: r[5],
  })),

  // Plaza 1
  ...([
    ["Haji Kabba", "29th September", 22500, "July to December 2026", "Shop 15"],
    ["Yusupha Saho", "2nd July", 150000, "July to 1st July 2027", "Shop 4"],
    ["Mouhamadou Ndiaye", "6th July", 25000, "15th July to 15th January 2027", "Shop 11"],
    ["Minteh Krubally", "6th July", 7500, "May to June 2026", "Shop 11"],
    ["Omar Jabbi", "7th July", 11250, "April to June 2026", "Shop 48"],
    ["Ebrima Jabbi", "20th July", 22500, "May to October 2026", "Shop 13"],
    ["Alie Juwara", "20th July", 12500, "May to July 2026", "Shop 9"],
    ["Fatou Kinneh & Sona Jarju", "21st July", 15000, "August to January 2027", "Shop 58a"],
    ["Anta Jallow", "23rd July", 11250, "July to September 2026", "Shop 17"],
    ["Habib Jallow", "24th July", 22500, "February to July 2026", "Shop 12"],
    ["Kissima Sillah", "24th July", 150000, "July to June 2027", "Shop 3"],
    ["Chedo Sinnera", "24th July", 7500, "April to June 2026", "Between 9 & 10"],
    ["Yaya Ceesay", "3rd August", 22500, "June to November 2026", "Shop 5"],
    ["Adama Jagne", "3rd August", 37500, "May to July 2026", "Shop 23-26"],
    ["Isatou Krubally", "3rd August", 25000, "August to January 2027", "Shop 42"],
    ["Mariama Jawara", "August", 7500, "February to April 2026", "Corner shop"],
    ["Khadim Secka", "6th August", 26000, "July to December 2026", "Shop 21"],
    ["Lamin Sallah", "10th August", 3750, "June 2026", "Shop 6"],
    ["Ndey Awa Samba", "10th August", 12500, "August to October 2026", "Shop 55"],
    ["Abdoul Sowe", "18th August", 25000, "April to September 2026", "Shop 46-47"],
    ["Prince Empire", "18th August", 12500, "May to June 2026", "Shop 28"],
    ["Fatoumatta Jikineh", "18th August", 22500, "February to July 2026", "Shop 33"],
    ["360pluz pr business", "20th August", 80000, "June to June 2027", "Shop 19-20"],
    ["Muhammed Samba Jallow", "25th August", 11250, "January to March 2026", "Shop 30"],
    ["Haminata Jaiteh", "1st September", 22500, "August to February 2027", "Shop 34"],
    ["Isatou Jabbi", "2nd September", 15000, "July to September 2026", "Shop 39"],
    ["Madi Ceesay", "2nd September", 11250, "March to May 2026", "Shop 57"],
    ["Amadou W. Jallow", "4th September", 10000, "10th July to 10th October 2026", "Shop 32"],
  ] as [string, string, number, string, string][]).map((r) => ({
    landlord: "Haji Tunkara",
    property: "Tunkara Plaza 1",
    area: "Latrikunda",
    tenant: r[0],
    paid: r[1],
    amount: r[2],
    details: r[3],
    shop: r[4],
  })),

  // Tanjeh
  ...([
    ["Abdoulie Jallow", "5th August", 30000, "July to December 2026", "Shop 3"],
    ["Abdoulie Jallow", "5th August", 30000, "September to February 2027", "Shop 11"],
    ["Musa Jatta", "6th August", 15000, "November 2025 to January 2026", "Shop 7"],
    ["Saikou Marong", "7th August", 15000, "March to May 2026", "Shop 4"],
    ["Musa Jatta", "7th August", 10000, "August to September 2025", "Shop 8"],
    ["Mot Jobe", "14th August", 14000, "February to May 2026", "Shop 12"],
    ["Abdoulie Bilo Jallow", "18th August", 30000, "August to January 2027", "Shop 9"],
    ["Musa Jatta", "7th September", 10000, "October to November 2025", "Shop 8"],
    ["Musa Jatta", "8th September", 10000, "February to March 2026", "Shop 7"],
  ] as [string, string, number, string, string][]).map((r) => ({
    landlord: "Haji Fofana",
    property: "Tanjeh",
    area: "Tanjeh",
    tenant: r[0],
    paid: r[1],
    amount: r[2],
    details: r[3],
    shop: r[4],
  })),

  // Tallinding
  ...([
    ["Fatou Fadera", "3rd July", 30000, "June to November 2026", "", undefined],
    ["Kezia Akamalu", "3rd August", 7000, "May to June 2026", ""],
    ["Fatou Bojang", "3rd August", 12000, "July to August 2026", ""],
    ["Mbye Babacarr Guise", "7th September", 18000, "August to October 2026", "", "Paid on wave"],
  ] as [string, string, number, string, string, string?][]).map((r) => ({
    landlord: "Mamasa Fofana",
    property: "Tallinding",
    area: "Tallinding",
    tenant: r[0],
    paid: r[1],
    amount: r[2],
    details: r[3],
    shop: r[4],
    extra: r[5],
  })),

  // Sinchu Alagie
  ...([
    ["Yakuba Camara", "7th July", 130000, "10th July to 10th July 2027", "", "With deposit"],
    ["Abdou Aziz Jallow", "21st July", 130000, "August 2026 to August 2027", "", "With deposit"],
    ["Emeka Kingsley Onyirimba", "31st July", 70000, "August 2026 to February 2027", "", "With deposit"],
    ["Afro Dynasty", "31st July", 60000, "3rd August to 3rd February 2027", ""],
  ] as [string, string, number, string, string, string?][]).map((r) => ({
    landlord: "Haja Fofana",
    property: "Sinchu Alagie",
    area: "Sinchu Alagie",
    tenant: r[0],
    paid: r[1],
    amount: r[2],
    details: r[3],
    shop: r[4],
    extra: r[5],
  })),

  // Sky blue plaza
  ...([
    ["Arciplex office", "20th July", 200000, "15th August to August 2027", "B2"],
    ["Cloud Group", "6th August", 250000, "June to June 2027", "C3"],
    ["SOTRACOM.SA. GAMBIE", "7th August", 350000, "15th August to 15th August 2027", "B1"],
    ["IBRAHIM IMRAN", "7th September", 300000, "1st July 2026 to July 2027", "", "Paid to Muhammed"],
  ] as [string, string, number, string, string, string?][]).map((r) => ({
    landlord: "Haji Tunkara",
    property: "Sky Blue Plaza",
    area: null,
    tenant: r[0],
    paid: r[1],
    amount: r[2],
    details: r[3],
    shop: r[4],
    extra: r[5],
  })),

  {
    landlord: "Siranding Conteh",
    property: "Tabakotoh",
    area: "Tabakotoh",
    tenant: "Moris K. Bargue",
    paid: "3rd September",
    amount: 40000,
    details: "May to August 2026",
    shop: "",
  },
  {
    landlord: "Musa Fofana",
    property: "Jabang",
    area: "Jabang",
    tenant: "Mamadou Bah",
    paid: "4th August",
    amount: 8000,
    details: "May to August 2026",
    shop: "",
  },

  // Momodou Hawa Danso 1
  ...([
    ["Adama Saidykhan", "2nd July", 33000, "June to November 2026", ""],
    ["Numou Touray", "28th July", 16500, "July to September 2026", ""],
    ["Fatoumatta Fatty", "6th August", 16500, "June to August 2026", ""],
    ["Michelle Tamba", "11th August", 16500, "July to September 2026", ""],
    ["Lamin Jaiteh", "August", 16500, "July to September 2026", ""],
    ["Soutay Adade", "27th August", 16500, "July to September 2026", "", "Wave"],
    ["Binta Leigh", "7th September", 14000, "July to September 2026", "", "Balance 2500"],
  ] as [string, string, number, string, string, string?][]).map((r) => ({
    landlord: "Momodou Hawa Danso",
    property: "Momodou Hawa Danso 1",
    area: "Wellingara",
    tenant: r[0],
    paid: r[1],
    amount: r[2],
    details: r[3],
    shop: r[4],
    extra: r[5],
  })),

  // Mariama kunda junction
  ...([
    ["Zahara Al-Amin Cham", "22nd July", 600000, "April 2025 to 1st April 2027", ""],
    ["Musa Sosseh", "23rd July", 3000, "August 2026", ""],
    ["Musa Sosseh", "25th August", 3000, "September 2026", ""],
  ] as [string, string, number, string, string][]).map((r) => ({
    landlord: "Haji Tunkara",
    property: "Mariama Kunda Junction",
    area: "Mariama Kunda Junction",
    tenant: r[0],
    paid: r[1],
    amount: r[2],
    details: r[3],
    shop: r[4],
  })),

  // Aboubacar Fofana
  ...([
    ["Fatoumata Bah", "2nd July", 30000, "June to November 2026", "", undefined],
    ["Ebrima Baldeh", "August", 30000, "July to December 2026", "", "Bank transfer"],
    ["Fatou Bah", "2nd September", 24000, "September to February 2027", ""],
    ["Mot Secka", "7th September", 60000, "June to November 2026", "", "Bank Transfer"],
  ] as [string, string, number, string, string, string?][]).map((r) => ({
    landlord: "Aboubacar Fofana",
    property: "Aboubacar Fofana property",
    area: null,
    tenant: r[0],
    paid: r[1],
    amount: r[2],
    details: r[3],
    shop: r[4],
    extra: r[5],
  })),

  // Ismaila Bagaga Bundung
  ...([
    ["Sering Amadou Sowe", "8th July", 7000, "March to April 2026", "", "Wave"],
    ["Kebba Jagne", "15th July", 4000, "April to May 2026", ""],
    ["Muhammed Bah", "15th July", 10000, "February to March 2026", ""],
    ["Sering Amadou Sowe", "17th August", 3500, "May 2026", "", "Wave"],
    ["Muhammed Bah", "27th August", 10000, "April to May 2026", "", "Wave"],
    ["Sedat Hydara", "8th September", 6000, "June to July 2026", "", "Wave"],
  ] as [string, string, number, string, string, string?][]).map((r) => ({
    landlord: "Ismaila Bagaga",
    property: "Bundung",
    area: "Bundung",
    tenant: r[0],
    paid: r[1],
    amount: r[2],
    details: r[3],
    shop: r[4],
    extra: r[5],
  })),

  // Fatoumata Fofana Yundum
  ...([
    ["Mariama Sumbundu", "10th July", 13500, "July to September 2026", "", "Bank transfer"],
    ["Chinedu Cyriacus Ndukwu", "4th August", 5000, "Deposit", "", "Deposit"],
    ["Fisayo Ogunremi", "5th August", 8000, "October to November 2026", ""],
  ] as [string, string, number, string, string, string?][]).map((r) => ({
    landlord: "Fatoumata Fofana",
    property: "Yundum",
    area: "Yundum",
    tenant: r[0],
    paid: r[1],
    amount: r[2],
    details: r[3],
    shop: r[4],
    extra: r[5],
  })),

  {
    landlord: "Fatou Hawa Ceesay",
    property: "Wellingara",
    area: "Wellingara",
    tenant: "Aboubacarr Cham",
    paid: "8th September",
    amount: 36000,
    details: "July to December 2026",
    shop: "",
    extra: "Wave",
  },

  // Bamba Fofana Old Yundum
  ...([
    ["Cherno Mamud Sowe", "5th August", 27000, "July to December 2026", "Shop"],
    ["Cherno Mamud Sowe", "5th August", 27000, "July to December 2026", "Apartment"],
    ["Fatou Camara", "6th August", 27000, "July to December 2026", ""],
  ] as [string, string, number, string, string][]).map((r) => ({
    landlord: "Bamba Fofana",
    property: "Old Yundum",
    area: "Old Yundum",
    tenant: r[0],
    paid: r[1],
    amount: r[2],
    details: r[3],
    shop: r[4],
  })),

  // Untitled sheet
  ...([
    ["Ebou Dammeh", "9th July", 19500, "July to September 2026"],
    ["Isatou Sowe", "1st July", 30000, "July to December 2026"],
    ["Therease Joof", "29th July", 39000, "August to January 2027"],
    ["Ndey Marget Njie", "29th July", 25000, "September to February 2027"],
    ["Kanneh Faal", "5th July", 25000, "April to September 2026"],
    ["Ndey Sanneh", "10th August", 39000, "September to February 2027"],
    ["Isatou Conteh", "10th August", 6000, "April to September 2026"],
  ] as [string, string, number, string][]).map((r) => ({
    landlord: "Unspecified",
    property: "Unnamed property (ledger sheet)",
    area: null,
    tenant: r[0],
    paid: r[1],
    amount: r[2],
    details: r[3],
    shop: "",
    extra: "No landlord/property header on source sheet",
  })),

  // Churchill's Town
  ...([
    ["Habib Faal", "13th July", 40000, "July to December 2026", "", undefined],
    ["Kutejumble", "13th July", 40000, "July to December 2026", "", "Paid with Cheque"],
    ["Mustapha Joof", "15th July", 40000, "July to December 2026", ""],
    ["Marvis Kriss E Olaosi", "10th August", 40000, "September to February 2027", "", "Bank deposit"],
    ["Mr. Sunny", "1st August", 150000, "1st August 2026 to 31st July 2027", "", "Bank transfer"],
    ["Amos Chinwendu", "7th September", 27000, "July to December 2026", "", "Previous balance"],
  ] as [string, string, number, string, string, string?][]).map((r) => ({
    landlord: "Haji Tunkara",
    property: "Churchill's Town",
    area: "Churchill's Town",
    tenant: r[0],
    paid: r[1],
    amount: r[2],
    details: r[3],
    shop: r[4],
    extra: r[5],
  })),

  // Bundung big building
  ...([
    ["Fatou Manneh", "6th July", 25000, "December 2025 to April 2026", "", undefined],
    ["Amadou Mansaray", "6th July", 7000, "May 2026", "", "Wave"],
    ["Musa Koroma", "21st July", 11000, "April to May 2026", ""],
    ["Amadou Mansaray", "24th July", 14000, "June to September 2026", "", "Wave"],
    ["Stephen Ikechukuwu", "3rd August", 7500, "July to September 2026", "", "Wave"],
    ["Wannie Seelah", "24th August", 20000, "April to July 2026", ""],
    ["Wannie Seelah", "24th August", 10000, "March to July 2026", "", "Wave"],
    ["Fanta Kaloga", "27th August", 10000, "March to April 2026", "", "Wave; March with 4000 for April"],
    ["Amadou Mansaray", "2nd September", 3000, "Payment of balance", "", "Wave"],
    ["Samuel Johnson", "7th September", 10500, "June to August 2026", ""],
  ] as [string, string, number, string, string, string?][]).map((r) => ({
    landlord: "Haji Tunkara",
    property: "Bundung Big Building",
    area: "Bundung",
    tenant: r[0],
    paid: r[1],
    amount: r[2],
    details: r[3],
    shop: r[4],
    extra: r[5],
  })),

  // 5 Junction
  ...([
    ["Bakery Bondi", "July", 600, "May 2026", ""],
    ["Natoma Marring", "11th August", 5000, "April to May 2026", "", "Balance 1000"],
    ["Frera Muhammed", "11th August", 9000, "January to March 2026", ""],
    ["Bakery Bondi", "14th August", 600, "June 2026", "", "Wave"],
  ] as [string, string, number, string, string, string?][]).map((r) => ({
    landlord: "Haja Fofana",
    property: "5 Junction",
    area: "5 Junction",
    tenant: r[0],
    paid: r[1],
    amount: r[2],
    details: r[3],
    shop: r[4],
    extra: r[5],
  })),

  // Latrikunda German Big Building
  ...([
    ["Muhammed Muctarr", "29th June", 40000, "July to December 2026", ""],
    ["Omar Ndow", "2nd July", 5000, "April to May 2026", ""],
    ["Famara Sanyang", "6th July", 19500, "April to June 2026", ""],
    ["Burry Faye", "6th July", 19500, "April to June 2026", ""],
    ["Deepeh Jaiteh", "7th July", 15000, "April to June 2026", ""],
    ["Yusupha Sarjo", "9th July", 18000, "April to June 2026", ""],
    ["Amie Sisay", "13th July", 2500, "April 2026", ""],
    ["Habib Salm", "20th July", 39000, "June to November 2026", ""],
    ["Famara Sanyang", "24th July", 19500, "July to September 2026", ""],
    ["Muhammed Jaw", "27th July", 30000, "November 2025 to April 2026", ""],
    ["Sulayman Keita", "29th July", 30000, "January to June 2026", ""],
    ["Manta Sanneh", "Was paid in October 2025", 25000, "August to December 2025", "", "Muhammed Confirm"],
    ["Amie Sisay", "3rd August", 2500, "May 2026", ""],
    ["Manta Sanneh", "3rd August", 30000, "January to June 2026", "", "Bank transfer"],
    ["Momodou Bilo Bah", "4th August", 6000, "1st May to August 2026", ""],
    ["Abdallah Camara", "4th August", 15000, "February to April 2026", "", "Bank transfer"],
    ["Binta Ndure", "5th August", 19500, "August to October 2026", ""],
    ["Babou Jallow", "7th August", 15000, "May to July 2026", "", "Bank transfer"],
    ["Isatou Jallow", "10th August", 15000, "May to July 2026", ""],
    ["Alpha Bah", "12th August", 2400, "May to June 2026", ""],
    ["Joanna Njie", "17th August", 10000, "May to June 2026", "", "Wave"],
    ["Muritala Ajaikaye", "17th August", 15000, "July to September 2026", ""],
    ["Idrissa John", "17th August", 34000, "September to February 2027", "", "Wave"],
    ["Mustapha Baldeh", "24th August", 40000, "September to February 2027", "", "With deposit"],
    ["Idrissa John", "24th August", 15000, "Payment of balance", ""],
    ["Falu Touray (Muritala)", "24th August", 15000, "July to September 2026", ""],
    ["Haja Fofana", "24th August", 78000, "1st September to 31st July 2027", "", "Ordered by Fofana"],
    ["Joanna Njie", "31st August", 5000, "July 2026", ""],
    ["Rahmond Hindolo Margai", "1st September", 35000, "5th September to February 2027", ""],
    ["Omar Ndow", "7th September", 5000, "June to July 2026", ""],
    ["Babou Jallow", "7th September", 5000, "August 2026", "", "Wave"],
  ] as [string, string, number, string, string, string?][]).map((r) => ({
    landlord: "Haji Tunkara",
    property: "Latrikunda German Big Building",
    area: "Latrikunda",
    tenant: r[0],
    paid: r[1],
    amount: r[2],
    details: r[3],
    shop: r[4],
    extra: r[5],
  })),
];

function nextReceiptNo() {
  const year = 2026;
  const row = db.prepare("SELECT year, last_value FROM receipt_counters WHERE year = ?").get(year) as
    | { year: number; last_value: number }
    | undefined;
  let next = 1;
  if (!row) {
    db.prepare("INSERT INTO receipt_counters (year, last_value) VALUES (?, 1)").run(year);
  } else {
    next = row.last_value + 1;
    db.prepare("UPDATE receipt_counters SET last_value = ? WHERE year = ?").run(next, year);
  }
  return `MFF-${year}-${String(next).padStart(5, "0")}`;
}

function main() {
  const admin = db.prepare("SELECT id FROM staff WHERE email = ?").get("admin@garawol.gm") as
    | { id: string }
    | undefined;
  if (!admin) throw new Error("Admin staff missing — run db:init first");
  const staffId = admin.id;

  const already = db.prepare("SELECT COUNT(*) n FROM payments").get() as { n: number };
  if (already.n > 0) {
    throw new Error(`Database already has ${already.n} payments. Refusing to import again.`);
  }

  const landlords = new Map<string, string>();
  const properties = new Map<string, string>();
  const tenants = new Map<string, string>();
  const units = new Map<string, string>();
  const tenancies = new Map<string, string>();

  function landlordId(name: string) {
    if (landlords.has(name)) return landlords.get(name)!;
    const id = randomUUID();
    db.prepare(`INSERT INTO landlords (id, full_name, is_active) VALUES (?, ?, 1)`).run(id, name);
    landlords.set(name, id);
    return id;
  }

  function propertyId(landlord: string, property: string, area: string | null) {
    const key = `${landlord}::${property}`;
    if (properties.has(key)) return properties.get(key)!;
    const id = randomUUID();
    db.prepare(
      `INSERT INTO properties (id, landlord_id, name, area, type) VALUES (?, ?, ?, ?, ?)`
    ).run(id, landlordId(landlord), property, area, propertyType(property));
    properties.set(key, id);
    return id;
  }

  function tenantId(property: string, name: string) {
    const key = `${property}::${name.toLowerCase()}`;
    if (tenants.has(key)) return tenants.get(key)!;
    const id = randomUUID();
    db.prepare(`INSERT INTO tenants (id, full_name, is_active) VALUES (?, ?, 1)`).run(id, name);
    tenants.set(key, id);
    return id;
  }

  function unitId(propId: string, code: string, asking: number | null) {
    const key = `${propId}::${code.toLowerCase()}`;
    if (units.has(key)) return units.get(key)!;
    const id = randomUUID();
    db.prepare(
      `INSERT INTO units (id, property_id, code, type, status, asking_rent_gmd) VALUES (?, ?, ?, ?, 'vacant', ?)`
    ).run(id, propId, code, unitType(code), asking);
    units.set(key, id);
    return id;
  }

  const prepared = ROWS.map((r) => {
    const paid = parsePaid(r.paid);
    const cov = parseCoverage(r.details, paid);
    const parsed = padName(r.details)
      .replace(/with deposit/i, "")
      .replace(/deposit/i, "")
      .replace(/payment of balance/i, "")
      .replace(/balance \d+/i, "")
      .trim();
    return {
      ...r,
      paid,
      cov,
      method: parseMethod(r.extra),
      coverageFallback: !isDepositOnly(r.details) && !isBalancePayment(r.details) && !parsed,
    };
  }).sort(
    (a, b) =>
      a.property.localeCompare(b.property) ||
      normalizeCode(a.shop, a.tenant).localeCompare(normalizeCode(b.shop, b.tenant)) ||
      a.cov.start.localeCompare(b.cov.start) ||
      a.paid.localeCompare(b.paid) ||
      a.tenant.localeCompare(b.tenant)
  );

  db.exec("BEGIN");
  try {
    let payments = 0;
    const flags: { text: string; reason: string }[] = [];

    for (const r of prepared) {
      const propId = propertyId(r.landlord, r.property, r.area);
      const code = normalizeCode(r.shop, r.tenant);
      const monthly = isDepositOnly(r.details)
        ? null
        : Math.round(r.amount / Math.max(1, r.cov.months));
      const uId = unitId(propId, code, monthly);
      const tId = tenantId(propId, r.tenant);
      const tenKey = `${tId}::${uId}`;

      if (!tenancies.has(tenKey)) {
        const active = db
          .prepare(
            `SELECT t.id FROM tenancy_units tu JOIN tenancies t ON t.id = tu.tenancy_id
             WHERE tu.unit_id = ? AND t.status = 'active'`
          )
          .get(uId) as { id: string } | undefined;
        if (active?.id) {
          db.prepare(
            `UPDATE tenancies SET status = 'ended', notes = TRIM(COALESCE(notes,'') || ' Ended for later occupant'), updated_at = datetime('now') WHERE id = ?`
          ).run(active.id);
        }
        const tenancyId = randomUUID();
        const leftoverOnCreate = remainingBalance(r.extra, r.details);
        const period = isDepositOnly(r.details) ? "monthly" : periodForMonths(r.cov.months);
        const amount = isDepositOnly(r.details)
          ? 0
          : leftoverOnCreate != null
            ? r.amount + leftoverOnCreate
            : r.amount;
        const deposit = isDepositOnly(r.details) ? r.amount : null;
        db.prepare(
          `INSERT INTO tenancies
           (id, tenant_id, amount_gmd, period, start_date, next_due, balance_gmd, deposit_gmd, status, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`
        ).run(
          tenancyId,
          tId,
          amount,
          period,
          r.cov.start,
          r.cov.start,
          remainingBalance(r.extra, r.details) ?? amount,
          deposit,
          r.extra || null
        );
        db.prepare(`INSERT INTO tenancy_units (id, tenancy_id, unit_id) VALUES (?, ?, ?)`).run(
          randomUUID(),
          tenancyId,
          uId
        );
        db.prepare(
          `UPDATE units SET status = 'occupied', asking_rent_gmd = COALESCE(asking_rent_gmd, ?) WHERE id = ?`
        ).run(monthly, uId);
        tenancies.set(tenKey, tenancyId);
      }

      const tenancyId = tenancies.get(tenKey)!;
      const paymentId = randomUUID();
      const receiptId = randomUUID();
      const receiptNo = nextReceiptNo();
      const notes = [r.details, r.extra].filter(Boolean).join(" · ") || null;

      db.prepare(
        `INSERT INTO payments
         (id, tenancy_id, amount_gmd, paid_at, period_start, period_end, method, recorded_by, sync_status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`
      ).run(paymentId, tenancyId, r.amount, r.paid, r.cov.start, r.cov.end, r.method, staffId, notes);

      db.prepare(`INSERT INTO receipts (id, payment_id, receipt_no, status) VALUES (?, ?, ?, 'issued')`).run(
        receiptId,
        paymentId,
        receiptNo
      );

      const ten = db.prepare("SELECT amount_gmd, next_due FROM tenancies WHERE id = ?").get(tenancyId) as {
        amount_gmd: number;
        next_due: string | null;
      };
      const leftover = remainingBalance(r.extra, r.details);
      if (isDepositOnly(r.details)) {
        db.prepare(`UPDATE tenancies SET updated_at = datetime('now') WHERE id = ?`).run(tenancyId);
      } else if (isBalancePayment(r.details)) {
        db.prepare(`UPDATE tenancies SET balance_gmd = 0, updated_at = datetime('now') WHERE id = ?`).run(
          tenancyId
        );
      } else {
        const nextDue = addDays(r.cov.end, 1);
        db.prepare(
          `UPDATE tenancies SET next_due = ?, balance_gmd = ?, updated_at = datetime('now') WHERE id = ?`
        ).run(nextDue, leftover ?? ten.amount_gmd, tenancyId);
      }

      payments++;
      if (r.landlord === "Unspecified") {
        flags.push({
          text: `${r.tenant} — no landlord/property header on source sheet`,
          reason: "needs_review",
        });
      }
      if (r.coverageFallback) {
        flags.push({
          text: `${r.tenant} @ ${r.property}: could not parse coverage "${r.details}"`,
          reason: "needs_review",
        });
      }
    }

    for (const f of flags) {
      db.prepare(
        `INSERT INTO import_flags (id, source_file, raw_text, reason, resolved) VALUES (?, ?, ?, ?, 0)`
      ).run(randomUUID(), "2026 ledger (pasted)", f.text, f.reason);
    }

    db.exec("COMMIT");

    const counts = {
      landlords: (db.prepare("SELECT COUNT(*) n FROM landlords").get() as { n: number }).n,
      properties: (db.prepare("SELECT COUNT(*) n FROM properties").get() as { n: number }).n,
      units: (db.prepare("SELECT COUNT(*) n FROM units").get() as { n: number }).n,
      tenants: (db.prepare("SELECT COUNT(*) n FROM tenants").get() as { n: number }).n,
      tenancies: (db.prepare("SELECT COUNT(*) n FROM tenancies").get() as { n: number }).n,
      payments,
      receipts: (db.prepare("SELECT COUNT(*) n FROM receipts").get() as { n: number }).n,
      flags: flags.length,
    };
    console.log(
      JSON.stringify(
        {
          rows: ROWS.length,
          ...counts,
          sampleCoverage: [
            parseCoverage("May to July 2026", "2026-07-02"),
            parseCoverage("10th July to 10th January 2027", "2026-07-02"),
            parseCoverage("August to January 2027", "2026-07-21"),
            parseCoverage("April 2025 to April 2027", "2026-07-22"),
            parseCoverage("1st August 2026 to 31st July 2027", "2026-08-01"),
            parseCoverage("June to June 2027", "2026-08-06"),
            parseCoverage("March to April 2026", "2026-08-27"),
          ],
        },
        null,
        2
      )
    );
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

main();
db.close();
