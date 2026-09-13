import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@garawol/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const id = randomUUID();
  await prisma.paymentRequest.create({
    data: {
      id,
      tenancyId: body.tenancyId,
      amountGmd: Number(body.amountGmd),
      status: "draft",
    },
  });
  return NextResponse.json({ id });
}
