import { NextResponse } from "next/server";
import { db } from "@/lib/turso";

export async function GET(request: Request) {
  // const url = new URL(request.url);
  // const year = url.searchParams.get("year"); // Jahr aus der Query

  // if (!year || isNaN(Number(year))) {
  //   return NextResponse.json(
  //     { error: "Ungültiges oder fehlendes Jahr" },
  //     { status: 400 }
  //   );
  // }

  try {
    const result = await db.execute({
      sql: `
        SELECT 
  v.id AS id,
  strftime('%d.%m.%Y', date(v.date_from)) AS dateFrom,
  strftime('%d.%m.%Y', date(v.date_to)) AS dateTo,
  v.visit_image AS image,
  c.name AS name, -- Alias auf "name" geändert
  c.location AS location,
  c.country AS country -- Neues Feld für das Land
FROM visits v
JOIN campsites c ON v.campsite_id = c.id
ORDER BY DATE(v.date_from) DESC
      `,
      args: [],
    });

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching visits:", error);
    return NextResponse.json(
      { error: "Fehler beim Abrufen der Besuche" },
      { status: 500 }
    );
  }
}
