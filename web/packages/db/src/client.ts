import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import fs from "fs";
import path from "path";

let _sqlite: DatabaseSync | null = null;

export function getDbPath() {
  if (process.env.DATABASE_URL?.startsWith("file:")) {
    return process.env.DATABASE_URL.replace("file:", "");
  }
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("://")) {
    return process.env.DATABASE_URL;
  }
  return path.join(process.cwd(), "data", "garawol.db");
}

export function getSqlite() {
  if (_sqlite) return _sqlite;
  const dbPath = getDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  _sqlite = new DatabaseSync(dbPath);
  try {
    _sqlite.exec("PRAGMA journal_mode = WAL;");
  } catch {
    /* ignore */
  }
  _sqlite.exec("PRAGMA foreign_keys = ON;");
  return _sqlite;
}

export type Row = Record<string, unknown>;

export function all<T extends Row = Row>(sql: string, ...params: SQLInputValue[]): T[] {
  return getSqlite().prepare(sql).all(...params) as T[];
}

export function get<T extends Row = Row>(
  sql: string,
  ...params: SQLInputValue[]
): T | undefined {
  return getSqlite().prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, ...params: SQLInputValue[]) {
  return getSqlite().prepare(sql).run(...params);
}
