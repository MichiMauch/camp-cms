import { db } from "@/lib/turso"
import { calculateTotalDistance } from "./openroute-service"

interface Visit {
  id?: number
  date_from: string
  date_to: string
  campsite_id: number
  latitude: number
  longitude: number
}

async function findExistingTrip(date: string) {
  const result = await db.execute({
    sql: `
      SELECT t.id, t.start_date, t.end_date
      FROM trips t
      JOIN visits v ON v.trip_id = t.id
      WHERE date(t.end_date) = date(?)
      ORDER BY v.date_from DESC
      LIMIT 1
    `,
    args: [date],
  })
  return result.rows[0]
}

async function calculateTripDistance(visits: Visit[]) {
  if (!visits || visits.length === 0) return 0

  const HOME_COORDINATES = [8.05558, 47.33243] // [longitude, latitude]
  let totalDistance = 0

  // Calculate route: Home -> First Campsite
  let coordinates = [HOME_COORDINATES, [visits[0].longitude, visits[0].latitude]]
  let distance = await calculateTotalDistance([
    {
      id: 0,
      date_from: "",
      date_to: "",
      campsite_id: 0,
      latitude: visits[0].latitude,
      longitude: visits[0].longitude,
    },
  ])
  totalDistance += distance.total_distance_km

  // Calculate routes between consecutive campsites
  for (let i = 0; i < visits.length - 1; i++) {
    const currentVisit = visits[i]
    const nextVisit = visits[i + 1]
    distance = await calculateTotalDistance([
      {
        id: 0,
        date_from: "",
        date_to: "",
        campsite_id: 0,
        latitude: nextVisit.latitude,
        longitude: nextVisit.longitude,
      },
    ])
    totalDistance += distance.total_distance_km
  }

  // Calculate route: Last Campsite -> Home
  coordinates = [[visits[visits.length - 1].longitude, visits[visits.length - 1].latitude], HOME_COORDINATES]
  distance = await calculateTotalDistance([
    {
      id: 0,
      date_from: "",
      date_to: "",
      campsite_id: 0,
      latitude: HOME_COORDINATES[1],
      longitude: HOME_COORDINATES[0],
    },
  ])
  totalDistance += distance.total_distance_km

  return Math.round(totalDistance)
}

export async function handleVisitCreation(newVisit: Visit) {
  try {
    // Prüfe, ob es einen passenden Trip gibt
    const existingTrip = await findExistingTrip(newVisit.date_from)
    let tripId: number

    if (existingTrip) {
      // Füge zum existierenden Trip hinzu
      tripId = existingTrip.id as number

      // Hole nur die Besuche dieses Trips
      const tripVisits = await db.execute({
        sql: `
          SELECT 
            v.id,
            v.date_from,
            v.date_to,
            v.campsite_id,
            c.latitude,
            c.longitude
          FROM visits v
          JOIN campsites c ON c.id = v.campsite_id
          WHERE v.trip_id = ?
          ORDER BY v.date_from ASC
        `,
        args: [tripId],
      })

      // Füge den neuen Besuch hinzu
      const allVisits = [
        ...tripVisits.rows.map(row => ({
          id: row.id,
          date_from: row.date_from,
          date_to: row.date_to,
          campsite_id: row.campsite_id,
          latitude: row.latitude,
          longitude: row.longitude,
        } as Visit)),
        newVisit
      ]

      // Berechne neue Gesamtdistanz nur für diesen Trip
      const totalDistance = await calculateTripDistance(allVisits)

      // Aktualisiere Trip
      await db.execute({
        sql: `
          UPDATE trips
          SET total_distance = ?,
              end_date = ?
          WHERE id = ?
        `,
        args: [totalDistance, newVisit.date_to, tripId],
      })
    } else {
      // Erstelle neuen Trip nur für diesen Besuch
      const totalDistance = await calculateTripDistance([newVisit])

      const result = await db.execute({
        sql: `
          INSERT INTO trips (start_date, end_date, total_distance)
          VALUES (?, ?, ?)
          RETURNING id
        `,
        args: [newVisit.date_from, newVisit.date_to, totalDistance],
      })

      tripId = result.rows[0].id as number
    }

    // Füge den Besuch hinzu
    await db.execute({
      sql: `
        INSERT INTO visits (date_from, date_to, campsite_id, trip_id)
        VALUES (?, ?, ?, ?)
      `,
      args: [newVisit.date_from, newVisit.date_to, newVisit.campsite_id, tripId],
    })

    return { success: true, tripId }
  } catch (error) {
    console.error("Error in handleVisitCreation:", error)
    throw error
  }
}

export async function handleVisitDeletion(visitId: number) {
  try {
    // Finde den zugehörigen Trip
    const tripResult = await db.execute({
      sql: `
        SELECT t.id, COUNT(v.id) as visit_count
        FROM trips t
        JOIN visits v ON v.trip_id = t.id
        WHERE t.id = (
          SELECT trip_id 
          FROM visits 
          WHERE id = ?
        )
        GROUP BY t.id
      `,
      args: [visitId],
    })

    if (tripResult.rows.length > 0) {
      const tripId = tripResult.rows[0].id
      const visitCount = tripResult.rows[0].visit_count as number

      if (visitCount === 1) {
        // Wenn es der letzte Besuch im Trip ist, lösche den Trip
        await db.execute({
          sql: "DELETE FROM trips WHERE id = ?",
          args: [tripId],
        })
      } else {
        // Sonst aktualisiere nur die Trip-Distanz
        const remainingVisits = await db.execute({
          sql: `
            SELECT 
              v.id,
              v.date_from,
              v.date_to,
              v.campsite_id,
              c.latitude,
              c.longitude
            FROM visits v
            JOIN campsites c ON c.id = v.campsite_id
            WHERE v.trip_id = ? AND v.id != ?
            ORDER BY v.date_from ASC
          `,
          args: [tripId, visitId],
        })

        const totalDistance = await calculateTripDistance(
          remainingVisits.rows.map(row => ({
            id: row.id,
            date_from: row.date_from,
            date_to: row.date_to,
            campsite_id: row.campsite_id,
            latitude: row.latitude,
            longitude: row.longitude,
          })) as Visit[]
        )

        await db.execute({
          sql: `
            UPDATE trips
            SET total_distance = ?,
                end_date = (
                  SELECT MAX(date_to)
                  FROM visits
                  WHERE trip_id = ? AND id != ?
                )
            WHERE id = ?
          `,
          args: [totalDistance, tripId, visitId, tripId],
        })
      }
    }

    // Lösche den Besuch
    await db.execute({
      sql: "DELETE FROM visits WHERE id = ?",
      args: [visitId],
    })

    return { success: true }
  } catch (error) {
    console.error("Error in handleVisitDeletion:", error)
    throw error
  }
}

