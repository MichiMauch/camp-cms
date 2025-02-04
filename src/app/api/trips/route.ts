import { NextResponse } from "next/server"
import { db } from "@/lib/turso"

export async function GET(request: Request) {
  try {
    const tripsResult = await db.execute({
      sql: `
        WITH VisitCounts AS (
          SELECT 
            t.id,
            t.name,
            t.start_date,
            t.end_date,
            t.total_distance,
            COUNT(v.id) as visit_count,
            GROUP_CONCAT(v.id, '||') as visit_ids,
            GROUP_CONCAT(c.name, '||') as campsite_names,
            GROUP_CONCAT(v.date_from, '||') as visit_dates
          FROM trips t
          LEFT JOIN visits v ON v.trip_id = t.id
          LEFT JOIN campsites c ON v.campsite_id = c.id
          GROUP BY t.id
          HAVING COUNT(v.id) > 1
          ORDER BY t.start_date DESC
        )
        SELECT 
          id,
          name,
          start_date,
          end_date,
          total_distance,
          visit_count,
          visit_ids,
          campsite_names,
          visit_dates
        FROM VisitCounts
      `,
      args: [],
    })

    const trips = tripsResult.rows.map((trip) => {
      // Extrahiere die Arrays aus den konkatenierte Strings
      const visitDates = (trip.visit_dates as string).split("||")
      const campsiteNames = (trip.campsite_names as string).split("||")
      const visitIds = (trip.visit_ids as string).split("||").map(Number)

      // Erstelle ein Array von Objekten mit Datum und Name
      const visits = visitDates.map((date, index) => ({
        date,
        name: campsiteNames[index],
        id: visitIds[index],
      }))

      // Sortiere die Besuche nach Datum
      visits.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      return {
        id: trip.id,
        name: trip.name as string | null,
        start_date: trip.start_date,
        end_date: trip.end_date,
        total_distance: Number(trip.total_distance),
        visit_count: Number(trip.visit_count),
        visit_ids: visits.map((v) => v.id),
        campsite_names: visits.map((v) => v.name),
      }
    })

    return NextResponse.json({ trips })
  } catch (error) {
    console.error("Error fetching trips:", error)
    return NextResponse.json({ error: "Fehler beim Abrufen der Trips" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name } = await request.json()

    if (!id || typeof name !== "string") {
      return NextResponse.json({ error: "Ungültige Eingabedaten" }, { status: 400 })
    }

    await db.execute({
      sql: `UPDATE trips SET name = ? WHERE id = ?`,
      args: [name, id],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating trip:", error)
    return NextResponse.json({ error: "Fehler beim Aktualisieren des Trips" }, { status: 500 })
  }
}

