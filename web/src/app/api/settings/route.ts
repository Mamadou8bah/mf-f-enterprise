import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOfficeSettings, saveOfficeSettings, sanitizePrefix } from "@/lib/office-settings";

export async function GET() {
  return NextResponse.json(await getOfficeSettings());
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const saved = await saveOfficeSettings({
    companyName: body.companyName,
    companyShort: body.companyShort,
    tagline: body.tagline,
    phone: body.phone,
    email: body.email,
    address: body.address,
    receiptPrefix: body.receiptPrefix != null ? sanitizePrefix(String(body.receiptPrefix)) : undefined,
    receiptFooter: body.receiptFooter,
  });
  return NextResponse.json(saved);
}
