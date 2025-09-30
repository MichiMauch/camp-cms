import { CzechTripPlanner, Park4NightPlace } from './park4night-api'
import { calculateTotalDistance } from './openroute-service'

interface TripPreferences {
  startDate: string
  endDate: string
  tripType: 'culture' | 'nature' | 'wellness' | 'beer' | 'mixed'
  maxDrivingTimePerDay?: number // in hours (applies to intermediate days only)
  preferredAmenities?: string[]
  avoidCities?: boolean
  homeCoordinates?: [number, number]
}

interface GeneratedTrip {
  id: string
  name: string
  description: string
  totalDays: number
  totalDistance: number
  estimatedCost: number
  stops: TripStop[]
  route: RouteSegment[]
}

interface TripStop {
  day: number
  campsite: Park4NightPlace
  nights: number
  activities: string[]
  highlights: string[]
  estimatedCost: number
}

interface RouteSegment {
  from: [number, number]
  to: [number, number]
  distance: number
  duration: number // in minutes
  description: string
}

export class CzechTripAI {
  private planner: CzechTripPlanner
  private homeCoordinates: [number, number] = [8.05558, 47.33243] // Zürich

  constructor(apiKey?: string) {
    this.planner = new CzechTripPlanner(apiKey)
  }

  async generateTrip(preferences: TripPreferences): Promise<GeneratedTrip> {
    const tripDays = this.calculateTripDays(preferences.startDate, preferences.endDate)

    // Get suitable campsites based on trip type
    const campsites = await this.getCampsitesForTripType(preferences.tripType)

    // Generate optimal route
    const selectedCampsites = await this.selectOptimalCampsites(campsites, tripDays, preferences)

    // Create trip stops
    const stops = await this.createTripStops(selectedCampsites, tripDays, preferences)

    // Calculate route and distances
    const route = await this.calculateRoute(stops, preferences.homeCoordinates || this.homeCoordinates)

    // Generate trip metadata
    const trip: GeneratedTrip = {
      id: this.generateTripId(),
      name: this.generateTripName(preferences.tripType, tripDays),
      description: this.generateTripDescription(preferences.tripType, stops),
      totalDays: tripDays,
      totalDistance: route.reduce((sum, segment) => sum + segment.distance, 0),
      estimatedCost: this.calculateEstimatedCost(stops, tripDays),
      stops,
      route
    }

    return trip
  }

