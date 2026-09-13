import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { recordPayment } from "@/lib/payments";
import type { PaymentMethod } from "@garawol/shared";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  try {
    const result = await recordPayment({
      tenancyId: body.tenancyId,
      amountGmd: Number(body.amountGmd),
      method: (body.method || "cash") as PaymentMethod,
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      notes: body.notes,
      recordedBy: session.user.id,
      localReceiptNo: body.localReceiptNo,
      paidAt: body.paidAt,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
