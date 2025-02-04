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

    // Kilometer pro Jahr
    const yearlyDistanceResult = await db.execute({
      sql: `
        SELECT 
          strftime('%Y', start_date) as year,
          COALESCE(SUM(total_distance), 0) as total_distance
        FROM trips
        GROUP BY strftime('%Y', start_date)
        ORDER BY year DESC
      `,
      args: [],
    })
    const yearlyDistances = yearlyDistanceResult.rows.map((row) => ({
      year: row.year,
      kilometers: Number(row.total_distance),
    }))

    // Neue Abfrage: Trips mit mehreren Besuchen
    const multiVisitTripsResult = await db.execute({
      sql: `
        SELECT COUNT(*) as count
        FROM (
          SELECT trip_id
          FROM visits
          WHERE trip_id IS NOT NULL
          GROUP BY trip_id
          HAVING COUNT(*) > 1
        ) multi_visit_trips
      `,
      args: [],
    })
    const multiVisitTrips = Number(multiVisitTripsResult.rows[0].count)

    // Final response
    return NextResponse.json({
      totalVisits,
      totalCampsites,
      currentYearVisits,
      currentYearCampsites,
      allCampsites,
      totalNights,
      currentYearNights,
      multiVisitTrips,
      distance: {
        total: totalDistance,
        averagePerTrip: averageDistance,
        currentYear: {
          total: currentYearDistance,
          averagePerTrip: currentYearAverageDistance,
        },
      },
      yearlyDistances,
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

