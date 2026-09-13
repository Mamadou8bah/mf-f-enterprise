import path from "path";
import { runImport } from "./importer";

const root = path.resolve(__dirname, "../../..");
const docsDir = path.join(root, "packages/import/doccuments");
const dbPath = path.join(root, "apps/web/data/garawol.db");

console.log("Importing from", docsDir);
console.log("Into", dbPath);
const result = runImport(docsDir, dbPath);
console.log(result);
