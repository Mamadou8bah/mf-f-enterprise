import { NextResponse } from "next/server";
import { allUnits, allProperties, photosByUnit } from "@/lib/data";
import { getOfficeSettings } from "@/lib/office-settings";
import { isPlausibleRentAmount } from "@garawol/shared";

export const dynamic = "force-dynamic";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET() {
  const office = await getOfficeSettings();
  const properties = await allProperties();
  const props = Object.fromEntries(properties.map((p) => [p.id, p]));
  const units = await allUnits();

  const vacancies = (
    await Promise.all(
      units
        .filter((u) => u.status === "vacant")
        .map(async (u) => {
          const property = props[u.property_id];
          const photos = (await photosByUnit(u.id)).map((p) => p.url);
          const rent = isPlausibleRentAmount(u.asking_rent_gmd) ? u.asking_rent_gmd : null;
          return {
            id: u.id,
            code: u.code,
            type: u.type,
            askingRentGmd: rent,
            photoUrl: photos[0] || null,
            propertyName: property?.name || "Property",
            area: property?.area || null,
            address: property?.address || null,
          };
        })
    )
  ).sort((a, b) => {
    const area = (a.area || "").localeCompare(b.area || "");
    if (area) return area;
    const prop = a.propertyName.localeCompare(b.propertyName);
    if (prop) return prop;
    return a.code.localeCompare(b.code);
  });

  return NextResponse.json(
    {
      company: office.companyName,
      tagline: office.tagline,
      phone: office.phone || null,
      email: office.email || null,
      count: vacancies.length,
      vacancies,
    },
    { headers: corsHeaders() }
  );
}
