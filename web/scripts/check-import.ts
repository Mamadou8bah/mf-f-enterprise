import { DatabaseSync } from "node:sqlite";
import path from "path";

const db = new DatabaseSync(path.join(__dirname, "..", "data", "garawol.db"));

const z = db
  .prepare(
    `SELECT tn.full_name, p.paid_at, p.amount_gmd, p.period_start, p.period_end, t.next_due
     FROM payments p JOIN tenancies t ON t.id=p.tenancy_id JOIN tenants tn ON tn.id=t.tenant_id
     WHERE tn.full_name LIKE 'Zahara%'`
  )
  .get();
console.log("zahara", z);

db.prepare(
  `UPDATE payments SET period_end='2027-03-31' WHERE id IN (
    SELECT p.id FROM payments p JOIN tenancies t ON t.id=p.tenancy_id JOIN tenants tn ON tn.id=t.tenant_id
    WHERE tn.full_name LIKE 'Zahara%' AND p.amount_gmd=600000)`
).run();
db.prepare(
  `UPDATE tenancies SET next_due='2027-04-01' WHERE id IN (
    SELECT t.id FROM tenancies t JOIN tenants tn ON tn.id=t.tenant_id WHERE tn.full_name LIKE 'Zahara%')`
).run();

const tot = db.prepare("SELECT COUNT(*) n, SUM(amount_gmd) s FROM payments").get();
console.log("payments", tot);

const byProp = db
  .prepare(
    `SELECT pr.name, COUNT(*) n, SUM(p.amount_gmd) s
     FROM payments p JOIN tenancies t ON t.id=p.tenancy_id JOIN tenancy_units tu ON tu.tenancy_id=t.id
     JOIN units u ON u.id=tu.unit_id JOIN properties pr ON pr.id=u.property_id
     GROUP BY pr.name ORDER BY pr.name`
  )
  .all() as { name: string; n: number; s: number }[];
for (const r of byProp) console.log(`${r.n}\t${r.s}\t${r.name}`);

console.log(
  "flags",
  db.prepare("SELECT raw_text FROM import_flags").all()
);

const shop11 = db
  .prepare(
    `SELECT tn.full_name, t.status, t.start_date, t.next_due, u.code, pr.name
     FROM tenancies t JOIN tenants tn ON tn.id=t.tenant_id JOIN tenancy_units tu ON tu.tenancy_id=t.id
     JOIN units u ON u.id=tu.unit_id JOIN properties pr ON pr.id=u.property_id
     WHERE u.code='Shop 11' AND pr.name='Tunkara Plaza 1'`
  )
  .all();
console.log("plaza1_shop11", shop11);

const canteens = db
  .prepare(
    `SELECT u.code, tn.full_name FROM units u JOIN properties pr ON pr.id=u.property_id
     LEFT JOIN tenancy_units tu ON tu.unit_id=u.id
     LEFT JOIN tenancies t ON t.id=tu.tenancy_id AND t.status='active'
     LEFT JOIN tenants tn ON tn.id=t.tenant_id
     WHERE pr.name='Tunkara Plaza 2' AND u.code LIKE 'Canteen%'`
  )
  .all();
console.log("canteens", canteens);

console.log("landlords", db.prepare("SELECT full_name FROM landlords ORDER BY full_name").all());
db.close();
