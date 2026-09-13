import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { DatabaseSync } from "node:sqlite";
import { parseRentBlob, type RentPeriod, type UnitType } from "@garawol/shared";

function extractDocxText(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return extractDocumentXml(buf);
}

function extractDocumentXml(buf: Buffer): string {
  let offset = 0;
  while (offset < buf.length - 4) {
    if (buf.readUInt32LE(offset) !== 0x04034b50) {
      offset++;
      continue;
    }
    const compMethod = buf.readUInt16LE(offset + 8);
    const compSize = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const name = buf.slice(offset + 30, offset + 30 + nameLen).toString("utf8");
    const dataStart = offset + 30 + nameLen + extraLen;
    const data = buf.slice(dataStart, dataStart + compSize);
    offset = dataStart + compSize;
    if (name !== "word/document.xml") continue;
    let xml: Buffer;
    if (compMethod === 0) xml = data;
    else if (compMethod === 8) {
      const zlib = require("zlib") as typeof import("zlib");
      xml = zlib.inflateRawSync(data);
    } else {
      throw new Error(`Unsupported compression ${compMethod}`);
    }
    return xmlToText(xml.toString("utf8"));
  }
  throw new Error("word/document.xml not found");
}

function xmlToText(xml: string): string {
  return xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:tab[^/]*\/>/g, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

function guessUnitType(code: string, blob: string): UnitType {
  const t = `${code} ${blob}`.toLowerCase();
  if (t.includes("canteen")) return "canteen";
  if (t.includes("shop")) return "shop";
  if (t.includes("office")) return "office";
  if (t.includes("room") && t.includes("palor")) return "room_parlour";
  if (t.includes("land")) return "land";
  if (t.includes("apartment") || t.includes("apartmen")) return "apartment";
  return "shop";
}

function parseUnitCodes(raw: string): string[] {
  const t = raw.replace(/\s+/g, " ").trim();
  if (!t) return ["UNIT"];
  const range = t.match(/(\d+)\s*(?:to|-|–|&|and)\s*(\d+)/i);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    if (b >= a && b - a < 20) {
      return Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
    }
  }
  const shops = t.match(/shops?\s*([\d\s,&and]+)/i);
  if (shops) {
    return shops[1]
      .split(/[,&]|and/i)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const m = t.match(/(shop|apartment|office|room|canteen|staircase|unit)?\s*([A-Za-z]?\d+)/i);
  if (m) return [`${(m[1] || "Unit").replace(/\s/g, "")} ${m[2]}`.trim()];
  return [t.slice(0, 40)];
}

function extractLandlord(text: string, fallback: string): string {
  const m =
    text.match(/NAME OF LANDLORD[;:]?\s*([^\n]+)/i) ||
    text.match(/NAME OF LANDLADY[;:]?\s*([^\n]+)/i) ||
    text.match(/LANDLORD[;:]?\s*([^\n]+)/i) ||
    text.match(/OWNER OF BUILDING\s+([^\n]+)/i);
  if (!m) return fallback;
  return m[1].replace(/\s+/g, " ").trim().slice(0, 80) || fallback;
}

function extractPropertyName(text: string, fileBase: string): string {
  const m =
    text.match(/NAME\/?\s*LOCATION OF PROPERT[^\n;]*[;:]?\s*([^\n]+)/i) ||
    text.match(/NAME OF PROPERT[^\n;]*[;:]?\s*([^\n]+)/i) ||
    text.match(/NAME OF BUILDING\s+([^\n]+)/i);
  if (m) return m[1].replace(/\s+/g, " ").trim().slice(0, 100);
  return fileBase;
}

type ParsedRow = {
  tenantName: string;
  phone: string | null;
  unitRaw: string;
  amountRaw: string;
  flag?: string;
};

function parseRows(text: string): ParsedRow[] {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter(
      (l) =>
        !/^(TENANT|CONTACT|AMOUNT|NAMES OF|SHOP NUMBER|PRICE|YEARLY|NAME OF)/i.test(l)
    );

  const rows: ParsedRow[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const rent = parseRentBlob(line);
    const looksAmount =
      rent.amount != null ||
      /^\d[\d,\s]*$/.test(line.replace(/[D]/g, "")) ||
      /@\s*\d/i.test(line) ||
      /monthly|yearly|month/i.test(line);

    if (!looksAmount || /LANDLORD|PROPERTY|LOCATION/i.test(line)) continue;

    let tenantName = "";
    let phone: string | null = null;
    let unitRaw = "";
    for (let j = i - 1; j >= Math.max(0, i - 6); j--) {
      const prev = lines[j];
      if (prev.replace(/\D/g, "").length >= 7 && /\d{6,}/.test(prev)) {
        phone = prev.match(/(\+?\d[\d\s\/,]{6,}\d)/)?.[1] || phone;
        continue;
      }
      if (/shop|apartment|office|room|canteen|staircase|unit|empty/i.test(prev) && prev.length < 60) {
        unitRaw = unitRaw || prev;
        continue;
      }
      if (
        /[A-Za-z]{2,}/.test(prev) &&
        !/CONTACT|AMOUNT|TENANT|LANDLORD|PROPERTY/i.test(prev) &&
        prev.length < 80
      ) {
        tenantName = prev;
        break;
      }
    }
    for (let j = i + 1; j <= Math.min(lines.length - 1, i + 3); j++) {
      if (/shop|apartment|office|room|canteen|staircase|empty/i.test(lines[j])) {
        unitRaw = unitRaw || lines[j];
        break;
      }
    }
    if (!tenantName && /empty/i.test(unitRaw + line)) tenantName = "EMPTY";
    if (!tenantName) continue;

    let flag: string | undefined;
    if (/empty/i.test(tenantName + unitRaw)) flag = "empty";
    if (/no contact|no idea|family/i.test(lines.slice(Math.max(0, i - 3), i + 3).join(" "))) {
      flag = flag || "needs_review";
    }
    if (rent.confidence === "low") flag = flag || "unknown_rent";

    rows.push({
      tenantName: tenantName.replace(/\s+/g, " ").trim(),
      phone,
      unitRaw: unitRaw || `Unit ${rows.length + 1}`,
      amountRaw: line,
      flag,
    });
  }
  return rows;
}

function guessArea(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("latrikunda") || n.includes("sabiji")) return "Latrikunda";
  if (n.includes("bundung")) return "Bundung";
  if (n.includes("kotu")) return "Kotu";
  if (n.includes("jes")) return "Jeshwang";
  if (n.includes("pipeline") || n.includes("mariama")) return "Pipeline";
  if (n.includes("tranq") || n.includes("bamba")) return "Tranquil";
  if (n.includes("yundum") || n.includes("indian") || n.includes("fatoumata")) return "Yundum";
  if (n.includes("churchill")) return "Churchill's Town";
  if (n.includes("tanjeh")) return "Tanjeh";
  if (n.includes("tallinding")) return "Tallinding";
  if (n.includes("dippa")) return "Dippa Kunda";
  if (n.includes("sky")) return "Sky Blue";
  if (n.includes("city plaza")) return "City Plaza";
  if (n.includes("sinchu") || n.includes("sunchu") || n.includes("5 junction")) return "Sinchu Alagie";
  if (n.includes("kunkujang")) return "Kunkujang";
  if (n.includes("brusub") || n.includes("brusibi")) return "Brusubi";
  if (n.includes("wellingara")) return "Wellingara";
  return "";
}

