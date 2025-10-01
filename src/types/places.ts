// Place Discovery Types

export interface Coordinates {
  lat: number
  lng: number
}

export interface PlaceDiscoveryRequest {
  // Traditional region-based search
  region?: string

  // New: Coordinate-based search
  center?: Coordinates
  radius?: number // in kilometers
  searchType: 'region' | 'coordinates'
}

export interface DiscoveredPlace {
  name: string
  description: string
  why_interesting: string
  category: string
  location?: string
  estimated_visit_duration?: string
  best_time_to_visit?: string
  practical_tips?: string
  latitude?: number
  longitude?: number
}

export interface PlaceDiscoveryResponse {
  region: string
  places: DiscoveredPlace[]
  generated_at: string
}

export interface Region {
  code: string
  name: string
  continent?: string
}