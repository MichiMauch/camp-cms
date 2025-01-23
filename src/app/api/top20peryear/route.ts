import { NextResponse } from "next/server";
import { db } from "@/lib/turso";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const year = url.searchParams.get("year"); // Jahr aus der Query
  const fallbackYear = url.searchParams.get("fallbackYear");
  const limit = 20; // Anzahl der Einträge pro Jahr

  if (!year || isNaN(Number(year))) {
    return NextResponse.json(
      { error: "Ungültiges oder fehlendes Jahr" },
      { status: 400 }
    );
  }

  try {
    const result = await db.execute({
      sql: `
        SELECT 
          v.id AS id,
          strftime('%d.%m.%Y', date(v.date_from)) AS dateFrom,
          strftime('%d.%m.%Y', date(v.date_to)) AS dateTo,
          v.visit_image AS image,
          c.name AS title,
          c.location AS location,
          c.country AS country -- Neues Feld für das Land
        FROM visits v
        JOIN campsites c ON v.campsite_id = c.id
        WHERE strftime('%Y', v.date_from) = ? OR strftime('%Y', v.date_to) = ?
        ORDER BY DATE(v.date_from) DESC
        LIMIT ?
      `,
      args: [year, year, limit],
    });

    if (result.rows.length === 0 && fallbackYear) {
      const fallbackResult = await db.execute({
        sql: `
          SELECT 
            v.id AS id,
            strftime('%d.%m.%Y', date(v.date_from)) AS dateFrom,
            strftime('%d.%m.%Y', date(v.date_to)) AS dateTo,
            v.visit_image AS image,
            c.name AS title,
            c.location AS location,
            c.country AS country -- Neues Feld für das Land
          FROM visits v
          JOIN campsites c ON v.campsite_id = c.id
          WHERE strftime('%Y', v.date_to) = ?
          ORDER BY DATE(v.date_to) DESC
          LIMIT ?
        `,
        args: [fallbackYear, limit],
      });
      return NextResponse.json(fallbackResult.rows);
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching visits:", error);
    return NextResponse.json(
      { error: "Fehler beim Abrufen der Besuche" },
      { status: 500 }
    );
  }
}
