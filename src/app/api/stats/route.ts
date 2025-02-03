import { NextResponse } from "next/server"
import { db } from "@/lib/turso"

export async function GET(request: Request) {
  try {
    // Gesamtkilometer aus der trips Tabelle
    const totalDistanceResult = await db.execute({
      sql: `SELECT COALESCE(SUM(total_distance), 0) as total_distance FROM trips`,
      args: [],
    })
    const totalDistance = Number(totalDistanceResult.rows[0].total_distance)

    // Durchschnittliche Distanz pro Trip
    const tripCountResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM trips`,
      args: [],
    })
    const tripCount = Number(tripCountResult.rows[0].count)
    const averageDistance = tripCount > 0 ? Math.round(totalDistance / tripCount) : 0

    // Distanz für das aktuelle Jahr
    const currentYearDistanceResult = await db.execute({
      sql: `
        SELECT COALESCE(SUM(total_distance), 0) as total_distance
        FROM trips
        WHERE strftime('%Y', date(start_date)) = strftime('%Y', 'now')
        OR strftime('%Y', date(end_date)) = strftime('%Y', 'now')
      `,
      args: [],
    })
    const currentYearDistance = Number(currentYearDistanceResult.rows[0].total_distance)

    // Anzahl der Trips im aktuellen Jahr
    const currentYearTripsResult = await db.execute({
      sql: `
        SELECT COUNT(*) as count
        FROM trips
        WHERE strftime('%Y', date(start_date)) = strftime('%Y', 'now')
        OR strftime('%Y', date(end_date)) = strftime('%Y', 'now')
      `,
      args: [],
    })
    const currentYearTrips = Number(currentYearTripsResult.rows[0].count)
    const currentYearAverageDistance = currentYearTrips > 0 ? Math.round(currentYearDistance / currentYearTrips) : 0

    // Rest der Statistiken...
    const visitsResult = await db.execute({
      sql: "SELECT COUNT(*) as count FROM visits",
      args: [],
    })
    const totalVisits = Number(visitsResult.rows[0].count)

    const campsitesResult = await db.execute({
      sql: "SELECT COUNT(*) as count FROM campsites",
      args: [],
    })
    const totalCampsites = Number(campsitesResult.rows[0].count)

    const currentYearVisitsResult = await db.execute({
      sql: `
        SELECT COUNT(*) as count
        FROM visits
        WHERE strftime('%Y', date(date_from)) = strftime('%Y', 'now')
        OR strftime('%Y', date(date_to)) = strftime('%Y', 'now')
      `,
      args: [],
    })
    const currentYearVisits = Number(currentYearVisitsResult.rows[0].count)

    const currentYearCampsitesResult = await db.execute({
      sql: `
        SELECT COUNT(DISTINCT c.id) as count
        FROM campsites c
        INNER JOIN visits v ON v.campsite_id = c.id
        WHERE strftime('%Y', date(v.date_from)) = strftime('%Y', 'now')
        OR strftime('%Y', date(v.date_to)) = strftime('%Y', 'now')
      `,
      args: [],
    })
    const currentYearCampsites = Number(currentYearCampsitesResult.rows[0].count)

    const totalNightsResult = await db.execute({
      sql: `
        SELECT COALESCE(
          SUM(
            CAST(
              (julianday(date(date_to)) - julianday(date(date_from))) AS INTEGER
            )
          ),
          0
        ) as nights
        FROM visits
      `,
      args: [],
    })
    const totalNights = Number(totalNightsResult.rows[0].nights)

    const currentYearNightsResult = await db.execute({
      sql: `
        WITH DateRanges AS (
          SELECT 
            date_from,
            date_to,
            MAX(date(date_from), date(strftime('%Y', 'now') || '-01-01')) AS calc_start,
            MIN(date(date_to), date(strftime('%Y', 'now') || '-12-31')) AS calc_end
          FROM visits
          WHERE 
            (strftime('%Y', date_from) = strftime('%Y', 'now') OR strftime('%Y', date_to) = strftime('%Y', 'now'))
        )
        SELECT 
          COALESCE(
            SUM(
              CAST(
                (julianday(calc_end) - julianday(calc_start)) AS INTEGER
              )
            ),
            0
          ) as nights
        FROM DateRanges
        WHERE calc_end >= calc_start
      `,
      args: [],
    })
    const currentYearNights = Number(currentYearNightsResult.rows[0].nights)

    const allCampsitesResult = await db.execute({
      sql: "SELECT id, name, location, country FROM campsites",
      args: [],
    })
    const allCampsites = allCampsitesResult.rows

    // Alle Campingplätze
    //const allCampsitesResult = await db.execute({
    //  sql: "SELECT id, name, location, country FROM campsites",
    //  args: [],
    //})
    //console.log("All Campsites Result:", allCampsitesResult)

    //if (!allCampsitesResult?.rows) {
    //  throw new Error("Keine Ergebnisse für all campsites gefunden")
    //}
    //const allCampsites = allCampsitesResult.rows

    // Distanzberechnung mit verbessertem Debugging
    //const visitsWithCoordinatesResult = await db.execute({
    //  sql: `
    //    SELECT
    //      v.id,
    //      v.date_from,
    //      v.date_to,
    //      v.campsite_id,
    //      c.latitude,
    //      c.longitude,
    //      c.name
    //    FROM visits v
    //    INNER JOIN campsites c ON c.id = v.campsite_id
    //    ORDER BY v.date_from ASC
    //    LIMIT 3
    //  `,
    //  args: [],
    //})

    // Detailliertes Logging der Rohdaten
    //console.log("Raw coordinates data:", JSON.stringify(visitsWithCoordinatesResult.rows, null, 2))

    //let distance = {
    //  total: 0,
    //  averagePerTrip: 0,
    //  visitedPlaces: 0,
    //  currentYear: {
    //    total: 0,
    //    averagePerTrip: 0,
    //    visitedPlaces: 0,
    //  },
    //}

    //if (visitsWithCoordinatesResult?.rows?.length > 0) {
    //  // Logging der Anzahl gefundener Besuche
    //  console.log(`Found ${visitsWithCoordinatesResult.rows.length} visits with coordinates`)

    //  const visits = visitsWithCoordinatesResult.rows.map((row) => {
    //    // Logging jeder Koordinatenumwandlung
    //    console.log(`Converting coordinates for ${row.name}:`, {
    //      latitude: row.latitude,
    //      longitude: row.longitude,
    //    })

    //    return {
    //      id: Number(row.id),
    //      date_from: String(row.date_from),
    //      date_to: String(row.date_to),
    //      campsite_id: Number(row.campsite_id),
    //      latitude: Number(row.latitude),
    //      longitude: Number(row.longitude),
    //    }
    //  })

    //  // Logging der aufbereiteten Besuche
    //  console.log("Prepared visits for distance calculation:", JSON.stringify(visits, null, 2))

    //  try {
    //    // Prüfe, ob der API-Key vorhanden ist
    //    if (!process.env.OPENROUTE_API_KEY) {
    //      console.error("OpenRoute API Key is missing!")
    //      throw new Error("OpenRoute API Key fehlt")
    //    }

    //    const distanceStats = await calculateTotalDistance(visits)
    //    console.log("Distance calculation result:", distanceStats)

    //    distance = {
    //      total: distanceStats.total_distance_km,
    //      averagePerTrip: distanceStats.average_distance_per_trip_km,
    //      visitedPlaces: distanceStats.visited_places,
    //      currentYear: {
    //        total: 0,
    //        averagePerTrip: 0,
    //        visitedPlaces: 0,
    //      },
    //    }

    //    // Aktuelle Jahr Distanzen
    //    const currentYearVisitsWithCoordinatesResult = await db.execute({
    //      sql: `
    //        SELECT
    //          v.id,
    //          v.date_from,
    //          v.date_to,
    //          v.campsite_id,
    //          c.latitude,
    //          c.longitude,
    //          c.name
    //        FROM visits v
    //        INNER JOIN campsites c ON c.id = v.campsite_id
    //        WHERE strftime('%Y', date(v.date_from)) = strftime('%Y', 'now')
    //        OR strftime('%Y', date(v.date_to)) = strftime('%Y', 'now')
    //        ORDER BY v.date_from ASC
    //        LIMIT 3
    //      `,
    //      args: [],
    //    })

    //    // Logging der aktuellen Jahres-Rohdaten
    //    console.log("Current year raw data:", JSON.stringify(currentYearVisitsWithCoordinatesResult.rows, null, 2))

    //    if (currentYearVisitsWithCoordinatesResult?.rows?.length > 0) {
    //      console.log(`Found ${currentYearVisitsWithCoordinatesResult.rows.length} visits for current year`)

    //      const currentYearVisits = currentYearVisitsWithCoordinatesResult.rows.map((row) => ({
    //        id: Number(row.id),
    //        date_from: String(row.date_from),
    //        date_to: String(row.date_to),
    //        campsite_id: Number(row.campsite_id),
    //        latitude: Number(row.latitude),
    //        longitude: Number(row.longitude),
    //      }))

    //      const currentYearDistanceStats = await calculateTotalDistance(currentYearVisits)
    //      console.log("Current year distance calculation result:", currentYearDistanceStats)

    //      distance.currentYear = {
    //        total: currentYearDistanceStats.total_distance_km,
    //        averagePerTrip: currentYearDistanceStats.average_distance_per_trip_km,
    //        visitedPlaces: currentYearDistanceStats.visited_places,
    //      }
    //    }
    //  } catch (error) {
    //    console.error("Error in distance calculation:", error)
    //    if (error instanceof Error) {
    //      console.error("Error details:", error.message)
    //      console.error("Error stack:", error.stack)
    //    }
    //  }
    //} else {
    //  console.log("No visits with coordinates found")
    //}

    // Final response
    return NextResponse.json({
      totalVisits,
      totalCampsites,
      currentYearVisits,
      currentYearCampsites,
      allCampsites,
      totalNights,
      currentYearNights,
      distance: {
        total: totalDistance,
        averagePerTrip: averageDistance,
        currentYear: {
          total: currentYearDistance,
          averagePerTrip: currentYearAverageDistance,
        },
      },
    })
  } catch (error) {
    console.error("Error in route handler:", error)
    return NextResponse.json(
      {
        error: "Fehler beim Abrufen der Statistiken",
        details: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 },
    )
  }
}

