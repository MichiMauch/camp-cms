import { NextResponse } from "next/server";
import { db } from "@/lib/turso";

export async function GET() {
  try {
    const result = await db.execute({
      sql: `
        SELECT 
          v.id AS id,
          strftime('%d.%m.%Y', v.date_from) AS dateFrom,
          strftime('%d.%m.%Y', v.date_to) AS dateTo,
          v.visit_image AS image,
          c.name AS title,
          c.location AS location
        FROM visits v
        JOIN campsites c ON v.campsite_id = c.id
        ORDER BY RANDOM()
        LIMIT 1
      `,
      args: []
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Kein Besuch gefunden" }, { status: 404 });
    }

    const randomVisit = result.rows[0];

    return NextResponse.json({
      id: randomVisit.id,
      title: randomVisit.title,
      date: `${randomVisit.dateFrom} - ${randomVisit.dateTo}`,
      location: randomVisit.location,
      image: randomVisit.image,
    });
  } catch (error) {
    console.error("Error fetching random visit:", error);
    return NextResponse.json(
      { error: "Fehler beim Abrufen eines zufälligen Besuchs" },
      { status: 500 }
    );
  }
}
