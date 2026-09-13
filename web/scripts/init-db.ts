import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const dbPath = path.join(__dirname, "..", "data", "garawol.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'collector',
  is_active INTEGER NOT NULL DEFAULT 1,
  property_scope TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS landlords (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  display_title TEXT,
  phone TEXT,
  phone_secondary TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_no TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  landlord_id TEXT NOT NULL REFERENCES landlords(id),
  name TEXT NOT NULL,
  area TEXT,
  address TEXT,
  type TEXT NOT NULL DEFAULT 'mixed',
  notes TEXT,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id),
  code TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'shop',
  status TEXT NOT NULL DEFAULT 'vacant',
  asking_rent_gmd INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS units_property_code ON units(property_id, code);

CREATE TABLE IF NOT EXISTS unit_photos (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES units(id),
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  phone_secondary TEXT,
  id_type TEXT,
  id_number TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tenancies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  amount_gmd INTEGER NOT NULL DEFAULT 0,
  period TEXT NOT NULL DEFAULT 'monthly',
  start_date TEXT,
  next_due TEXT,
  balance_gmd INTEGER NOT NULL DEFAULT 0,
  deposit_gmd INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tenancy_units (
  id TEXT PRIMARY KEY,
  tenancy_id TEXT NOT NULL REFERENCES tenancies(id),
  unit_id TEXT NOT NULL REFERENCES units(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS tenancy_unit_unique ON tenancy_units(tenancy_id, unit_id);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  tenancy_id TEXT NOT NULL REFERENCES tenancies(id),
  amount_gmd INTEGER NOT NULL,
  paid_at TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'cash',
  recorded_by TEXT NOT NULL REFERENCES staff(id),
  sync_status TEXT NOT NULL DEFAULT 'synced',
  local_receipt_no TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL UNIQUE REFERENCES payments(id),
  receipt_no TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'issued',
  voided_at TEXT,
  voided_by TEXT REFERENCES staff(id),
  void_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS receipt_counters (
  year INTEGER PRIMARY KEY,
  last_value INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  staff_id TEXT REFERENCES staff(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS import_flags (
  id TEXT PRIMARY KEY,
  source_file TEXT NOT NULL,
  raw_text TEXT,
  reason TEXT NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  tenancy_id TEXT REFERENCES tenancies(id),
  unit_id TEXT REFERENCES units(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payment_requests (
  id TEXT PRIMARY KEY,
  tenancy_id TEXT NOT NULL REFERENCES tenancies(id),
  amount_gmd INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  external_ref TEXT,
  link_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS office_settings (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  company_short TEXT NOT NULL,
  tagline TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  receipt_prefix TEXT NOT NULL,
  receipt_footer TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

const existing = db.prepare("SELECT id FROM staff WHERE email = ?").get("admin@garawol.gm");
if (!existing) {
  const hash = bcrypt.hashSync("garawol123", 10);
  db.prepare(
    `INSERT INTO staff (id, full_name, phone, email, password_hash, role, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`
  ).run(randomUUID(), "Business Owner", "7000000", "admin@garawol.gm", hash, "admin");
  console.log("Created owner admin@garawol.gm / garawol123");
} else {
  db.prepare(`UPDATE staff SET full_name = ? WHERE email = ?`).run(
    "Business Owner",
    "admin@garawol.gm"
  );
  console.log("Owner account already exists");
}

const secretary = db.prepare("SELECT id FROM staff WHERE email = ?").get("secretary@garawol.gm");
if (!secretary) {
  const hash = bcrypt.hashSync("garawol123", 10);
  db.prepare(
    `INSERT INTO staff (id, full_name, phone, email, password_hash, role, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`
  ).run(randomUUID(), "Secretary", "7000001", "secretary@garawol.gm", hash, "collector");
  console.log("Created secretary@garawol.gm / garawol123");
} else {
  console.log("Secretary account already exists");
}

try {
  db.exec("ALTER TABLE tenants ADD COLUMN id_type TEXT");
} catch {
  /* already present */
}
try {
  db.exec("ALTER TABLE tenants ADD COLUMN id_number TEXT");
} catch {
  /* already present */
}

const office = db.prepare("SELECT id FROM office_settings WHERE id = 'office'").get();
if (!office) {
  db.prepare(
    `INSERT INTO office_settings (
      id, company_name, company_short, tagline, phone, email, address, receipt_prefix, receipt_footer
    ) VALUES ('office', 'MF & F Enterprise', 'MF & F', 'Property & rent management', '', '', '', 'MFF', 'Thank you')`
  ).run();
}

console.log("DB ready at", dbPath);
