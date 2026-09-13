import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isOwnerRole } from "@/lib/roles";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (!isOwnerRole(session.user.role)) redirect("/");
  return session;
}

/** API guard for Owner-only routes. Returns an error response, or null if allowed. */
export function denyUnlessOwner(session: Session | null) {
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isOwnerRole(session.user.role)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  return null;
}
