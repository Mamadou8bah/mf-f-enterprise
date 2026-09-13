import { DatabaseSync } from "node:sqlite";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(dir, "..", "data", "garawol.db"));
const start = "2026-01-01";
const end = "2026-09-10";
const sql = `
WITH first_unit AS (
  SELECT tenancy_id, MIN(id) AS id
  FROM tenancy_units
  GROUP BY tenancy_id
),
tenancy_property AS (
  SELECT tu.tenancy_id, u.property_id
  FROM first_unit f
  JOIN tenancy_units tu ON tu.id = f.id
  JOIN units u ON u.id = tu.unit_id
),
valid_payments AS (
  SELECT pay.tenancy_id, pay.amount_gmd
  FROM payments pay
  LEFT JOIN receipts r ON r.payment_id = pay.id
  WHERE pay.paid_at >= ?
    AND pay.paid_at <= ?
    AND pay.amount_gmd != 0
    AND (r.id IS NULL OR r.status != 'void')
)
SELECT
  p.name AS name,
  COALESCE(SUM(vp.amount_gmd), 0) AS collected,
  COUNT(vp.tenancy_id) AS payments
FROM properties p
LEFT JOIN tenancy_property tp ON tp.property_id = p.id
LEFT JOIN valid_payments vp ON vp.tenancy_id = tp.tenancy_id
GROUP BY p.id
ORDER BY collected DESC, p.name COLLATE NOCASE ASC
`;
const rows = db.prepare(sql).all(start, end);
console.log("rows", rows.length);
console.log(rows.slice(0, 6));
console.log(
  "total",
  rows.reduce((s, r) => s + Number(r.collected), 0)
);
