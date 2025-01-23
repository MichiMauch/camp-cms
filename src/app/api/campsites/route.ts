import { NextResponse } from "next/server";
import { db } from "@/lib/turso";

export async function GET() {
  try {
    const result = await db.execute(`
       SELECT id, name, location, teaser_image, latitude, longitude
       FROM campsites
       ORDER BY name
    `);

    const campsites = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      location: row.location,
      teaser_image: row.teaser_image,
      latitude: row.latitude,
      longitude: row.longitude
    }));

    return NextResponse.json(campsites);
  } catch (error) {
    console.error("Error fetching campsites:", error);
    return NextResponse.json({ error: "Failed to fetch campsites" }, { status: 500 });
  }
}

