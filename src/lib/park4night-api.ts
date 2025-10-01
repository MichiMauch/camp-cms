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
  private baseUrl = 'https://guest.park4night.com/services/V4.1'
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
      // Park4Night API uses lieuxGetFilter.php endpoint
      const response = await this.makeRequest('/lieuxGetFilter.php', {
        latitude: params.latitude,
        longitude: params.longitude,
        rayon: params.radius || 50, // rayon = radius in French
        limit: params.limit || 100
      })

      // console.log('Park4Night Raw Response:', JSON.stringify(response, null, 2))

      // Handle different response formats
      let places = []
      if (Array.isArray(response)) {
        places = response
      } else if (response && (response as any).data && Array.isArray((response as any).data)) {
        places = (response as any).data
      } else if (response && (response as any).places && Array.isArray((response as any).places)) {
        places = (response as any).places
      } else if (response && (response as any).results && Array.isArray((response as any).results)) {
        places = (response as any).results
      } else {
        console.warn('Unknown Park4Night response format:', response)
        places = []
      }

      console.log(`Found ${places.length} places from Park4Night`)
      const transformedPlaces = this.transformPlaces(places)
      console.log(`Transformed ${transformedPlaces.length} places successfully`)

      if (transformedPlaces.length === 0 && places.length > 0) {
        console.error('Transformation failed! Raw places:', places[0])
      }

      return transformedPlaces
    } catch (error) {
      console.error('Error searching places:', error)
      return []
    }
  }

  async getPlaceDetails(placeId: number): Promise<Park4NightPlace | null> {
    try {
      // Not implementing individual place details for now
      // as the searchPlaces already returns detailed data
      return null
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
      // Handle Park4Night specific field names
      return {
        id: parseInt(place.id || place.lieu_id),
        name: place.titre || place.nom || place.name || 'Camping Place',
        latitude: parseFloat(place.latitude),
        longitude: parseFloat(place.longitude),
        country: place.pays || place.country || 'Unknown',
        rating: parseFloat(place.note_moyenne || place.note || place.rating || 3),
        price: this.parsePrice(place.prix_stationnement || place.prix || place.price || 'gratuit'),
        type: place.code || place.type || 'camping',
        amenities: this.parseAmenities(place),
        description: place.description_en || place.description_fr || place.description_de || place.description || '',
        photos: this.parsePhotos(place.photos || []),
        address: `${place.ville || ''}, ${place.code_postal || ''}`.trim(),
        phone: place.tel || place.telephone || place.phone,
        website: place.site_internet || place.site_web || place.website,
        opening_hours: place.date_fermeture || place.horaires || place.opening_hours
      }
    } catch (error) {
      console.error('Error transforming place:', error, place)
      return null
    }
  }

  private parsePrice(priceStr: string | number): number {
    if (typeof priceStr === 'number') return priceStr
    if (!priceStr || priceStr === 'gratuit' || priceStr === 'no') return 0

    // Extract number from string like "60 CZK at day time"
    const match = priceStr.toString().match(/(\d+)/)
    return match ? parseInt(match[1]) : 20 // Default reasonable price
  }

  private parseAmenities(place: any): string[] {
    const amenities: string[] = []

    // Parse Park4Night amenities from boolean fields
    if (place.electricite === '1') amenities.push('Electricity')
    if (place.point_eau === '1') amenities.push('Water')
    if (place.wifi === '1') amenities.push('WiFi')
    if (place.douche === '1') amenities.push('Shower')
    if (place.wc_public === '1') amenities.push('Toilet')
    if (place.poubelle === '1') amenities.push('Waste Disposal')
    if (place.laverie === '1') amenities.push('Laundry')
    if (place.piscine === '1') amenities.push('Pool')
    if (place.jeux_enfants === '1') amenities.push('Playground')
    if (place.animaux === '1') amenities.push('Pets Allowed')
    if (place.boulangerie === '1') amenities.push('Bakery')
    if (place.gaz === '1') amenities.push('Gas')

    return amenities.length > 0 ? amenities : ['Basic facilities']
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