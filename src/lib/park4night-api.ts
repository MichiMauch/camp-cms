// Park4Night API Integration
// Based on: https://github.com/gtoselli/park4night-api

interface Park4NightPlace {
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  rating: number
  price: number
  type: string
  amenities: string[]
  description: string
  photos: string[]
  address: string
  phone?: string
  website?: string
  opening_hours?: string
}

interface Park4NightSearchParams {
  country?: string
  latitude?: number
  longitude?: number
  radius?: number // in km
  type?: 'camping' | 'parking' | 'service' | 'all'
  min_rating?: number
  max_price?: number
  amenities?: string[]
  limit?: number
}

class Park4NightAPI {
  private baseUrl = 'https://api.park4night.com/api'
  private apiKey: string | null = null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.PARK4NIGHT_API_KEY || null
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`)

    // Add API key if available
    if (this.apiKey) {
      params.api_key = this.apiKey
    }

    // Add parameters to URL
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key].toString())
      }
    })

    console.log('Park4Night API Request:', url.toString())

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CampCMS/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`Park4Night API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Park4Night API request failed:', error)
      throw error
    }
  }

  async searchPlaces(params: Park4NightSearchParams): Promise<Park4NightPlace[]> {
    try {
      const response = await this.makeRequest('/places/search', {
        country: params.country,
        lat: params.latitude,
        lng: params.longitude,
        radius: params.radius || 50,
        type: params.type || 'all',
        min_rating: params.min_rating || 3,
        max_price: params.max_price,
        amenities: params.amenities?.join(','),
        limit: params.limit || 100
      })

      return this.transformPlaces((response as any).places || (response as any).data || [])
    } catch (error) {
      console.error('Error searching places:', error)
      return []
    }
  }

  async getPlaceDetails(placeId: number): Promise<Park4NightPlace | null> {
    try {
      const response = await this.makeRequest(`/places/${placeId}`)
      return this.transformPlace((response as any).place || (response as any).data)
    } catch (error) {
      console.error('Error getting place details:', error)
      return null
    }
  }

  async searchByCountry(countryCode: string, options: Omit<Park4NightSearchParams, 'country'> = {}): Promise<Park4NightPlace[]> {
    return this.searchPlaces({
      country: countryCode,
      ...options
    })
  }

  private transformPlaces(places: any[]): Park4NightPlace[] {
    return places.map(place => this.transformPlace(place)).filter(Boolean) as Park4NightPlace[]
  }

  private transformPlace(place: any): Park4NightPlace | null {
    if (!place) return null

    try {
      return {
        id: place.id || place.place_id,
        name: place.name || place.title || 'Unnamed Place',
        latitude: parseFloat(place.latitude || place.lat),
        longitude: parseFloat(place.longitude || place.lng),
        country: place.country || place.country_code,
        rating: parseFloat(place.rating || place.average_rating || 0),
        price: parseFloat(place.price || place.cost || 0),
        type: place.type || place.category || 'unknown',
        amenities: this.parseAmenities(place.amenities || place.services || []),
        description: place.description || place.comment || '',
        photos: this.parsePhotos(place.photos || place.images || []),
        address: place.address || place.full_address || '',
        phone: place.phone || place.telephone,
        website: place.website || place.url,
        opening_hours: place.opening_hours || place.hours
      }
    } catch (error) {
      console.error('Error transforming place:', error, place)
      return null
    }
  }

  private parseAmenities(amenities: any): string[] {
    if (Array.isArray(amenities)) {
      return amenities.map(a => typeof a === 'string' ? a : a.name || a.type).filter(Boolean)
    }
    if (typeof amenities === 'string') {
      return amenities.split(',').map(a => a.trim()).filter(Boolean)
    }
    return []
  }

  private parsePhotos(photos: any): string[] {
    if (Array.isArray(photos)) {
      return photos.map(p => typeof p === 'string' ? p : p.url || p.src).filter(Boolean)
    }
    return []
  }
}

// Czech Republic specific helper functions
export class CzechTripPlanner {
  private api: Park4NightAPI

  constructor(apiKey?: string) {
    this.api = new Park4NightAPI(apiKey)
  }

  async getCzechCampingPlaces(options: {
    minRating?: number
    maxPrice?: number
    amenities?: string[]
  } = {}): Promise<Park4NightPlace[]> {
    return this.api.searchByCountry('CZ', {
      type: 'camping',
      min_rating: options.minRating || 3.5,
      max_price: options.maxPrice || 50,
      amenities: options.amenities,
      limit: 200
    })
  }

  async getPlacesNearRoute(coordinates: [number, number][], radiusKm: number = 30): Promise<Park4NightPlace[]> {
    const allPlaces: Park4NightPlace[] = []

    for (const [lng, lat] of coordinates) {
      const places = await this.api.searchPlaces({
        latitude: lat,
        longitude: lng,
        radius: radiusKm,
        country: 'CZ',
        type: 'camping',
        min_rating: 3.0
      })
      allPlaces.push(...places)
    }

    // Remove duplicates
    const uniquePlaces = allPlaces.filter((place, index, self) =>
      index === self.findIndex(p => p.id === place.id)
    )

    return uniquePlaces.sort((a, b) => b.rating - a.rating)
  }

  getCzechRegions(): Record<string, { name: string; coordinates: [number, number]; radius: number }> {
    return {
      prague: { name: 'Praha Region', coordinates: [14.4378, 50.0755], radius: 50 },
      south_bohemia: { name: 'South Bohemia', coordinates: [14.3255, 48.9747], radius: 80 },
      west_bohemia: { name: 'West Bohemia', coordinates: [13.3775, 49.7384], radius: 60 },
      north_bohemia: { name: 'North Bohemia', coordinates: [14.2071, 50.6663], radius: 70 },
      east_bohemia: { name: 'East Bohemia', coordinates: [15.8318, 50.2103], radius: 70 },
      south_moravia: { name: 'South Moravia', coordinates: [16.6068, 49.1951], radius: 80 },
      north_moravia: { name: 'North Moravia', coordinates: [17.9004, 49.8209], radius: 60 }
    }
  }

  async getPlacesByRegion(regionKey: string): Promise<Park4NightPlace[]> {
    const regions = this.getCzechRegions()
    const region = regions[regionKey]

    if (!region) {
      throw new Error(`Unknown region: ${regionKey}`)
    }

    return this.api.searchPlaces({
      latitude: region.coordinates[1],
      longitude: region.coordinates[0],
      radius: region.radius,
      country: 'CZ',
      type: 'camping',
      min_rating: 3.0
    })
  }
}

export { Park4NightAPI, type Park4NightPlace, type Park4NightSearchParams }