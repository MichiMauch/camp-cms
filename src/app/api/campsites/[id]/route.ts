import { NextResponse } from "next/server";
import { db } from "@/lib/turso"; // Datenbankverbindung

// GET-Methode: Details eines Campingplatzes abrufen
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await db.execute({
      sql: `
        SELECT id, name, location, teaser_image AS teaserImage, latitude, longitude, country, country_code, iso_alpha3, altitude
        FROM campsites
        WHERE id = ?
      `,
      args: [params.id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Campsite not found" }, { status: 404 });
    }

    const campsite = result.rows[0];

    return NextResponse.json({
      id: campsite.id,
      name: campsite.name,
      location: campsite.location,
      teaserImage: campsite.teaserImage,
      latitude: campsite.latitude,
      longitude: campsite.longitude,
      country: campsite.country,
      countryCode: campsite.country_code,
      isoAlpha3: campsite.iso_alpha3,
      altitude: campsite.altitude,
    });
  } catch (error) {
    console.error("Error fetching campsite details:", error);
    return NextResponse.json({ error: "Failed to fetch campsite details" }, { status: 500 });
  }
}

// PUT-Methode: Details eines Campingplatzes aktualisieren
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // Daten aus der Anfrage lesen
    const body = await request.json();
    const { name, location, teaserImage, latitude, longitude } = body;

    // Validierung der Eingabedaten (optional)
    if (!name || !location || !latitude || !longitude) {
      return NextResponse.json(
        { error: "Missing required fields: name, location, latitude, or longitude" },
        { status: 400 }
      );
    }

    // Update-Abfrage
    await db.execute({
      sql: `
        UPDATE campsites
        SET name = ?, location = ?, teaser_image = ?, latitude = ?, longitude = ?
        WHERE id = ?
      `,
      args: [name, location, teaserImage, latitude, longitude, id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating campsite details:", error);
    return NextResponse.json({ error: "Failed to update campsite details" }, { status: 500 });
  }
}
