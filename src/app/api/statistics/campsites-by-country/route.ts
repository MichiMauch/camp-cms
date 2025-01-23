import { NextResponse } from "next/server";
import { db } from "@/lib/turso";

export async function GET() {
  try {
    const result = await db.execute(`
      SELECT country_code, country, COUNT(*) as totalCampsites
      FROM campsites
      GROUP BY country
      ORDER BY totalCampsites DESC
    `);

    if (result.rows.length === 0) {
      throw new Error("No data found");
    }

    const campsitesByCountry = result.rows.map((row) => ({
      country_code: row.country_code,
      country: row.country,
      totalCampsites: row.totalCampsites,
    }));

    return NextResponse.json(campsitesByCountry);
  } catch (error) {
    console.error("Error fetching campsites by country:", error);
    return NextResponse.json({ error: "Failed to fetch campsites by country" }, { status: 500 });
  }
}