  private calculateTripDays(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  private async getCampsitesForTripType(tripType: string): Promise<Park4NightPlace[]> {
    switch (tripType) {
      case 'culture':
        return this.getCulturalCampsites()
      case 'nature':
        return this.getNatureCampsites()
      case 'wellness':
        return this.getWellnessCampsites()
      case 'beer':
        return this.getBeerCampsites()
      case 'mixed':
      default:
        return this.getMixedCampsites()
    }
  }

  private async getCulturalCampsites(): Promise<Park4NightPlace[]> {
    const regions = ['prague', 'south_bohemia']
    const allCampsites: Park4NightPlace[] = []

    for (const region of regions) {
      const campsites = await this.planner.getPlacesByRegion(region)
      allCampsites.push(...campsites)
    }

    // Filter for campsites near cultural sites
    return allCampsites.filter(site =>
      site.rating >= 3.5 &&
      (site.description.toLowerCase().includes('prague') ||
       site.description.toLowerCase().includes('castle') ||
       site.description.toLowerCase().includes('historic') ||
       site.name.toLowerCase().includes('český'))
    ).slice(0, 20)
  }

  private async getNatureCampsites(): Promise<Park4NightPlace[]> {
    const regions = ['south_bohemia', 'north_bohemia', 'east_bohemia']
    const allCampsites: Park4NightPlace[] = []

    for (const region of regions) {
      const campsites = await this.planner.getPlacesByRegion(region)
      allCampsites.push(...campsites)
    }

    return allCampsites.filter(site =>
      site.rating >= 3.0 &&
      (site.description.toLowerCase().includes('nature') ||
       site.description.toLowerCase().includes('forest') ||
       site.description.toLowerCase().includes('mountain') ||
       site.description.toLowerCase().includes('lake'))
    ).slice(0, 25)
  }

  private async getWellnessCampsites(): Promise<Park4NightPlace[]> {
    const westBohemia = await this.planner.getPlacesByRegion('west_bohemia')

    return westBohemia.filter(site =>
      site.rating >= 3.5 &&
      (site.description.toLowerCase().includes('spa') ||
       site.description.toLowerCase().includes('thermal') ||
       site.description.toLowerCase().includes('karlovy') ||
       site.description.toLowerCase().includes('marienbad'))
    ).slice(0, 15)
  }

  private async getBeerCampsites(): Promise<Park4NightPlace[]> {
    const regions = ['prague', 'west_bohemia', 'south_bohemia']
    const allCampsites: Park4NightPlace[] = []

    for (const region of regions) {
      const campsites = await this.planner.getPlacesByRegion(region)
      allCampsites.push(...campsites)
    }

    return allCampsites.filter(site =>
      site.rating >= 3.0 &&
      (site.description.toLowerCase().includes('brewery') ||
       site.description.toLowerCase().includes('beer') ||
       site.description.toLowerCase().includes('pilsen') ||
       site.description.toLowerCase().includes('budweis') ||
       site.name.toLowerCase().includes('pivovar'))
    ).slice(0, 15)
  }

  private async getMixedCampsites(): Promise<Park4NightPlace[]> {
    const allCampsites = await this.planner.getCzechCampingPlaces({
      minRating: 3.0,
      maxPrice: 40
    })

    return allCampsites.slice(0, 30)
  }

  private async selectOptimalCampsites(
    campsites: Park4NightPlace[],
    tripDays: number,
    preferences: TripPreferences
  ): Promise<Park4NightPlace[]> {
    const homeCoords = preferences.homeCoordinates || this.homeCoordinates
    const optimalStops = Math.min(Math.max(2, Math.floor(tripDays / 2.5)), 5)

    // Score campsites based on multiple factors with flexible driving time logic
    const scoredCampsites = campsites.map(site => ({
      site,
      score: this.scoreCampsite(site, homeCoords, preferences),
      distanceFromHome: this.calculateDistance(homeCoords, [site.longitude, site.latitude])
    }))

    // Sort by score and select top ones
    scoredCampsites.sort((a, b) => b.score - a.score)

    // Select diverse campsites with flexible distance logic
    const selected: Park4NightPlace[] = []
    for (const scored of scoredCampsites) {
      if (selected.length >= optimalStops) break

      const tooClose = selected.some(existing =>
        this.calculateDistance(
          [existing.longitude, existing.latitude],
          [scored.site.longitude, scored.site.latitude]
        ) < 50 // minimum 50km apart
      )

      // Apply driving time constraints more flexibly
      const isValidForTrip = this.validateCampsiteForTrip(scored.site, selected, preferences, optimalStops)

      if (!tooClose && isValidForTrip) {
        selected.push(scored.site)
      }
    }

    return selected
  }

  private validateCampsiteForTrip(
    site: Park4NightPlace,
    selectedSites: Park4NightPlace[],
    preferences: TripPreferences,
    totalStops: number
  ): boolean {
    const homeCoords = preferences.homeCoordinates || this.homeCoordinates
    const maxDrivingTime = preferences.maxDrivingTimePerDay || 4
    const maxDrivingDistance = maxDrivingTime * 80 // Assume 80km/h average

    // For first stop: driving time from home can be longer (arrival day)
    if (selectedSites.length === 0) {
      const distanceFromHome = this.calculateDistance(homeCoords, [site.longitude, site.latitude])
      return distanceFromHome <= maxDrivingDistance * 1.5 // 50% more driving time allowed on arrival
    }

    // For last stop: consider driving time back home can be longer (departure day)
    if (selectedSites.length === totalStops - 1) {
      const distanceToHome = this.calculateDistance([site.longitude, site.latitude], homeCoords)
      return distanceToHome <= maxDrivingDistance * 1.5 // 50% more driving time allowed on departure
    }

    // For intermediate stops: respect normal driving time limits
    if (selectedSites.length > 0) {
      const lastSite = selectedSites[selectedSites.length - 1]
      const distanceBetween = this.calculateDistance(
        [lastSite.longitude, lastSite.latitude],
        [site.longitude, site.latitude]
      )
      return distanceBetween <= maxDrivingDistance
    }

    return true
  }

  private scoreCampsite(
    site: Park4NightPlace,
    homeCoords: [number, number],
    preferences: TripPreferences
  ): number {
    let score = 0

    // Rating factor (0-40 points)
    score += site.rating * 8

    // Price factor (0-20 points, lower price = higher score)
    // Reasonable budget assumed: prefer sites under €30/night
    score += Math.max(0, 20 - Math.max(0, site.price - 30) * 0.5)

    // Distance from home factor (0-20 points, moderate distance preferred)
    const distanceFromHome = this.calculateDistance(homeCoords, [site.longitude, site.latitude])
    if (distanceFromHome > 200 && distanceFromHome < 800) {
      score += 20
    } else if (distanceFromHome <= 200) {
      score += 10
    }

    // Amenities factor (0-20 points)
    if (preferences.preferredAmenities) {
      const matchingAmenities = site.amenities.filter(amenity =>
        preferences.preferredAmenities!.some(pref =>
          amenity.toLowerCase().includes(pref.toLowerCase())
        )
      )
      score += Math.min(matchingAmenities.length * 5, 20)
    }

    return score
  }

  private async createTripStops(
    campsites: Park4NightPlace[],
    tripDays: number,
    preferences: TripPreferences
  ): Promise<TripStop[]> {
    const stops: TripStop[] = []
    const daysPerStop = Math.max(1, Math.floor(tripDays / campsites.length))

    for (let i = 0; i < campsites.length; i++) {
      const site = campsites[i]
      const nights = i === campsites.length - 1
        ? tripDays - (stops.reduce((sum, stop) => sum + stop.nights, 0))
        : daysPerStop

      stops.push({
        day: stops.reduce((sum, stop) => sum + stop.nights, 0) + 1,
        campsite: site,
        nights: Math.max(1, nights),
        activities: this.generateActivities(site, preferences.tripType),
        highlights: this.generateHighlights(site, preferences.tripType),
        estimatedCost: site.price * nights + this.estimateActivityCosts(preferences.tripType) * nights
      })
    }

    return stops
  }

  private generateActivities(site: Park4NightPlace, tripType: string): string[] {
    const baseActivities = ['Campsite setup', 'Local exploration']

    switch (tripType) {
      case 'culture':
        return [...baseActivities, 'Castle visit', 'Historic town tour', 'Museum visit']
      case 'nature':
        return [...baseActivities, 'Hiking', 'Nature photography', 'Wildlife watching']
      case 'wellness':
        return [...baseActivities, 'Spa treatment', 'Thermal baths', 'Relaxation']
      case 'beer':
        return [...baseActivities, 'Brewery tour', 'Beer tasting', 'Traditional pub visit']
      default:
        return [...baseActivities, 'Sightseeing', 'Local cuisine']
    }
  }

  private generateHighlights(site: Park4NightPlace, tripType: string): string[] {
    const highlights = [site.name]

    if (site.description.toLowerCase().includes('prague')) {
      highlights.push('Prague nearby')
    }
    if (site.rating >= 4.5) {
      highlights.push('Highly rated location')
    }
    if (site.price <= 15) {
      highlights.push('Budget-friendly')
    }

    return highlights
  }

  private estimateActivityCosts(tripType: string): number {
    switch (tripType) {
      case 'culture': return 25 // museums, castles
      case 'nature': return 10 // hiking, minimal costs
      case 'wellness': return 40 // spa treatments
      case 'beer': return 30 // brewery tours, tastings
      default: return 20
    }
  }

  private async calculateRoute(stops: TripStop[], homeCoords: [number, number]): Promise<RouteSegment[]> {
    const route: RouteSegment[] = []

    // Create coordinate array: home -> stops -> home
    const coordinates = [
      homeCoords,
      ...stops.map(stop => [stop.campsite.longitude, stop.campsite.latitude] as [number, number]),
      homeCoords
    ]

    for (let i = 0; i < coordinates.length - 1; i++) {
      const from = coordinates[i]
      const to = coordinates[i + 1]
      const distance = this.calculateDistance(from, to)

      route.push({
        from,
        to,
        distance,
        duration: Math.round(distance * 1.2), // roughly 1.2 minutes per km
        description: i === 0
          ? `Zürich to ${stops[0]?.campsite.name || 'first stop'}`
          : i === coordinates.length - 2
          ? `${stops[stops.length - 1]?.campsite.name || 'last stop'} to Zürich`
          : `${stops[i - 1]?.campsite.name || 'stop'} to ${stops[i]?.campsite.name || 'next stop'}`
      })
    }

    return route
  }

  private calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const R = 6371 // Earth's radius in km
    const dLat = (coord2[1] - coord1[1]) * Math.PI / 180
    const dLon = (coord2[0] - coord1[0]) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private calculateEstimatedCost(stops: TripStop[], totalDays: number): number {
    const campingCosts = stops.reduce((sum, stop) => sum + stop.estimatedCost, 0)
    const fuelCosts = totalDays * 25 // estimated fuel per day
    const foodCosts = totalDays * 35 // estimated food per day

    return campingCosts + fuelCosts + foodCosts
  }

  private generateTripId(): string {
    return `czech-trip-${Date.now()}`
  }

  private generateTripName(tripType: string, days: number): string {
    const typeNames = {
      culture: 'Cultural Discovery',
      nature: 'Nature Explorer',
      wellness: 'Wellness Retreat',
      beer: 'Beer Trail Adventure',
      mixed: 'Grand Tour'
    }

    return `Czech Republic ${(typeNames as any)[tripType] || 'Adventure'} (${days} days)`
  }

  private generateTripDescription(tripType: string, stops: TripStop[]): string {
    const stopNames = stops.map(stop => stop.campsite.name).join(', ')

    const descriptions = {
      culture: `Explore the rich cultural heritage of Czech Republic visiting historical sites and UNESCO landmarks.`,
      nature: `Discover the natural beauty of Czech Republic with hiking, forests, and scenic landscapes.`,
      wellness: `Relax and rejuvenate in Czech Republic's famous spa towns and thermal baths.`,
      beer: `Experience Czech Republic's legendary beer culture with brewery tours and traditional pubs.`,
      mixed: `A comprehensive tour of Czech Republic combining culture, nature, and local experiences.`
    }

    return `${(descriptions as any)[tripType] || descriptions.mixed} Route includes: ${stopNames}.`
  }
}

export { type TripPreferences, type GeneratedTrip, type TripStop, type RouteSegment }