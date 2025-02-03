const OPENROUTE_API_KEY = process.env.OPENROUTE_API_KEY
const HOME_COORDINATES = [8.05558, 47.33243] // [longitude, latitude]
const MAX_DAYS_BETWEEN_TRIPS = 5 // Anzahl Tage, nach denen eine Heimreise angenommen wird

export interface Visit {
  id: number
  date_from: string
  date_to: string
  campsite_id: number
  latitude: number
  longitude: number
}

interface RouteResponse {
  features: Array<{
    properties: {
      segments: Array<{
        distance: number
        duration: number
      }>
      summary: {
        distance: number
        duration: number
      }
    }
  }>
}

async function calculateRoute(coordinates: number[][]) {
  const body = {
    coordinates,
    profile: "driving-car",
    format: "json",
  }

  const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
    method: "POST",
    headers: {
      "Authorization": OPENROUTE_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`OpenRouteService API error: ${response.statusText}`)
  }

  const data: RouteResponse = await response.json()
  return data.features[0].properties.summary.distance / 1000 // Konvertiere zu Kilometern
}

export async function calculateTotalDistance(visits: Visit[]) {
  // Sortiere Besuche chronologisch
  const sortedVisits = [...visits].sort((a, b) => 
    new Date(a.date_from).getTime() - new Date(b.date_from).getTime()
  )

  let totalDistance = 0
  let currentTrip: number[][] = [HOME_COORDINATES]
  let lastVisitDate: Date | null = null

  for (let i = 0; i < sortedVisits.length; i++) {
    const visit = sortedVisits[i]
    const visitStartDate = new Date(visit.date_from)
    
    // Prüfe, ob eine neue Reise beginnt
    if (lastVisitDate && 
        (visitStartDate.getTime() - lastVisitDate.getTime()) > (MAX_DAYS_BETWEEN_TRIPS * 24 * 60 * 60 * 1000)) {
      // Füge Heimreise hinzu und berechne die Strecke
      currentTrip.push(HOME_COORDINATES)
      totalDistance += await calculateRoute(currentTrip)
      
      // Starte neue Reise
      currentTrip = [HOME_COORDINATES]
    }

    // Füge aktuellen Besuch zur Route hinzu
    currentTrip.push([visit.longitude, visit.latitude])
    lastVisitDate = new Date(visit.date_to)

    // Wenn es der letzte Besuch ist oder eine große Lücke zum nächsten Besuch besteht
    if (i === sortedVisits.length - 1) {
      currentTrip.push(HOME_COORDINATES)
      totalDistance += await calculateRoute(currentTrip)
    }
  }

  return {
    total_distance_km: Math.round(totalDistance),
    average_distance_per_trip_km: Math.round(totalDistance / sortedVisits.length),
    visited_places: sortedVisits.length,
    round_trip: true
  }
}
