import { NextResponse } from "next/server"
import { db } from "@/lib/turso"
import { calculateTotalDistance } from "@/lib/openroute-service"

// Einfache Funktion zum Warten
async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Rate Limiting Queue
class RequestQueue {
  private queue: { fn: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }[] = []
  private processing = false
  private requestTimes: number[] = []
  private requestsPerMinute: number

  constructor(requestsPerMinute = 35) {
    this.requestsPerMinute = requestsPerMinute
  }

  async add(fn: () => Promise<any>) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject })
      this.process()
    })
  }

  private async process() {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      const now = Date.now()
      this.requestTimes = this.requestTimes.filter((time) => time > now - 60000)

      if (this.requestTimes.length >= this.requestsPerMinute) {
        const oldestRequest = this.requestTimes[0]
        const waitTime = 60000 - (now - oldestRequest)
        console.log(`Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)} seconds...`)
        await wait(waitTime)
        continue
      }

      const { fn, resolve, reject } = this.queue.shift()!
      try {
        this.requestTimes.push(Date.now())
        const result = await fn()
        resolve(result)
      } catch (error) {
        reject(error)
      }

      await wait(100)
    }

    this.processing = false
  }
}

const requestQueue = new RequestQueue()

async function groupVisitsIntoTrips(visits: any[]) {
  const sortedVisits = [...visits].sort((a, b) => new Date(a.date_from).getTime() - new Date(b.date_from).getTime())

  const trips = []
  let currentTrip = null

  for (const visit of sortedVisits) {
    if (!currentTrip) {
      currentTrip = {
        visits: [visit],
        startDate: visit.date_from,
        endDate: visit.date_to,
      }
    } else {
      const lastVisitEndDate = new Date(currentTrip.endDate)
      const visitStartDate = new Date(visit.date_from)
      const daysBetween = (visitStartDate.getTime() - lastVisitEndDate.getTime()) / (1000 * 60 * 60 * 24)

      if (daysBetween === 0) {
        currentTrip.visits.push(visit)
        currentTrip.endDate = visit.date_to
      } else {
        trips.push(currentTrip)
        currentTrip = {
          visits: [visit],
          startDate: visit.date_from,
          endDate: visit.date_to,
        }
      }
    }
  }

  if (currentTrip) {
    trips.push(currentTrip)
  }

  return trips
}

async function migrateTrips() {
  try {
    // Hole nur Besuche ohne trip_id
    const visitsResult = await db.execute(`
      SELECT 
        v.id,
        v.date_from,
        v.date_to,
        v.campsite_id,
        c.latitude,
        c.longitude
      FROM visits v
      JOIN campsites c ON c.id = v.campsite_id
      WHERE v.trip_id IS NULL
      ORDER BY v.date_from ASC
    `)

    const visits = visitsResult.rows.map((row) => ({
      id: row.id,
      date_from: row.date_from,
      date_to: row.date_to,
      campsite_id: row.campsite_id,
      latitude: row.latitude,
      longitude: row.longitude,
    }))

    if (visits.length === 0) {
      return { message: "No new visits to process. All visits are already assigned to trips.", processed: 0 }
    }

    // Gruppiere Besuche in Trips
    const trips = await groupVisitsIntoTrips(visits)
    let processedTrips = 0

    // Verarbeite jeden Trip
    for (let i = 0; i < trips.length; i++) {
      const trip = trips[i]

      try {
        // Berechne die Distanz für den Trip
        const { total_distance_km } = await calculateTotalDistance(trip.visits)

        if (isNaN(total_distance_km)) {
          console.error(`Invalid distance calculated for trip ${i + 1}. Skipping...`)
          continue
        }

        // Erstelle den Trip in der Datenbank
        const tripResult = await db.execute({
          sql: `
            INSERT INTO trips (start_date, end_date, total_distance)
            VALUES (?, ?, ?)
            RETURNING id
          `,
          args: [trip.startDate, trip.endDate, total_distance_km],
        })

        const tripId = tripResult.rows[0].id

        // Aktualisiere die Besuche mit der trip_id
        for (const visit of trip.visits) {
          await db.execute({
            sql: `
              UPDATE visits
              SET trip_id = ?
              WHERE id = ?
            `,
            args: [tripId, visit.id],
          })
        }

        processedTrips++
      } catch (error) {
        console.error(`Error processing trip ${i + 1}:`, error)
        continue
      }
    }

    return {
      message: "Migration completed successfully!",
      processed: processedTrips,
      total: trips.length,
    }
  } catch (error) {
    console.error("Migration failed:", error)
    throw error
  }
}

export async function GET(request: Request) {
  try {
    const result = await migrateTrips()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in migration route:", error)
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

