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

/**
 * Calculate route between multiple places using the API endpoint
 * This ensures proper server-side handling of API keys and responses
 */
export async function calculateRouteMapbox(places: DiscoveredPlace[]): Promise<RouteData | null> {
  const validPlaces = places.filter(place =>
    place.latitude !== undefined &&
    place.longitude !== undefined &&
    !isNaN(place.latitude) &&
    !isNaN(place.longitude)
  )

  if (validPlaces.length < 2) {
    return null
  }

  try {
    console.log('Calculating route for', validPlaces.length, 'places via API')
    const response = await fetch('/api/places/route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ places: validPlaces }),
    })

    if (!response.ok) {
      const errorData = await response.json() as { error?: string }
      console.error('Route API error:', response.status, response.statusText, errorData)
      throw new Error(errorData.error || `API error: ${response.statusText}`)
    }

    const data = await response.json() as { data: any }
    return data.data
  } catch (error) {
    console.error('Route calculation failed:', error)
    throw error
  }
}

/**
 * Format duration in seconds to human readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}min`
  }
  return `${minutes}min`
}

/**
 * Format distance in kilometers to human readable string
 */
export function formatDistance(kilometers: number): string {
  if (kilometers < 1) {
    return `${Math.round(kilometers * 1000)}m`
  }
  return `${Math.round(kilometers * 10) / 10}km`
}