import { NextResponse } from "next/server";
import { db } from "@/lib/turso";

export async function GET() {
  try {
    const result = await db.execute(`
      SELECT COUNT(*) as totalCampsites
      FROM campsites
    `);

    if (result.rows.length === 0) {
      throw new Error("No data found");
    }

    const totalCampsites = result.rows[0].totalCampsites;

    return NextResponse.json({ totalCampsites });
  } catch (error) {
    console.error("Error fetching total campsites:", error);
    return NextResponse.json({ error: "Failed to fetch total campsites" }, { status: 500 });
  }
}
