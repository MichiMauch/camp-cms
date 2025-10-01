import { NextRequest, NextResponse } from 'next/server'
import { DiscoveredPlace } from '@/types/places'

export interface RouteSegment {
  from: string
  to: string
  distance: number // in kilometers
  duration: number // in seconds
}

export interface RouteData {
  geometry: GeoJSON.LineString
  distance: number // in kilometers
  duration: number // in seconds
  segments: RouteSegment[]
  isRoundTrip: boolean
}

interface MapboxDirectionsResponse {
  routes: Array<{
    geometry: GeoJSON.LineString
    distance: number
    duration: number
    legs: Array<{
      distance: number
      duration: number
    }>
  }>
}

interface OpenRouteServiceResponse {
  routes: Array<{
    geometry: GeoJSON.LineString
    summary: {
      distance: number
      duration: number
    }
  }>
}

/**
 * Optimize route order using nearest neighbor algorithm
 * Always starts and ends with the first place from the original list
 */
function optimizeRouteOrder(places: DiscoveredPlace[]): DiscoveredPlace[] {
  if (places.length <= 2) {
    return places
  }

  // Always start with the first place from the original input
  const startPlace = places[0]
  const unvisited = places.slice(1) // Remove the first place from unvisited
  const route: DiscoveredPlace[] = [startPlace]

  let current = startPlace

  // Find nearest neighbor iteratively for the remaining places
  while (unvisited.length > 0) {
    let nearestIndex = 0
    let nearestDistance = Number.MAX_VALUE

    for (let i = 0; i < unvisited.length; i++) {
      const distance = calculateDistance(current, unvisited[i])
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = i
      }
    }

    current = unvisited.splice(nearestIndex, 1)[0]
    route.push(current)
  }

  return route
}

/**
 * Calculate straight-line distance between two places (Haversine formula)
 */
function calculateDistance(place1: DiscoveredPlace, place2: DiscoveredPlace): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(place2.latitude! - place1.latitude!)
  const dLon = toRad(place2.longitude! - place1.longitude!)

  const lat1 = toRad(place1.latitude!)
  const lat2 = toRad(place2.latitude!)

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c
}

function toRad(value: number): number {
  return value * Math.PI / 180
}

/**
 * Calculate route using Mapbox Directions API
 */
async function calculateRouteMapbox(places: DiscoveredPlace[]): Promise<RouteData | null> {
  const validPlaces = places.filter(place =>
    place.latitude !== undefined &&
    place.longitude !== undefined &&
    !isNaN(place.latitude) &&
    !isNaN(place.longitude)
  )

  if (validPlaces.length < 2) {
    return null
  }

  // Optimize route order using nearest neighbor algorithm
  const optimizedPlaces = optimizeRouteOrder(validPlaces)

  // Create round trip by adding the first place at the end
  const roundTripPlaces = [...optimizedPlaces, optimizedPlaces[0]]

  // Create coordinates string for Mapbox API
  const coordinates = roundTripPlaces
    .map(place => `${place.longitude},${place.latitude}`)
    .join(';')

  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error('Mapbox access token not configured')
  }

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&steps=true&access_token=${accessToken}`

  try {
    console.log('Calculating route with Mapbox for', optimizedPlaces.length, 'places')
    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Mapbox API error:', response.status, response.statusText, errorText)
      throw new Error(`Mapbox API error: ${response.statusText}`)
    }

    const data: MapboxDirectionsResponse = await response.json()

    if (!data.routes?.[0]) {
      throw new Error('No route found from Mapbox')
    }

    const route = data.routes[0]

    // Create segments from legs data
    const segments: RouteSegment[] = []
    if (route.legs) {
      route.legs.forEach((leg, index) => {
        const fromPlace = index < optimizedPlaces.length ? optimizedPlaces[index] : optimizedPlaces[0]
        const toPlace = index + 1 < optimizedPlaces.length ? optimizedPlaces[index + 1] : optimizedPlaces[0]

        segments.push({
          from: fromPlace.name,
          to: toPlace.name,
          distance: leg.distance / 1000, // Convert to kilometers
          duration: leg.duration
        })
      })
    }

    return {
      geometry: route.geometry,
      distance: route.distance / 1000, // Convert to kilometers
      duration: route.duration,
      segments,
      isRoundTrip: true
    }
  } catch (error) {
    console.error('Mapbox route calculation failed:', error)
    // Fallback to OpenRouteService
    return calculateRouteOpenRoute(optimizedPlaces)
  }
}

/**
 * Fallback route calculation using OpenRouteService API
 */
async function calculateRouteOpenRoute(places: DiscoveredPlace[]): Promise<RouteData | null> {
  if (places.length < 2) {
    return null
  }

  // Create round trip by adding the first place at the end
  const roundTripPlaces = [...places, places[0]]
  const coordinates = roundTripPlaces.map(place => [place.longitude!, place.latitude!])

  const body = {
    coordinates,
    profile: "driving-car",
    format: "geojson",
    geometry_simplify: false
  }

  const apiKey = process.env.OPENROUTE_API_KEY
  if (!apiKey) {
    throw new Error('OpenRouteService API key not configured')
  }

  try {
    console.log('Calculating route with OpenRouteService for', places.length, 'places')
    const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouteService API error:', response.status, response.statusText, errorText)
      throw new Error(`OpenRouteService API error: ${response.statusText}`)
    }

    const data: OpenRouteServiceResponse = await response.json()

    if (!data.routes?.[0]) {
      throw new Error('No route found from OpenRouteService')
    }

    const route = data.routes[0]

    // Create basic segments for OpenRouteService (no detailed leg info available)
    const segments: RouteSegment[] = []
    for (let i = 0; i < places.length; i++) {
      const fromPlace = places[i]
      const toPlace = i + 1 < places.length ? places[i + 1] : places[0]

      // Estimate distance and duration per segment
      const segmentDistance = calculateDistance(fromPlace, toPlace)
      const segmentDuration = (segmentDistance / route.summary.distance) * route.summary.duration

      segments.push({
        from: fromPlace.name,
        to: toPlace.name,
        distance: segmentDistance,
        duration: segmentDuration
      })
    }

    return {
      geometry: route.geometry,
      distance: route.summary.distance / 1000, // Convert to kilometers
      duration: route.summary.duration,
      segments,
      isRoundTrip: true
    }
  } catch (error) {
    console.error('OpenRouteService route calculation failed:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { places } = await request.json() as { places: any[] }

    if (!places || !Array.isArray(places)) {
      return NextResponse.json(
        { error: 'Invalid places data provided' },
        { status: 400 }
      )
    }

    if (places.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 places are required for route calculation' },
        { status: 400 }
      )
    }

    const routeData = await calculateRouteMapbox(places)

    if (!routeData) {
      return NextResponse.json(
        { error: 'Route could not be calculated' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: routeData })

  } catch (error) {
    console.error('Route calculation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to calculate route',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}