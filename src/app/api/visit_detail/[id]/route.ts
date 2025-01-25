import { NextResponse } from "next/server";
import { db } from "@/lib/turso";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db.execute({
      sql: `
        SELECT 
          v.id AS id,
          strftime('%d.%m.%Y', v.date_from) AS dateFrom,
          strftime('%d.%m.%Y', v.date_to) AS dateTo,
          v.visit_image AS image,
          c.name AS title,
          c.location AS location,
          c.latitude AS latitude,
          c.longitude AS longitude
        FROM visits v
        JOIN campsites c ON v.campsite_id = c.id
        WHERE v.id = ?
      `,
      args: [params.id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Kein Besuch gefunden" }, { status: 404 });
    }

    const visit = result.rows[0];

    return NextResponse.json({
      id: visit.id,
      title: visit.title,
      date: `${visit.dateFrom} - ${visit.dateTo}`,
      location: visit.location,
      image: visit.image,
      latitude: visit.latitude,
      longitude: visit.longitude,
    });
  } catch (error) {
    console.error("Error fetching visit details:", error);
    return NextResponse.json(
      { error: "Fehler beim Abrufen der Besuchsdetails" },
      { status: 500 }
    );
  }
}
