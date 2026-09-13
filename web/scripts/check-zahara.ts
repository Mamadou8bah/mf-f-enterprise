import { DatabaseSync } from "node:sqlite";
import path from "path";
const db = new DatabaseSync(path.join(__dirname, "..", "data", "garawol.db"));
console.log(
  db
    .prepare(
      `SELECT p.period_start, p.period_end, t.next_due, p.amount_gmd
       FROM payments p JOIN tenancies t ON t.id=p.tenancy_id JOIN tenants tn ON tn.id=t.tenant_id
       WHERE tn.full_name LIKE 'Zahara%'`
    )
    .get()
);
db.close();
