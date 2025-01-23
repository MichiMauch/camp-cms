import { NextResponse } from "next/server";
import { db } from "@/lib/turso";

export async function GET() {
  try {
    const result = await db.execute(`
      SELECT COUNT(*) as totalVisits
      FROM visits
    `);

    if (result.rows.length === 0) {
      throw new Error("No data found");
    }

    const totalVisits = result.rows[0].totalVisits;

    return NextResponse.json({ totalVisits });
  } catch (error) {
    console.error("Error fetching total visits:", error);
    return NextResponse.json({ error: "Failed to fetch total visits" }, { status: 500 });
  }
}
