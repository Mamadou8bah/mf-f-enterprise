import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runImport } from "@/lib/importer";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  if (process.env.NODE_ENV === "production" || process.env.NETLIFY === "true") {
    return NextResponse.json(
      {
        error:
          "Word import is disabled in production. Load portfolio via Neon (npm run db:migrate-sqlite locally), then redeploy.",
      },
      { status: 501 }
    );
  }
  const candidates = [
    path.resolve(process.cwd(), "packages/import/doccuments"),
    path.resolve(process.cwd(), "doccuments"),
  ];
  const dir = candidates.find((d) => fs.existsSync(d));
  if (!dir) {
    return NextResponse.json({ error: "Import documents folder not found" }, { status: 404 });
  }
  const dbPath = path.resolve(process.cwd(), "data/garawol.db");
  const result = runImport(dir, dbPath);
  return NextResponse.json(result);
}
