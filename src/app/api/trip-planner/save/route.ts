import { NextResponse } from "next/server"
import { db } from "@/lib/turso"

export async function POST(request: Request) {
  try {
    const generatedTrip = await request.json() as any

    console.log("Saving generated trip:", generatedTrip.name)

    // Save the main trip record
    const tripResult = await db.execute({
      sql: `
        INSERT INTO trips (
          start_date,
          end_date,
          total_distance,
          description,
          generated_by_ai
        )
        VALUES (?, ?, ?, ?, ?)
        RETURNING id
      `,
      args: [
        generatedTrip.stops[0]?.campsite ?
          new Date().toISOString().split('T')[0] : // Use today as placeholder
          new Date().toISOString().split('T')[0],
        generatedTrip.stops[generatedTrip.stops.length - 1]?.campsite ?
          new Date(Date.now() + generatedTrip.totalDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
          new Date(Date.now() + generatedTrip.totalDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        Math.round(generatedTrip.totalDistance),
        `${generatedTrip.name}: ${generatedTrip.description}`,
        1 // Mark as AI-generated
      ]
    })

    const tripId = tripResult.rows[0].id as number

    // Save each stop as a planned visit
    for (let i = 0; i < generatedTrip.stops.length; i++) {
      const stop = generatedTrip.stops[i]

      // First, check if the campsite exists in our database
      let campsiteId: number

      const existingCampsite = await db.execute({
        sql: `
          SELECT id FROM campsites
          WHERE name = ? AND latitude = ? AND longitude = ?
        `,
        args: [
          stop.campsite.name,
          stop.campsite.latitude,
          stop.campsite.longitude
        ]
      })

      if (existingCampsite.rows.length > 0) {
        campsiteId = existingCampsite.rows[0].id as number
      } else {
        // Create new campsite from Park4Night data
        const newCampsiteResult = await db.execute({
          sql: `
            INSERT INTO campsites (
              name,
              location,
              latitude,
              longitude,
              country,
              country_code,
              iso_alpha3,
              teaser_image
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
          `,
          args: [
            stop.campsite.name,
            stop.campsite.address || 'Czech Republic',
            stop.campsite.latitude,
            stop.campsite.longitude,
            'Czech Republic',
            'CZ',
            'CZE',
            stop.campsite.photos[0] || null
          ]
        })

        campsiteId = newCampsiteResult.rows[0].id as number
      }

      // Calculate visit dates
      const tripStartDate = new Date()
      const visitStartDate = new Date(tripStartDate.getTime() + (stop.day - 1) * 24 * 60 * 60 * 1000)
      const visitEndDate = new Date(visitStartDate.getTime() + stop.nights * 24 * 60 * 60 * 1000)

      // Save as planned visit (not actual visit)
      await db.execute({
        sql: `
          INSERT INTO planned_visits (
            trip_id,
            campsite_id,
            planned_date_from,
            planned_date_to,
            estimated_cost,
            ai_generated_activities,
            ai_generated_highlights
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          tripId,
          campsiteId,
          visitStartDate.toISOString().split('T')[0],
          visitEndDate.toISOString().split('T')[0],
          stop.estimatedCost,
          JSON.stringify(stop.activities),
          JSON.stringify(stop.highlights)
        ]
      })
    }

    // Update trip with correct dates based on planned visits
    const firstStop = generatedTrip.stops[0]
    const lastStop = generatedTrip.stops[generatedTrip.stops.length - 1]

    if (firstStop && lastStop) {
      const tripStartDate = new Date()
      const tripEndDate = new Date(tripStartDate.getTime() + generatedTrip.totalDays * 24 * 60 * 60 * 1000)

      await db.execute({
        sql: `
          UPDATE trips
          SET start_date = ?, end_date = ?
          WHERE id = ?
        `,
        args: [
          tripStartDate.toISOString().split('T')[0],
          tripEndDate.toISOString().split('T')[0],
          tripId
        ]
      })
    }

    return NextResponse.json({
      success: true,
      tripId,
      message: "Trip saved successfully as planned itinerary"
    })

  } catch (error) {
    console.error("Error saving trip:", error)

    // Handle database errors
    if (error instanceof Error && error.message.includes("UNIQUE constraint")) {
      return NextResponse.json(
        { error: "A trip with similar details already exists" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to save trip",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Alternative: If planned_visits table doesn't exist, we can create it
export async function GET() {
  try {
    // Check if planned_visits table exists, if not create it
    await db.execute({
      sql: `
        CREATE TABLE IF NOT EXISTS planned_visits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          trip_id INTEGER NOT NULL,
          campsite_id INTEGER NOT NULL,
          planned_date_from DATE NOT NULL,
          planned_date_to DATE NOT NULL,
          estimated_cost DECIMAL(10,2),
          ai_generated_activities TEXT,
          ai_generated_highlights TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
          FOREIGN KEY (campsite_id) REFERENCES campsites(id) ON DELETE CASCADE
        )
      `,
      args: []
    })

    // Also add generated_by_ai column to trips table if it doesn't exist
    try {
      await db.execute({
        sql: `ALTER TABLE trips ADD COLUMN generated_by_ai BOOLEAN DEFAULT 0`,
        args: []
      })
    } catch (alterError) {
      // Column might already exist, ignore error
      console.log("Column generated_by_ai might already exist")
    }

    return NextResponse.json({
      message: "Database schema updated for trip planner",
      status: "ready"
    })

  } catch (error) {
    console.error("Error initializing trip planner schema:", error)
    return NextResponse.json(
      { error: "Failed to initialize database schema" },
      { status: 500 }
    )
  }
}