import { NextResponse } from "next/server";
import { db } from "@/lib/turso";

export async function GET(request: Request, { params }: { params: { id: string } }) {
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
          c.longitude AS longitude,
          c.country AS country,
          (
            SELECT GROUP_CONCAT(strftime('%d.%m.%Y', v2.date_from) || ' - ' || strftime('%d.%m.%Y', v2.date_to), ', ')
            FROM visits v2
            WHERE v2.campsite_id = v.campsite_id
              AND v2.id != v.id
          ) AS previousVisitDates
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
      country: visit.country,
      image: visit.image,
      latitude: visit.latitude,
      longitude: visit.longitude,
      previousVisits: typeof visit.previousVisitDates === 'string' ? visit.previousVisitDates.split(', ') : [], // Liste der vorherigen Besuche
    });
  } catch (error) {
    console.error("Error fetching visit details:", error);
    return NextResponse.json(
      { error: "Fehler beim Abrufen der Besuchsdetails" },
      { status: 500 }
    );
  }
}
