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

// Delay zwischen API-Anfragen (ms)
const DELAY_BETWEEN_REQUESTS = 1000 // 1 Sekunde
const MAX_TRIPS_TO_PROCESS = 5 // Maximal 5 Trips pro Durchlauf

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '5')
    const skipId = url.searchParams.get('skip') || '0'

    // Hole nur eine begrenzte Anzahl von Trips
    const tripsResult = await db.execute({
      sql: `
        SELECT id, name, total_distance
        FROM trips
        WHERE id < ?
        ORDER BY id DESC
        LIMIT ?
      `,
      args: [skipId === '0' ? 999999 : skipId, Math.min(limit, MAX_TRIPS_TO_PROCESS)]
    })

    if (tripsResult.rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Keine weiteren Trips zu verarbeiten",
        tripsProcessed: 0,
        results: []
      })
    }

    const results = []

    for (let i = 0; i < tripsResult.rows.length; i++) {
      const trip = tripsResult.rows[i]

      // Delay zwischen Anfragen (außer bei der ersten)
      if (i > 0) {
        await delay(DELAY_BETWEEN_REQUESTS)
      }
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
          // Erstelle die Koordinaten-Liste als durchgehende Route
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
            oldDistance: trip.total_distance,
            newDistance: roundedDistance,
            difference: roundedDistance - Number(trip.total_distance),
            status: 'updated'
          })

          console.log(`Trip ${trip.id}: ${trip.total_distance} km -> ${roundedDistance} km`)
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

    const lastProcessedId = results.length > 0 ? Math.min(...results.map(r => Number(r.id))) : null

    return NextResponse.json({
      success: true,
      tripsProcessed: results.length,
      results,
      nextSkipId: lastProcessedId,
      hasMore: tripsResult.rows.length === Math.min(limit, MAX_TRIPS_TO_PROCESS),
      message: `Verarbeitet: ${results.length} Trips. ${lastProcessedId ? `Nächster Aufruf mit ?skip=${lastProcessedId}` : 'Alle Trips verarbeitet'}`
    })

  } catch (error) {
    console.error("Error processing trips:", error)
    return NextResponse.json({ error: "Failed to process trips" }, { status: 500 })
  }
}