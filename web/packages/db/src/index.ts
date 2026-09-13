import { prisma } from "./prisma";

export { prisma } from "./prisma";
export type { PrismaClient } from "./prisma";

/** Alias used by desk code. */
export const db = prisma;

export function assertDatabaseUrl() {
  const url = process.env.DATABASE_URL || "";
  if (!url || url.includes("USER:PASSWORD") || url.startsWith("file:")) {
    throw new Error(
      "DATABASE_URL must be a Neon Postgres connection string (postgresql://...). See web/.env.local"
    );
  }
}
