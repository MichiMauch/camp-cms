const OPENROUTE_API_KEY = process.env.OPENROUTE_API_KEY
const HOME_COORDINATES = [8.05558, 47.33243] // [longitude, latitude]
const MAX_DAYS_BETWEEN_TRIPS = 0 // Wenn auch nur 1 Tag zwischen Besuchen liegt, war man zu Hause

export interface Visit {
  id: number
  date_from: string
  date_to: string
  campsite_id: number
  latitude: number
  longitude: number
}

interface RouteResponse {
  routes: Array<{
    summary: {
      distance: number
      duration: number
    }
    segments: Array<{
      distance: number
      duration: number
    }>
  }>
}

async function calculateRoute(coordinates: number[][]) {
  console.log("\n=== Route Calculation ===")
  console.log("Input coordinates:", coordinates.map((coord) => `[${coord[0]}, ${coord[1]}]`).join(" -> "))

  const body = {
    coordinates,
    profile: "driving-car",
    format: "json",
  }

  try {
    const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
      method: "POST",
      headers: {
        Authorization: OPENROUTE_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenRouteService API error response:", errorText)
      throw new Error(`OpenRouteService API error: ${response.statusText}. Details: ${errorText}`)
    }

    const data: RouteResponse = await response.json()
    const distance = data.routes[0].summary.distance / 1000 // Konvertiere zu Kilometern
    console.log("Route distance:", Math.round(distance), "km")
    console.log("=== End Route Calculation ===\n")
    return distance
  } catch (error) {
    console.error("Error in calculateRoute:", error)
    throw error
  }
}

interface Trip {
  visits: Visit[]
  startDate: Date
  endDate: Date
  coordinates: number[][]
}

export async function calculateTotalDistance(visits: Visit[]) {
  if (!visits || visits.length === 0) {
    console.log("No visits provided for distance calculation")
    return {
      total_distance_km: 0,
      average_distance_per_trip_km: 0,
      visited_places: 0,
      round_trip: true,
    }
  }

  console.log("\n=== Starting Total Distance Calculation ===")
  console.log("Processing", visits.length, "visits")

  // Sortiere Besuche nach Startdatum
  const sortedVisits = [...visits].sort((a, b) => new Date(a.date_from).getTime() - new Date(b.date_from).getTime())

  // Gruppiere Besuche in Trips
  const trips: Trip[] = []
  let currentTrip: Trip | null = null

  for (const visit of sortedVisits) {
    const visitStartDate = new Date(visit.date_from)
    const visitEndDate = new Date(visit.date_to)

    console.log(`\nProcessing visit from ${visit.date_from} to ${visit.date_to}`)
    console.log(`at coordinates [${visit.longitude}, ${visit.latitude}]`)

    if (!currentTrip) {
      // Starte einen neuen Trip
      currentTrip = {
        visits: [visit],
        startDate: visitStartDate,
        endDate: visitEndDate,
        coordinates: [HOME_COORDINATES, [visit.longitude, visit.latitude]],
      }
      console.log("Starting new trip")
    } else {
      // Berechne Tage zwischen Ende des letzten Besuchs und Start des neuen Besuchs
      const lastVisitEndDate = currentTrip.endDate
      const daysBetween = (visitStartDate.getTime() - lastVisitEndDate.getTime()) / (1000 * 60 * 60 * 24)
      console.log(
        `Days between visits (from ${lastVisitEndDate.toISOString()} to ${visitStartDate.toISOString()}): ${daysBetween}`,
      )

      // Nur wenn der nächste Besuch am gleichen Tag beginnt wie der letzte endet,
      // gehört er zum gleichen Trip
      if (daysBetween === 0) {
        // Füge den Besuch zum aktuellen Trip hinzu
        currentTrip.visits.push(visit)
        currentTrip.endDate = visitEndDate
        currentTrip.coordinates.push([visit.longitude, visit.latitude])
        console.log("Added to current trip (same day transition)")
      } else {
        // Beende aktuellen Trip und starte einen neuen
        currentTrip.coordinates.push(HOME_COORDINATES)
        trips.push(currentTrip)
        console.log("Time gap detected, ending current trip and starting new one")

        currentTrip = {
          visits: [visit],
          startDate: visitStartDate,
          endDate: visitEndDate,
          coordinates: [HOME_COORDINATES, [visit.longitude, visit.latitude]],
        }
      }
    }
  }

  // Füge den letzten Trip hinzu
  if (currentTrip) {
    currentTrip.coordinates.push(HOME_COORDINATES)
    trips.push(currentTrip)
  }

  console.log(`\nGrouped visits into ${trips.length} trips`)

  // Berechne die Gesamtdistanz
  let totalDistance = 0
  let tripCount = 0

  try {
    for (const trip of trips) {
      console.log(`\nCalculating distance for trip ${tripCount + 1}`)
      console.log(`Trip contains ${trip.visits.length} visits`)
      console.log(`From ${trip.startDate.toISOString()} to ${trip.endDate.toISOString()}`)

      const tripDistance = await calculateRoute(trip.coordinates)
      console.log(`Trip ${tripCount + 1} total distance: ${Math.round(tripDistance)} km`)

      totalDistance += tripDistance
      tripCount++
    }

    const result = {
      total_distance_km: Math.round(totalDistance),
      average_distance_per_trip_km: Math.round(totalDistance / tripCount),
      visited_places: sortedVisits.length,
      round_trip: true,
    }

    console.log("\n=== Final Calculation Results ===")
    console.log("Total Distance:", result.total_distance_km, "km")
    console.log("Average per Trip:", result.average_distance_per_trip_km, "km")
    console.log("Number of Trips:", tripCount)
    console.log("Visited Places:", result.visited_places)
    console.log("=== End Calculation ===\n")

    return result
  } catch (error) {
    console.error("Error in calculateTotalDistance:", error)
    return {
      total_distance_km: 0,
      average_distance_per_trip_km: 0,
      visited_places: sortedVisits.length,
      round_trip: true,
    }
  }
}

