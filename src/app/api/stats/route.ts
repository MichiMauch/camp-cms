import { NextResponse } from "next/server"
import { db } from "@/lib/turso"

export async function GET(request: Request) {
  try {
    const visitsResult = await db.execute({
      sql: `
        SELECT 
          COUNT(*) AS totalVisits
        FROM visits
      `,
      args: [],
    })

    const campsitesResult = await db.execute({
      sql: `
        SELECT 
          COUNT(*) AS totalCampsites
        FROM campsites
      `,
      args: [],
    })

    // Neue Abfrage für Campingplätze im aktuellen Jahr
    const currentYearCampsitesResult = await db.execute({
      sql: `
        SELECT 
          COUNT(DISTINCT c.id) AS currentYearCampsites
        FROM campsites c
        INNER JOIN visits v ON v.campsite_id = c.id
        WHERE strftime('%Y', date(v.date_from)) = strftime('%Y', 'now')
        OR strftime('%Y', date(v.date_to)) = strftime('%Y', 'now')
      `,
      args: [],
    })

    const currentYearVisitsResult = await db.execute({
      sql: `
        SELECT 
          COUNT(*) AS currentYearVisits
        FROM visits
        WHERE strftime('%Y', date(date_from)) = strftime('%Y', 'now')
        OR strftime('%Y', date(date_to)) = strftime('%Y', 'now')
      `,
      args: [],
    })

    // Verbesserte Berechnung der Übernachtungen
    const totalNightsResult = await db.execute({
      sql: `
        SELECT 
          SUM(
            CAST(
              (julianday(date(date_to)) - julianday(date(date_from))) AS INTEGER
            )
          ) AS totalNights
        FROM visits
      `,
      args: [],
    })

    // Verbesserte Berechnung der Übernachtungen für das aktuelle Jahr
    const currentYearNightsResult = await db.execute({
      sql: `
        SELECT 
          SUM(
            CASE 
              WHEN strftime('%Y', date_from) = strftime('%Y', 'now') AND strftime('%Y', date_to) = strftime('%Y', 'now')
                THEN CAST((julianday(date(date_to)) - julianday(date(date_from))) AS INTEGER)
              WHEN strftime('%Y', date_from) < strftime('%Y', 'now') AND strftime('%Y', date_to) = strftime('%Y', 'now')
                THEN CAST((julianday(date(date_to)) - julianday(date(strftime('%Y', 'now') || '-01-01'))) AS INTEGER)
              WHEN strftime('%Y', date_from) = strftime('%Y', 'now') AND strftime('%Y', date_to) > strftime('%Y', 'now')
                THEN CAST((julianday(date(strftime('%Y', 'now') || '-12-31')) - julianday(date(date_from))) AS INTEGER)
            END
          ) AS currentYearNights
        FROM visits
        WHERE strftime('%Y', date_from) <= strftime('%Y', 'now')
        AND strftime('%Y', date_to) >= strftime('%Y', 'now')
      `,
      args: [],
    })

    // Debug-Logging
    console.log("Total Nights Result:", totalNightsResult.rows[0])
    console.log("Current Year Nights Result:", currentYearNightsResult.rows[0])

    const allCampsitesResult = await db.execute({
      sql: `
        SELECT 
          id, name, location, country
        FROM campsites
      `,
      args: [],
    })

    // Optional: Zusätzliche Debug-Abfrage um alle Besuche des aktuellen Jahres zu sehen
    const debugCurrentYearVisits = await db.execute({
      sql: `
        SELECT date_from, date_to,
          CAST((julianday(date(date_to)) - julianday(date(date_from))) AS INTEGER) as nights
        FROM visits
        WHERE strftime('%Y', date_from) = strftime('%Y', 'now')
        OR strftime('%Y', date(date_to)) = strftime('%Y', 'now')
      `,
      args: [],
    })
    console.log("Debug Current Year Visits:", debugCurrentYearVisits.rows)

    const totalVisits = visitsResult.rows[0].totalVisits
    const totalCampsites = campsitesResult.rows[0].totalCampsites
    const currentYearVisits = currentYearVisitsResult.rows[0].currentYearVisits
    const currentYearCampsites = currentYearCampsitesResult.rows[0].currentYearCampsites
    const allCampsites = allCampsitesResult.rows
    const totalNights = totalNightsResult.rows[0].totalNights || 0
    const currentYearNights = currentYearNightsResult.rows[0].currentYearNights || 0

    return NextResponse.json({
      totalVisits,
      totalCampsites,
      currentYearVisits,
      currentYearCampsites,
      allCampsites,
      totalNights,
      currentYearNights,
      debug: {
        currentYearVisits: debugCurrentYearVisits.rows,
      },
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Fehler beim Abrufen der Statistiken" }, { status: 500 })
  }
}