function guessType(name: string): "plaza" | "market" | "residential" | "mixed" {
  const n = name.toLowerCase();
  if (n.includes("market") || n.includes("sabiji")) return "market";
  if (n.includes("plaza")) return "plaza";
  if (n.includes("apartment") || n.includes("house")) return "residential";
  return "mixed";
}

export function runImport(docsDir: string, dbPath: string) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");

  const files = fs.readdirSync(docsDir).filter((f) => f.toLowerCase().endsWith(".docx"));
  const insertLandlord = db.prepare(
    `INSERT INTO landlords (id, full_name, is_active) VALUES (?, ?, 1)`
  );
  const findLandlord = db.prepare(`SELECT id FROM landlords WHERE lower(full_name) = lower(?)`);
  const insertProperty = db.prepare(
    `INSERT INTO properties (id, landlord_id, name, area, type, is_favorite) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const findProperty = db.prepare(`SELECT id FROM properties WHERE lower(name) = lower(?)`);
  const insertUnit = db.prepare(
    `INSERT INTO units (id, property_id, code, type, status, asking_rent_gmd) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const findUnit = db.prepare(`SELECT id FROM units WHERE property_id = ? AND code = ?`);
  const insertTenant = db.prepare(
    `INSERT INTO tenants (id, full_name, phone, is_active) VALUES (?, ?, ?, 1)`
  );
  const insertTenancy = db.prepare(
    `INSERT INTO tenancies (id, tenant_id, amount_gmd, period, next_due, balance_gmd, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`
  );
  const insertTU = db.prepare(
    `INSERT INTO tenancy_units (id, tenancy_id, unit_id) VALUES (?, ?, ?)`
  );
  const insertFlag = db.prepare(
    `INSERT INTO import_flags (id, source_file, raw_text, reason, resolved, tenancy_id, unit_id)
     VALUES (?, ?, ?, ?, 0, ?, ?)`
  );

  const landlordCache = new Map<string, string>();
  let unitsCreated = 0;
  let tenanciesCreated = 0;
  let flagsCreated = 0;
  const favorites = ["sabiji", "tunkara plaza", "latrikunda german", "latrikunda big"];

  for (const file of files) {
    const full = path.join(docsDir, file);
    let text = "";
    try {
      text = extractDocxText(full);
    } catch (e) {
      insertFlag.run(randomUUID(), file, String(e), "parse_error", null, null);
      flagsCreated++;
      continue;
    }

    const base = file.replace(/\.docx$/i, "");
    const landlordName = extractLandlord(text, "Unknown Owner");
    let landlordId = landlordCache.get(landlordName.toLowerCase());
    if (!landlordId) {
      const existing = findLandlord.get(landlordName) as { id: string } | undefined;
      if (existing) landlordId = existing.id;
      else {
        landlordId = randomUUID();
        insertLandlord.run(landlordId, landlordName);
      }
      landlordCache.set(landlordName.toLowerCase(), landlordId);
    }

    const chunks = text.split(
      /(?=NAME OF LANDLORD|Name of Landlord|NAME\/ LOCATION OF PROPERTY|Brusibi turntable)/i
    );
    const parts = chunks.length > 1 ? chunks : [text];

    for (const part of parts) {
      const propName = extractPropertyName(part, base);
      if (propName.length < 2) continue;
      let propertyId = (findProperty.get(propName) as { id: string } | undefined)?.id;
      if (!propertyId) {
        propertyId = randomUUID();
        const fav = favorites.some(
          (f) => propName.toLowerCase().includes(f) || base.toLowerCase().includes(f)
        )
          ? 1
          : 0;
        insertProperty.run(
          propertyId,
          landlordId,
          propName,
          guessArea(propName + " " + base),
          guessType(propName + " " + base),
          fav
        );
      }

      const rows = parseRows(part);
      for (const row of rows) {
        const rent = parseRentBlob(row.amountRaw);
        const codes = parseUnitCodes(row.unitRaw);
        const isEmpty = /empty/i.test(row.tenantName) || row.flag === "empty";
        const isFamily = /family/i.test(row.tenantName + (row.flag || ""));
        const unitIds: string[] = [];

        for (const code of codes) {
          let unitId = (findUnit.get(propertyId, code) as { id: string } | undefined)?.id;
          if (!unitId) {
            unitId = randomUUID();
            const status = isEmpty
              ? "vacant"
              : isFamily
                ? "family_free"
                : rent.amount == null
                  ? "unknown_rent"
                  : "occupied";
            insertUnit.run(
              unitId,
              propertyId,
              code,
              guessUnitType(code, row.unitRaw),
              status,
              rent.amount
            );
            unitsCreated++;
          }
          unitIds.push(unitId);
        }

        if (isEmpty) {
          if (row.flag) {
            insertFlag.run(randomUUID(), file, row.amountRaw, row.flag, null, unitIds[0]);
            flagsCreated++;
          }
          continue;
        }

        const tenantId = randomUUID();
        insertTenant.run(tenantId, row.tenantName, row.phone);

        const period = (rent.period || "monthly") as RentPeriod;
        const amount = rent.amount || 0;
        const nextDue = new Date();
        nextDue.setDate(1);
        const tenancyId = randomUUID();
        insertTenancy.run(
          tenancyId,
          tenantId,
          amount,
          period,
          nextDue.toISOString().slice(0, 10),
          amount,
          row.flag || null
        );
        tenanciesCreated++;
        for (const uid of unitIds) {
          try {
            insertTU.run(randomUUID(), tenancyId, uid);
          } catch {
            /* unique */
          }
        }
        if (row.flag || rent.confidence === "low" || !row.phone) {
          insertFlag.run(
            randomUUID(),
            file,
            `${row.tenantName} | ${row.unitRaw} | ${row.amountRaw}`,
            row.flag || (!row.phone ? "no_phone" : "unknown_rent"),
            tenancyId,
            unitIds[0]
          );
          flagsCreated++;
        }
      }
    }
  }

  return { files: files.length, unitsCreated, tenanciesCreated, flagsCreated, dbPath };
}
