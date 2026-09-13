import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@garawol/db";
import { audit } from "@/lib/payments";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.NODE_ENV === "production" || process.env.NETLIFY === "true") {
    return NextResponse.json(
      {
        error:
          "Photo upload to local disk is not available on Netlify. Use object storage or host images elsewhere, then store the URL.",
      },
      { status: 501 }
    );
  }
  const body = await req.json();
  const { unitId, dataUrl, sortOrder } = body as {
    unitId: string;
    dataUrl: string;
    sortOrder?: number;
  };
  if (!unitId || !dataUrl?.startsWith("data:image")) {
    return NextResponse.json({ error: "Invalid photo" }, { status: 400 });
  }
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return NextResponse.json({ error: "Bad image" }, { status: 400 });
  const ext = match[1].split("/")[1] || "jpg";
  const buf = Buffer.from(match[2], "base64");
  const dir = path.join(process.cwd(), "public", "uploads", "units");
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, filename), buf);
  const url = `/uploads/units/${filename}`;
  const id = randomUUID();
  await prisma.unitPhoto.create({
    data: {
      id,
      unitId,
      url,
      sortOrder: sortOrder ?? 0,
    },
  });
  await audit(session.user.id, "unit.photo", "unit", unitId, url);
  return NextResponse.json({ id, url });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.unitPhoto.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
