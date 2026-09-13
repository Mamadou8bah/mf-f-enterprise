/**
 * One-shot: wipe Neon business data and load from web/data/garawol.db (SQLite).
 * Run from web/: npx tsx scripts/migrate-sqlite-to-neon.ts
 */
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { prisma } from "@garawol/db";

const sqlitePath = path.join(__dirname, "..", "data", "garawol.db");

function bool(v: unknown) {
  return v === 1 || v === true || v === "1";
}

function dt(v: unknown): Date {
  if (v == null || v === "") return new Date();
  if (v instanceof Date) return v;
  const s = String(v).trim().replace(" ", "T");
  const d = new Date(s.includes("T") ? s : `${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function dtOrNull(v: unknown): Date | null {
  if (v == null || v === "") return null;
  return dt(v);
}

async function wipeNeon() {
  // FK-safe delete order
  await prisma.paymentRequest.deleteMany();
  await prisma.importFlag.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.tenancyUnit.deleteMany();
  await prisma.tenancy.deleteMany();
  await prisma.unitPhoto.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.property.deleteMany();
  await prisma.landlord.deleteMany();
  await prisma.receiptCounter.deleteMany();
  await prisma.syncMeta.deleteMany();
  await prisma.staff.deleteMany();
  // keep office row shape; overwrite from SQLite below
  await prisma.officeSettings.deleteMany();
}

async function main() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("USER:PASSWORD")) {
    throw new Error("Set DATABASE_URL (Neon) before running this script.");
  }

  const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
  console.log("Source:", sqlitePath);

  await wipeNeon();
  console.log("Wiped Neon business tables.");

  const staff = sqlite.prepare("SELECT * FROM staff").all() as Record<string, unknown>[];
  await prisma.staff.createMany({
    data: staff.map((r) => ({
      id: String(r.id),
      fullName: String(r.full_name),
      phone: r.phone != null ? String(r.phone) : null,
      email: String(r.email),
      passwordHash: String(r.password_hash),
      role: String(r.role || "collector"),
      isActive: bool(r.is_active),
      propertyScope: r.property_scope != null ? String(r.property_scope) : null,
      createdAt: dt(r.created_at),
      updatedAt: dt(r.updated_at),
    })),
  });
  console.log("staff", staff.length);

  const landlords = sqlite.prepare("SELECT * FROM landlords").all() as Record<string, unknown>[];
  await prisma.landlord.createMany({
    data: landlords.map((r) => ({
      id: String(r.id),
      fullName: String(r.full_name),
      displayTitle: r.display_title != null ? String(r.display_title) : null,
      phone: r.phone != null ? String(r.phone) : null,
      phoneSecondary: r.phone_secondary != null ? String(r.phone_secondary) : null,
      email: r.email != null ? String(r.email) : null,
      address: r.address != null ? String(r.address) : null,
      notes: r.notes != null ? String(r.notes) : null,
      bankName: r.bank_name != null ? String(r.bank_name) : null,
      bankAccountName: r.bank_account_name != null ? String(r.bank_account_name) : null,
      bankAccountNo: r.bank_account_no != null ? String(r.bank_account_no) : null,
      isActive: bool(r.is_active),
      createdAt: dt(r.created_at),
      updatedAt: dt(r.updated_at),
    })),
  });
  console.log("landlords", landlords.length);

  const properties = sqlite.prepare("SELECT * FROM properties").all() as Record<string, unknown>[];
  await prisma.property.createMany({
    data: properties.map((r) => ({
      id: String(r.id),
      landlordId: String(r.landlord_id),
      name: String(r.name),
      area: r.area != null ? String(r.area) : null,
      address: r.address != null ? String(r.address) : null,
      type: String(r.type || "mixed"),
      notes: r.notes != null ? String(r.notes) : null,
      isFavorite: bool(r.is_favorite),
      createdAt: dt(r.created_at),
      updatedAt: dt(r.updated_at),
    })),
  });
  console.log("properties", properties.length);

  const units = sqlite.prepare("SELECT * FROM units").all() as Record<string, unknown>[];
  await prisma.unit.createMany({
    data: units.map((r) => ({
      id: String(r.id),
      propertyId: String(r.property_id),
      code: String(r.code),
      type: String(r.type || "shop"),
      status: String(r.status || "vacant"),
      askingRentGmd: r.asking_rent_gmd != null ? Number(r.asking_rent_gmd) : null,
      notes: r.notes != null ? String(r.notes) : null,
      createdAt: dt(r.created_at),
      updatedAt: dt(r.updated_at),
    })),
  });
  console.log("units", units.length);

  const photos = sqlite.prepare("SELECT * FROM unit_photos").all() as Record<string, unknown>[];
  if (photos.length) {
    await prisma.unitPhoto.createMany({
      data: photos.map((r) => ({
        id: String(r.id),
        unitId: String(r.unit_id),
        url: String(r.url),
        sortOrder: Number(r.sort_order || 0),
        createdAt: dt(r.created_at),
        updatedAt: dt(r.updated_at),
      })),
    });
  }
  console.log("unit_photos", photos.length);

  const tenants = sqlite.prepare("SELECT * FROM tenants").all() as Record<string, unknown>[];
  await prisma.tenant.createMany({
    data: tenants.map((r) => ({
      id: String(r.id),
      fullName: String(r.full_name),
      phone: r.phone != null ? String(r.phone) : null,
      phoneSecondary: r.phone_secondary != null ? String(r.phone_secondary) : null,
      idType: r.id_type != null ? String(r.id_type) : null,
      idNumber: r.id_number != null ? String(r.id_number) : null,
      notes: r.notes != null ? String(r.notes) : null,
      isActive: bool(r.is_active),
      createdAt: dt(r.created_at),
      updatedAt: dt(r.updated_at),
    })),
  });
  console.log("tenants", tenants.length);

  const tenancies = sqlite.prepare("SELECT * FROM tenancies").all() as Record<string, unknown>[];
  await prisma.tenancy.createMany({
    data: tenancies.map((r) => ({
      id: String(r.id),
      tenantId: String(r.tenant_id),
      amountGmd: Number(r.amount_gmd || 0),
      period: String(r.period || "monthly"),
      startDate: r.start_date != null ? String(r.start_date) : null,
      nextDue: r.next_due != null ? String(r.next_due) : null,
      balanceGmd: Number(r.balance_gmd || 0),
      depositGmd: r.deposit_gmd != null ? Number(r.deposit_gmd) : null,
      status: String(r.status || "active"),
      notes: r.notes != null ? String(r.notes) : null,
      createdAt: dt(r.created_at),
      updatedAt: dt(r.updated_at),
    })),
  });
  console.log("tenancies", tenancies.length);

  const links = sqlite.prepare("SELECT * FROM tenancy_units").all() as Record<string, unknown>[];
  await prisma.tenancyUnit.createMany({
    data: links.map((r) => ({
      id: String(r.id),
      tenancyId: String(r.tenancy_id),
      unitId: String(r.unit_id),
    })),
  });
  console.log("tenancy_units", links.length);

  const payments = sqlite.prepare("SELECT * FROM payments").all() as Record<string, unknown>[];
  await prisma.payment.createMany({
    data: payments.map((r) => ({
      id: String(r.id),
      tenancyId: String(r.tenancy_id),
      amountGmd: Number(r.amount_gmd),
      paidAt: String(r.paid_at),
      periodStart: String(r.period_start),
      periodEnd: String(r.period_end),
      method: String(r.method || "cash"),
      recordedById: String(r.recorded_by),
      syncStatus: String(r.sync_status || "synced"),
      localReceiptNo: r.local_receipt_no != null ? String(r.local_receipt_no) : null,
      notes: r.notes != null ? String(r.notes) : null,
      createdAt: dt(r.created_at),
      updatedAt: dt(r.updated_at),
    })),
  });
  console.log("payments", payments.length);

  const receipts = sqlite.prepare("SELECT * FROM receipts").all() as Record<string, unknown>[];
  await prisma.receipt.createMany({
    data: receipts.map((r) => ({
      id: String(r.id),
      paymentId: String(r.payment_id),
      receiptNo: String(r.receipt_no),
      status: String(r.status || "issued"),
      voidedAt: dtOrNull(r.voided_at),
      voidedById: r.voided_by != null ? String(r.voided_by) : null,
      voidReason: r.void_reason != null ? String(r.void_reason) : null,
      createdAt: dt(r.created_at),
      updatedAt: dt(r.updated_at),
    })),
  });
  console.log("receipts", receipts.length);

  const counters = sqlite.prepare("SELECT * FROM receipt_counters").all() as Record<string, unknown>[];
  if (counters.length) {
    await prisma.receiptCounter.createMany({
      data: counters.map((r) => ({
        year: Number(r.year),
        lastValue: Number(r.last_value || 0),
      })),
    });
  }
  console.log("receipt_counters", counters.length);

  const office = sqlite.prepare("SELECT * FROM office_settings").all() as Record<string, unknown>[];
  for (const r of office) {
    await prisma.officeSettings.create({
      data: {
        id: String(r.id),
        companyName: String(r.company_name),
        companyShort: String(r.company_short),
        tagline: r.tagline != null ? String(r.tagline) : null,
        phone: r.phone != null ? String(r.phone) : null,
        email: r.email != null ? String(r.email) : null,
        address: r.address != null ? String(r.address) : null,
        receiptPrefix: String(r.receipt_prefix || "MFF"),
        receiptFooter: r.receipt_footer != null ? String(r.receipt_footer) : null,
        updatedAt: dt(r.updated_at),
      },
    });
  }
  console.log("office_settings", office.length);

  const audits = sqlite.prepare("SELECT * FROM audit_logs").all() as Record<string, unknown>[];
  if (audits.length) {
    await prisma.auditLog.createMany({
      data: audits.map((r) => ({
        id: String(r.id),
        staffId: r.staff_id != null ? String(r.staff_id) : null,
        action: String(r.action),
        entityType: String(r.entity_type),
        entityId: String(r.entity_id),
        detail: r.detail != null ? String(r.detail) : null,
        createdAt: dt(r.created_at),
      })),
    });
  }
  console.log("audit_logs", audits.length);

  const flags = sqlite.prepare("SELECT * FROM import_flags").all() as Record<string, unknown>[];
  if (flags.length) {
    await prisma.importFlag.createMany({
      data: flags.map((r) => ({
        id: String(r.id),
        sourceFile: String(r.source_file),
        rawText: r.raw_text != null ? String(r.raw_text) : null,
        reason: String(r.reason),
        resolved: bool(r.resolved),
        tenancyId: r.tenancy_id != null ? String(r.tenancy_id) : null,
        unitId: r.unit_id != null ? String(r.unit_id) : null,
        createdAt: dt(r.created_at),
        updatedAt: dt(r.updated_at),
      })),
    });
  }
  console.log("import_flags", flags.length);

  const counts = {
    landlords: await prisma.landlord.count(),
    properties: await prisma.property.count(),
    units: await prisma.unit.count(),
    tenants: await prisma.tenant.count(),
    tenancies: await prisma.tenancy.count(),
    payments: await prisma.payment.count(),
    receipts: await prisma.receipt.count(),
  };
  console.log("Neon totals:", counts);
  console.log("Done. Smoke data replaced with SQLite portfolio.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
