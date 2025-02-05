import { NextResponse } from "next/server"
import { db } from "@/lib/turso"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const tripResult = await db.execute({
      sql: `
        WITH TripVisits AS (
          SELECT 
            t.id,
            t.name,
            t.start_date,
            t.end_date,
            t.total_distance,
            v.id as visit_id, -- Stelle sicher, dass visit_id abgefragt wird
            v.date_from as visit_date,
            c.id as campsite_id,
            c.name as campsite_name,
            c.location,
            c.latitude,
            c.longitude,
            c.teaser_image -- Füge die teaser_image-Spalte hinzu
          FROM trips t
          LEFT JOIN visits v ON v.trip_id = t.id
          LEFT JOIN campsites c ON v.campsite_id = c.id
          WHERE t.id = ?
        )
        SELECT 
          id,
          name,
          start_date,
          end_date,
          total_distance,
          GROUP_CONCAT(visit_id) as visit_ids, -- Stelle sicher, dass visit_ids abgefragt wird
          GROUP_CONCAT(campsite_name) as campsite_names,
          GROUP_CONCAT(location) as campsite_locations,
          GROUP_CONCAT(visit_date) as visit_dates,
          GROUP_CONCAT(latitude) as latitudes,
          GROUP_CONCAT(longitude) as longitudes,
          GROUP_CONCAT(campsite_id) as campsite_ids,
          GROUP_CONCAT(teaser_image) as teaser_images -- Füge die teaser_image-Spalte hinzu
        FROM TripVisits
        GROUP BY id
      `,
      args: [params.id],
    })

    if (!tripResult.rows || tripResult.rows.length === 0) {
      return NextResponse.json({ error: "Trip nicht gefunden" }, { status: 404 })
    }

    const row = tripResult.rows[0]

    // Erstelle Arrays aus den zusammengefügten Strings
    const visitIds = row.visit_ids ? String(row.visit_ids).split(",") : []
    const campsiteNames = row.campsite_names ? String(row.campsite_names).split(",") : []
    const visitDates = row.visit_dates ? String(row.visit_dates).split(",") : []
    const latitudes = row.latitudes ? String(row.latitudes).split(",").map(Number) : []
    const longitudes = row.longitudes ? String(row.longitudes).split(",").map(Number) : []
    const campsiteIds = row.campsite_ids ? String(row.campsite_ids).split(",") : []
    const teaserImages = row.teaser_images ? String(row.teaser_images).split(",") : []

    const trip = {
      id: row.id,
      name: row.name,
      start_date: row.start_date,
      end_date: row.end_date,
      total_distance: Number(row.total_distance),
      campsites: visitIds
        .map((_, index) => ({
          id: campsiteIds[index],
          name: campsiteNames[index],
          location: String(row.campsite_locations).split(",")[index], // Füge die Location hinzu
          date: visitDates[index],
          latitude: latitudes[index],
          longitude: longitudes[index],
          teaser_image: teaserImages[index], // Füge die teaser_image-Eigenschaft hinzu
          visit_id: visitIds[index], // Füge die visit_id-Eigenschaft hinzu
        }))
        .filter((site) => site.latitude && site.longitude), // Filtere ungültige Koordinaten
    }

    return NextResponse.json({ trip })
  } catch (error) {
    console.error("Error fetching trip:", error)
    return NextResponse.json({ error: "Fehler beim Abrufen des Trips" }, { status: 500 })
  }
}

