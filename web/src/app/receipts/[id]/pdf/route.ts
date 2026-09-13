import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getReceiptBundle, findStaffById } from "@/lib/queries";
import { formatGmd, formatDate } from "@garawol/shared";
import { getOfficeSettings, officeContactLine } from "@/lib/office-settings";
import { roleLabel } from "@/lib/roles";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const A4 = { w: 595.28, h: 842.89 };
const MARGIN_X = 48;
const MARGIN_TOP = 46;
const NAVY = rgb(0.043, 0.184, 0.42);
const INK = rgb(0.043, 0.071, 0.125);
const MUTED = rgb(0.29, 0.333, 0.408);
const LINE = rgb(0.835, 0.871, 0.918);
const BAND = rgb(0.957, 0.965, 0.98);
const GOLD = rgb(0.788, 0.635, 0.153);

function methodLabel(method: string) {
  const map: Record<string, string> = {
    cash: "Cash",
    wave: "Wave",
    bank: "Bank transfer",
    orange_money: "Orange Money",
    other: "Other",
  };
  return map[method] || method;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireSession();
  const { id } = await params;
  const bundle = await getReceiptBundle(id);
  if (!bundle?.receipt || !bundle.payment || !bundle.tenant || !bundle.property) {
    notFound();
  }
  const collector = await findStaffById(bundle.payment.recorded_by);
  const unitCodes = (bundle.units || []).map((u) => u.code).join(", ") || "—";
  const landlordName = bundle.landlord?.full_name || "Owner";
  const collectorName = collector?.full_name || "Staff";
  const office = await getOfficeSettings();
  const contact = officeContactLine(office);
  const isVoid = bundle.receipt.status === "void";

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([A4.w, A4.h]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const contentRight = A4.w - MARGIN_X;
  let y = A4.h - MARGIN_TOP;

  // Logo + brand
  let logoH = 0;
  try {
    const logoBytes = await readFile(path.join(process.cwd(), "public", "mf_logo.png"));
    const logo = await pdf.embedPng(logoBytes);
    const logoW = 52;
    logoH = (logo.height / logo.width) * logoW;
    page.drawImage(logo, { x: MARGIN_X, y: y - logoH, width: logoW, height: logoH });
  } catch {
    // optional
  }

  const brandX = MARGIN_X + (logoH ? 64 : 0);
  page.drawText(office.companyName, {
    x: brandX,
    y: y - 18,
    size: 16,
    font: bold,
    color: NAVY,
  });
  page.drawText(office.tagline, {
    x: brandX,
    y: y - 34,
    size: 9,
    font,
    color: MUTED,
  });

  const title = "OFFICIAL RENT RECEIPT";
  const titleW = bold.widthOfTextAtSize(title, 9);
  page.drawText(title, {
    x: contentRight - titleW,
    y: y - 14,
    size: 9,
    font: bold,
    color: MUTED,
  });
  const no = bundle.receipt.receipt_no;
  const noW = bold.widthOfTextAtSize(no, 13);
  page.drawText(no, {
    x: contentRight - noW,
    y: y - 32,
    size: 13,
    font: bold,
    color: INK,
  });
  const paid = `Paid ${formatDate(bundle.payment.paid_at)}`;
  const paidW = font.widthOfTextAtSize(paid, 9);
  page.drawText(paid, {
    x: contentRight - paidW,
    y: y - 46,
    size: 9,
    font,
    color: MUTED,
  });

  y -= Math.max(logoH, 56) + 18;
  page.drawLine({
    start: { x: MARGIN_X, y },
    end: { x: contentRight, y },
    thickness: 2,
    color: NAVY,
  });

  // Amount band
  y -= 18;
  const bandH = 64;
  page.drawRectangle({
    x: MARGIN_X,
    y: y - bandH,
    width: contentRight - MARGIN_X,
    height: bandH,
    color: BAND,
    borderColor: LINE,
    borderWidth: 1,
  });
  page.drawRectangle({
    x: MARGIN_X,
    y: y - bandH,
    width: 4,
    height: bandH,
    color: GOLD,
  });
  page.drawText("AMOUNT RECEIVED", {
    x: MARGIN_X + 14,
    y: y - 20,
    size: 8,
    font: bold,
    color: MUTED,
  });
  page.drawText(formatGmd(bundle.payment.amount_gmd), {
    x: MARGIN_X + 14,
    y: y - 46,
    size: 20,
    font: bold,
    color: INK,
  });
  const method = methodLabel(bundle.payment.method);
  const period = `${formatDate(bundle.payment.period_start)} - ${formatDate(bundle.payment.period_end)}`;
  page.drawText("METHOD", {
    x: contentRight - 180,
    y: y - 18,
    size: 7,
    font: bold,
    color: MUTED,
  });
  page.drawText(method, {
    x: contentRight - 180,
    y: y - 32,
    size: 10,
    font,
    color: INK,
  });
  page.drawText("PERIOD", {
    x: contentRight - 180,
    y: y - 46,
    size: 7,
    font: bold,
    color: MUTED,
  });
  page.drawText(period, {
    x: contentRight - 180,
    y: y - 58,
    size: 9,
    font,
    color: INK,
  });
  y -= bandH + 28;

  const colGap = 28;
  const colW = (contentRight - MARGIN_X - colGap) / 2;
  const fields: [string, string, string?][] = [
    ["RECEIVED FROM (TENANT)", bundle.tenant.full_name, bundle.tenant.phone || undefined],
    ["UNIT / PROPERTY", unitCodes, bundle.property.name],
    ["COLLECTED FOR", landlordName, `via ${office.companyShort}`],
    ["ISSUED BY", collectorName, `${roleLabel(collector?.role)} · ${office.companyName}`],
  ];

  fields.forEach((field, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = MARGIN_X + col * (colW + colGap);
    const fy = y - row * 68;
    page.drawText(field[0], { x, y: fy, size: 7, font: bold, color: MUTED });
    page.drawText(field[1], { x, y: fy - 16, size: 11, font: bold, color: INK });
    if (field[2]) {
      page.drawText(field[2], { x, y: fy - 30, size: 9, font, color: MUTED });
    }
    page.drawLine({
      start: { x, y: fy - 40 },
      end: { x: x + colW, y: fy - 40 },
      thickness: 0.6,
      color: LINE,
    });
  });

  y -= 150;

  const ack = `This receipt confirms that ${office.companyName} has received the amount stated above as rent payment for the unit and period shown. Payment covers only the rent period listed on this receipt and does not replace a tenancy agreement, alter any outstanding balance outside that period, or waive other charges owed under the tenancy. Please keep this copy for your records. If any detail appears incorrect, contact the office promptly with this receipt number so the record can be checked and corrected if needed.`;
  const ackLines = wrapText(ack, font, 8.5, contentRight - MARGIN_X);
  for (const line of ackLines) {
    page.drawText(line, { x: MARGIN_X, y, size: 8.5, font, color: MUTED });
    y -= 11;
  }

  // Signatures below acknowledgement (leave room for footer)
  const sigY = Math.max(88, Math.min(y - 48, 130));
  const sigW = colW;
  page.drawLine({
    start: { x: MARGIN_X, y: sigY + 28 },
    end: { x: MARGIN_X + sigW, y: sigY + 28 },
    thickness: 1,
    color: INK,
  });
  page.drawText("COLLECTOR SIGNATURE", {
    x: MARGIN_X,
    y: sigY + 14,
    size: 7,
    font: bold,
    color: MUTED,
  });
  page.drawText(
    collector?.role ? `${collectorName} · ${roleLabel(collector.role)}` : collectorName,
    { x: MARGIN_X, y: sigY, size: 9, font, color: INK }
  );

  const sig2X = MARGIN_X + colW + colGap;
  page.drawLine({
    start: { x: sig2X, y: sigY + 28 },
    end: { x: sig2X + sigW, y: sigY + 28 },
    thickness: 1,
    color: INK,
  });
  page.drawText("TENANT SIGNATURE", {
    x: sig2X,
    y: sigY + 14,
    size: 7,
    font: bold,
    color: MUTED,
  });
  page.drawText(bundle.tenant.full_name, { x: sig2X, y: sigY, size: 9, font, color: INK });

  page.drawLine({
    start: { x: MARGIN_X, y: 56 },
    end: { x: contentRight, y: 56 },
    thickness: 0.8,
    color: LINE,
  });
  page.drawText(`${office.companyName}  ·  Receipt ${bundle.receipt.receipt_no}`, {
    x: MARGIN_X,
    y: contact ? 48 : 40,
    size: 8,
    font,
    color: MUTED,
  });
  if (contact) {
    page.drawText(contact, {
      x: MARGIN_X,
      y: 36,
      size: 7,
      font,
      color: MUTED,
    });
  }
  const pageLabel = office.receiptFooter || "Thank you";
  page.drawText(pageLabel, {
    x: contentRight - font.widthOfTextAtSize(pageLabel, 8),
    y: 40,
    size: 8,
    font,
    color: MUTED,
  });

  if (isVoid) {
    page.drawText("VOID", {
      x: A4.w / 2 - bold.widthOfTextAtSize("VOID", 64) / 2,
      y: A4.h / 2,
      size: 64,
      font: bold,
      color: rgb(0.92, 0.55, 0.55),
    });
  }

  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${bundle.receipt.receipt_no}.pdf"`,
    },
  });
}

function wrapText(
  text: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  size: number,
  maxWidth: number
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}
