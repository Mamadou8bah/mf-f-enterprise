import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

/**
 * Seed staff + office settings on Neon/Postgres.
 * Requires DATABASE_URL (Postgres). Change passwords after first login.
 */
async function main() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("USER:PASSWORD")) {
    console.error(
      "Set a real DATABASE_URL first (Neon connection string), then run: npm run db:seed"
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash("garawol123", 10);

  await prisma.staff.upsert({
    where: { email: "admin@garawol.gm" },
    update: { passwordHash, isActive: true },
    create: {
      id: randomUUID(),
      fullName: "Business Owner",
      phone: "",
      email: "admin@garawol.gm",
      passwordHash,
      role: "admin",
      isActive: true,
    },
  });

  await prisma.staff.upsert({
    where: { email: "secretary@garawol.gm" },
    update: { passwordHash, isActive: true },
    create: {
      id: randomUUID(),
      fullName: "Secretary",
      phone: "",
      email: "secretary@garawol.gm",
      passwordHash,
      role: "collector",
      isActive: true,
    },
  });

  await prisma.officeSettings.upsert({
    where: { id: "office" },
    update: {},
    create: {
      id: "office",
      companyName: "MF & F Enterprise",
      companyShort: "MF & F",
      tagline: "Property & rent management",
      phone: "",
      email: "",
      address: "",
      receiptPrefix: "MFF",
      receiptFooter: "Thank you",
    },
  });

  console.log("Seeded Owner + Secretary (password: garawol123) and office settings.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
