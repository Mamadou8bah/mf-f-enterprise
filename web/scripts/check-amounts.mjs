import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync("./data/garawol.db");
const top = db
  .prepare(
    "SELECT amount_gmd, balance_gmd, next_due, status FROM tenancies ORDER BY COALESCE(balance_gmd, amount_gmd) DESC LIMIT 12"
  )
  .all();
console.log("top", top);
const dist = db
  .prepare(
    `SELECT CASE
  WHEN COALESCE(balance_gmd,amount_gmd) > 1000000000 THEN 'gt1b'
  WHEN COALESCE(balance_gmd,amount_gmd) > 1000000 THEN 'gt1m'
  WHEN COALESCE(balance_gmd,amount_gmd) > 100000 THEN 'gt100k'
  ELSE 'ok' END AS b, COUNT(*) AS c,
  SUM(COALESCE(balance_gmd,amount_gmd)) AS s
  FROM tenancies WHERE status='active' GROUP BY b`
  )
  .all();
console.log("dist", dist);
