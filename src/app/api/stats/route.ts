import { NextResponse } from "next/server"
import { db } from "@/lib/turso"

export const dynamic = "force-dynamic"
export const revalidate = 0

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

    // Distanz für das aktuelle Jahr (mit anteiliger Berechnung für Jahreswechsel-Trips)
    const currentYearDistanceResult = await db.execute({
      sql: `
        SELECT 
          COALESCE(SUM(
            CASE 
              WHEN strftime('%Y', start_date) = strftime('%Y', end_date) THEN
                -- Normale Trips: komplette Distanz wenn im aktuellen Jahr
                CASE WHEN strftime('%Y', start_date) = strftime('%Y', 'now') THEN total_distance ELSE 0 END
              ELSE
                -- Jahreswechsel-Trips: anteilige Berechnung
                CASE WHEN strftime('%Y', start_date) = strftime('%Y', 'now') THEN
                  -- Anteil im Start-Jahr
                  CAST(total_distance * (
                    (julianday(strftime('%Y', start_date) || '-12-31') - julianday(start_date) + 1) /
                    (julianday(end_date) - julianday(start_date) + 1)
                  ) AS INTEGER)
                WHEN strftime('%Y', end_date) = strftime('%Y', 'now') THEN
                  -- Anteil im End-Jahr  
                  CAST(total_distance * (
                    (julianday(end_date) - julianday(strftime('%Y', end_date) || '-01-01') + 1) /
                    (julianday(end_date) - julianday(start_date) + 1)
                  ) AS INTEGER)
                ELSE 0 END
            END
          ), 0) as total_distance
        FROM trips
      `,
      args: [],
    })
    const currentYearDistance = Number(currentYearDistanceResult.rows[0].total_distance)

    // Anzahl der Trips im aktuellen Jahr (anteilig für Jahreswechsel-Trips)
    const currentYearTripsResult = await db.execute({
      sql: `
        SELECT 
          COALESCE(SUM(
            CASE 
              WHEN strftime('%Y', start_date) = strftime('%Y', end_date) THEN
                -- Normale Trips: 1 wenn im aktuellen Jahr
                CASE WHEN strftime('%Y', start_date) = strftime('%Y', 'now') THEN 1 ELSE 0 END
              ELSE
                -- Jahreswechsel-Trips: anteilig nach Tagen
                CASE WHEN strftime('%Y', start_date) = strftime('%Y', 'now') THEN
                  -- Anteil im Start-Jahr
                  (julianday(strftime('%Y', start_date) || '-12-31') - julianday(start_date) + 1) /
                  (julianday(end_date) - julianday(start_date) + 1)
                WHEN strftime('%Y', end_date) = strftime('%Y', 'now') THEN
                  -- Anteil im End-Jahr
                  (julianday(end_date) - julianday(strftime('%Y', end_date) || '-01-01') + 1) /
                  (julianday(end_date) - julianday(start_date) + 1)
                ELSE 0 END
            END
          ), 0) as count
        FROM trips
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

    // Kilometer pro Jahr (mit anteiliger Berechnung für Jahreswechsel-Trips)
    const yearlyDistanceResult = await db.execute({
      sql: `
        WITH year_splits AS (
          SELECT 
            trip_id,
            year,
            distance_share
          FROM (
            -- Für jeden Trip: generiere Einträge für jedes Jahr, das er berührt
            SELECT 
              id as trip_id,
              strftime('%Y', start_date) as year,
              CASE 
                WHEN strftime('%Y', start_date) = strftime('%Y', end_date) THEN 
                  total_distance
                ELSE 
                  -- Start-Jahr Anteil
                  CAST(total_distance * (
                    (julianday(strftime('%Y', start_date) || '-12-31') - julianday(start_date) + 1) /
                    (julianday(end_date) - julianday(start_date) + 1)
                  ) AS INTEGER)
              END as distance_share
            FROM trips
            
            UNION ALL
            
            -- End-Jahr für Jahreswechsel-Trips
            SELECT 
              id as trip_id,
              strftime('%Y', end_date) as year,
              CAST(total_distance * (
                (julianday(end_date) - julianday(strftime('%Y', end_date) || '-01-01') + 1) /
                (julianday(end_date) - julianday(start_date) + 1)
              ) AS INTEGER) as distance_share
            FROM trips
            WHERE strftime('%Y', start_date) != strftime('%Y', end_date)
          )
        )
        SELECT 
          year,
          COALESCE(SUM(distance_share), 0) as total_distance
        FROM year_splits
        GROUP BY year
        ORDER BY year DESC
      `,
      args: [],
    })
    const yearlyDistances = yearlyDistanceResult.rows.map((row) => ({
      year: row.year,
      kilometers: Number(row.total_distance),
    }))

    // Ausflüge pro Jahr (mit Jahreswechsel-Trips zu beiden Jahren gezählt)
    const yearlyTripCountResult = await db.execute({
      sql: `
        WITH trip_years AS (
          -- Alle Trips zu ihrem Start-Jahr
          SELECT 
            id, 
            strftime('%Y', start_date) as year
          FROM trips
          
          UNION
          
          -- Jahreswechsel-Trips zusätzlich zu ihrem End-Jahr
          SELECT 
            id, 
            strftime('%Y', end_date) as year
          FROM trips
          WHERE strftime('%Y', start_date) != strftime('%Y', end_date)
        )
        SELECT 
          year,
          COUNT(*) as trip_count
        FROM trip_years
        GROUP BY year
        ORDER BY year DESC
      `,
      args: [],
    })
    const yearlyTripCounts = yearlyTripCountResult.rows.map((row) => ({
      year: row.year,
      trips: Number(row.trip_count),
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

    const multiVisitTripsCurrentYearResult = await db.execute({
      sql: `
        SELECT COUNT(*) as count
        FROM (
          SELECT trip_id
          FROM visits
          WHERE trip_id IS NOT NULL
            AND (
              strftime('%Y', date(date_from)) = strftime('%Y', 'now')
              OR strftime('%Y', date(date_to)) = strftime('%Y', 'now')
            )
          GROUP BY trip_id
          HAVING COUNT(*) > 1
        ) multi_visit_trips
      `,
      args: [],
    })
    const multiVisitTripsCurrentYear = Number(multiVisitTripsCurrentYearResult.rows[0].count)
    
    /// 🔽 Meistbesuchte 5 Campingplätze
    const mostVisitedCampsitesResult = await db.execute({
      sql: `
        SELECT 
          c.name, 
          c.location, 
          c.country, 
          COUNT(v.id) as visit_count
        FROM visits v
        JOIN campsites c ON v.campsite_id = c.id
        GROUP BY c.id
        ORDER BY visit_count DESC
        LIMIT 6
      `,
      args: [],
    })
    const mostVisitedCampsites = mostVisitedCampsitesResult.rows
    // 🔼 Ende: Meistbesuchte 5 Campingplätze

    // 🔽 Anzahl Besuche pro Land (inkl. Ländercode)
    const visitsPerCountryResult = await db.execute({
      sql: `
        SELECT 
          c.country,
          c.country_code,
          COUNT(v.id) as visit_count
        FROM visits v
        JOIN campsites c ON v.campsite_id = c.id
        GROUP BY c.country, c.country_code
        ORDER BY visit_count DESC
      `,
      args: [],
    })

    const visitsPerCountry = visitsPerCountryResult.rows


    // 🟩 Längster Trip: Distanz + Anzahl besuchter Orte
    const longestTripResult = await db.execute(`
      SELECT 
        t.id,
        t.total_distance,
        COUNT(v.id) as visit_count
      FROM trips t
      JOIN visits v ON v.trip_id = t.id
      GROUP BY t.id
      ORDER BY t.total_distance DESC
      LIMIT 1
    `)

    const longestTrip = {
      distance: Number(longestTripResult.rows[0]?.total_distance || 0),
      visitCount: Number(longestTripResult.rows[0]?.visit_count || 0),
    }
    // 🟩 ENDE Längster Trip: Distanz + Anzahl besuchter Orte

    // 🔽 Längster Aufenthalt auf einem Platz
    const longestStayResult = await db.execute({
      sql: `
        SELECT 
          c.name,
          c.location,
          c.country,
          CAST(julianday(date(v.date_to)) - julianday(date(v.date_from)) AS INTEGER) AS duration
        FROM visits v
        JOIN campsites c ON v.campsite_id = c.id
        ORDER BY duration DESC
        LIMIT 1
      `,
      args: [],
    })

    const longestStay = {
      name: longestStayResult.rows[0]?.name || "Unbekannt",
      location: longestStayResult.rows[0]?.location || "-",
      country: longestStayResult.rows[0]?.country || "-",
      duration: Number(longestStayResult.rows[0]?.duration || 0),
    }
    // 🔼 Ende: Längster Aufenthalt


    // 🔽 Korrigierte längste Pause zwischen zwei aufeinanderfolgenden Trips
    const longestTripBreakResult = await db.execute({
      sql: `
        SELECT MAX(
          julianday(next_start) - julianday(end_date)
        ) as max_break
        FROM (
          SELECT 
            end_date,
            LEAD(start_date) OVER (ORDER BY start_date) as next_start
          FROM trips
        ) AS gaps
        WHERE next_start IS NOT NULL
      `,
      args: [],
    })

    const longestTripBreak = Math.round(
      Number(longestTripBreakResult.rows[0]?.max_break || 0)
    )
    // 🔼 Ende: Längste Pause

    // 🔽 Anzahl Visits pro Monat (über alle Jahre, nach date_from)
    const visitsPerMonthResult = await db.execute({
      sql: `
        SELECT 
          strftime('%m', date_from) as month,
          COUNT(*) as count
        FROM visits
        GROUP BY month
        ORDER BY month
      `,
      args: [],
    })

    const visitsPerMonthRaw = visitsPerMonthResult.rows

    const monthNames = [
      "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
      "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"
    ]

    const visitsPerMonth = monthNames.map((name, index) => {
      const monthKey = (index + 1).toString().padStart(2, "0")
      const match = visitsPerMonthRaw.find(row => row.month === monthKey)
      return {
        month: name,
        count: match ? Number(match.count) : 0
      }
    })

    // 🔽 Extrempunkte (Nord / Süd / Ost / West)
    const northResult = await db.execute(`
      SELECT name, location, country, latitude, longitude
      FROM campsites
      ORDER BY latitude DESC
      LIMIT 1
    `)

    const southResult = await db.execute(`
      SELECT name, location, country, latitude, longitude
      FROM campsites
      ORDER BY latitude ASC
      LIMIT 1
    `)

    const eastResult = await db.execute(`
      SELECT name, location, country, latitude, longitude
      FROM campsites
      ORDER BY longitude DESC
      LIMIT 1
    `)

    const westResult = await db.execute(`
      SELECT name, location, country, latitude, longitude
      FROM campsites
      ORDER BY longitude ASC
      LIMIT 1
    `)

    const extremeCampsites = {
      north: northResult.rows[0],
      south: southResult.rows[0],
      east: eastResult.rows[0],
      west: westResult.rows[0],
    }
    // 🔼 Ende: Extrempunkte


    // Final response with no-cache headers
    return NextResponse.json({
      totalVisits,
      extremeCampsites,
      visitsPerMonth,
      longestTripBreak,
      longestStay,
      longestTrip,
      totalCampsites,
      currentYearVisits,
      currentYearCampsites,
      allCampsites,
      totalNights,
      currentYearNights,
      multiVisitTrips,
      visitsPerCountry, // 👈 Neue Statistik ergänzt

      multiVisitTripsCurrentYear,
      mostVisitedCampsites, // 👈 neue Statistik hinzugefügt
      distance: {
        total: totalDistance,
        averagePerTrip: averageDistance,
        currentYear: {
          total: currentYearDistance,
          averagePerTrip: currentYearAverageDistance,
        },
      },
      yearlyDistances,
      yearlyTripCounts,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
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
