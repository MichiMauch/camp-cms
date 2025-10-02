import { NextResponse } from "next/server"
import { db } from "@/lib/turso"

const HOME_COORDINATES = [8.0505824, 47.338728] // [longitude, latitude] für OpenRoute
const OPENROUTE_API_KEY = process.env.OPENROUTE_API_KEY

// OpenRoute API zur Berechnung der echten Straßenkilometer
async function calculateRouteDistance(coordinates: number[][]): Promise<number> {
  try {
    const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
      method: "POST",
      headers: {
        Authorization: OPENROUTE_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates,
        profile: "driving-car",
        format: "json",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenRouteService API error:", response.status, errorText)
      throw new Error(`OpenRouteService API error: ${response.statusText}`)
    }

    const data = await response.json() as {
      routes: Array<{
        summary: {
          distance: number
        }
      }>
    }
    return data.routes[0].summary.distance / 1000 // Konvertiere zu Kilometern
  } catch (error) {
    console.error("Error calculating route:", error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    const { tripId } = await request.json() as { tripId: string }

    if (!tripId) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 })
    }

    // Hole alle Visits für diesen Trip
    const visitsResult = await db.execute({
      sql: `
        SELECT
          v.id,
          v.date_from,
          c.latitude,
          c.longitude
        FROM visits v
        JOIN campsites c ON v.campsite_id = c.id
        WHERE v.trip_id = ?
        ORDER BY v.date_from ASC
      `,
      args: [tripId]
    })

    if (!visitsResult.rows || visitsResult.rows.length === 0) {
      return NextResponse.json({ error: "No visits found for this trip" }, { status: 404 })
    }

    // Erstelle die Koordinaten-Liste als durchgehende Route (OpenRoute Format: [lng, lat])
    // Start von zu Hause -> alle Campingplätze in chronologischer Reihenfolge -> zurück nach Hause
    const coordinates = [
      HOME_COORDINATES, // Start von zu Hause
      ...visitsResult.rows.map(row => [
        Number(row.longitude),
        Number(row.latitude)
      ]), // Alle Campingplätze in der Reihenfolge des Besuchs
      HOME_COORDINATES // Ende zu Hause
    ]

    // Berechne die echte Straßendistanz mit OpenRoute API
    const totalDistance = await calculateRouteDistance(coordinates)
    const roundedDistance = Math.round(totalDistance)

    // Update die Datenbank
    await db.execute({
      sql: `
        UPDATE trips
        SET total_distance = ?
        WHERE id = ?
      `,
      args: [roundedDistance, tripId]
    })

    return NextResponse.json({
      success: true,
      distance: roundedDistance,
      message: `Distance calculated: ${roundedDistance} km`
    })

  } catch (error) {
    console.error("Error calculating trip distance:", error)
    return NextResponse.json({ error: "Failed to calculate distance" }, { status: 500 })
  }
}

// GET endpoint um alle Trips ohne Distanz zu finden und zu berechnen
export async function GET() {
  try {
    // Finde alle Trips ohne Distanz oder mit 0
    const tripsResult = await db.execute({
      sql: `
        SELECT id, name
        FROM trips
        WHERE total_distance IS NULL OR total_distance = 0
      `,
      args: []
    })

    const results = []

    for (const trip of tripsResult.rows) {
      try {
        // Hole alle Visits für diesen Trip
        const visitsResult = await db.execute({
          sql: `
            SELECT
              v.id,
              v.date_from,
              c.latitude,
              c.longitude
            FROM visits v
            JOIN campsites c ON v.campsite_id = c.id
            WHERE v.trip_id = ?
            ORDER BY v.date_from ASC
          `,
          args: [trip.id]
        })

        if (visitsResult.rows && visitsResult.rows.length > 0) {
          // Erstelle die Koordinaten-Liste als durchgehende Route (OpenRoute Format: [lng, lat])
          const coordinates = [
            HOME_COORDINATES,
            ...visitsResult.rows.map(row => [
              Number(row.longitude),
              Number(row.latitude)
            ]),
            HOME_COORDINATES
          ]

          // Berechne die echte Straßendistanz mit OpenRoute API
          const totalDistance = await calculateRouteDistance(coordinates)
          const roundedDistance = Math.round(totalDistance)

          // Update die Datenbank
          await db.execute({
            sql: `
              UPDATE trips
              SET total_distance = ?
              WHERE id = ?
            `,
            args: [roundedDistance, trip.id]
          })

          results.push({
            id: trip.id,
            name: trip.name || `Trip ${trip.id}`,
            distance: roundedDistance,
            status: 'updated'
          })
        }
      } catch (error) {
        console.error(`Error calculating distance for trip ${trip.id}:`, error)
        results.push({
          id: trip.id,
          name: trip.name || `Trip ${trip.id}`,
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'failed'
        })
      }
    }

    return NextResponse.json({
      success: true,
      tripsProcessed: results.length,
      results
    })

  } catch (error) {
    console.error("Error processing trips:", error)
    return NextResponse.json({ error: "Failed to process trips" }, { status: 500 })
  }
}