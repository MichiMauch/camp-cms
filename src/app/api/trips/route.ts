import { NextResponse } from "next/server"
import { db } from "@/lib/turso"

export async function GET(request: Request) {
  try {
    const tripsResult = await db.execute({
      sql: `
        WITH CampsiteCounts AS (
          SELECT 
            t.id,
            COUNT(DISTINCT v.campsite_id) as unique_campsite_count
          FROM trips t
          LEFT JOIN visits v ON v.trip_id = t.id
          GROUP BY t.id
          HAVING unique_campsite_count > 1
        )
        SELECT 
          t.id,
          t.name,
          t.start_date,
          t.end_date,
          t.total_distance,
          COUNT(v.id) as visit_count,
          GROUP_CONCAT(v.id) as visit_ids,
          GROUP_CONCAT(c.name) as campsite_names,
          GROUP_CONCAT(v.date_from) as visit_dates,
          GROUP_CONCAT(v.visit_image) as teaser_images
        FROM trips t
        INNER JOIN CampsiteCounts cc ON cc.id = t.id
        LEFT JOIN visits v ON v.trip_id = t.id
        LEFT JOIN campsites c ON v.campsite_id = c.id
        WHERE 
          t.start_date IS NOT NULL 
          AND t.end_date IS NOT NULL
          AND date(t.end_date) >= date(t.start_date)
        GROUP BY t.id
        ORDER BY date(t.start_date) DESC
      `,
      args: [],
    })

    console.log("Trips Result:", tripsResult); // Debug-Ausgabe

    const trips = tripsResult.rows.map((trip) => ({
      id: trip.id,
      name: trip.name,
      start_date: trip.start_date,
      end_date: trip.end_date,
      total_distance: Number(trip.total_distance),
      visit_count: Number(trip.visit_count),
      campsite_names: String(trip.campsite_names || "").split(",").join("||"),
      visit_dates: String(trip.visit_dates || "").split(",").join("||"),
      teaser_images: trip.teaser_images ? String(trip.teaser_images).split(",") : []
    }))

    return NextResponse.json({ trips })
  } catch (error) {
    console.error("Error fetching trips:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Fehler beim Abrufen der Trips" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name } = body

    if (!id || typeof name !== "string") {
      return NextResponse.json({ error: "ID und Name sind erforderlich" }, { status: 400 })
    }

    await db.execute({
      sql: `
        UPDATE trips 
        SET name = ?
        WHERE id = ?
      `,
      args: [name, id],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating trip:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Fehler beim Aktualisieren des Trips" }, { status: 500 })
  }
}

