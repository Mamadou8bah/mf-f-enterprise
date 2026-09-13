import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchAll } from "@/lib/queries";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q") || "";
  const data = await searchAll(q);
  return NextResponse.json(data, {
    headers: {
      // Short private cache helps repeat keystrokes on the same instance / browser.
      "Cache-Control": "private, max-age=8, stale-while-revalidate=20",
    },
  });
}
