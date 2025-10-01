import { useState, useCallback, useRef } from 'react'
import { DiscoveredPlace } from '@/types/places'
import { calculateRouteMapbox, RouteData } from '@/lib/route-service'

export interface RouteState {
  data: RouteData | null
  isLoading: boolean
  error: string | null
  isVisible: boolean
}

export function useRouteCalculation() {
  const [routeState, setRouteState] = useState<RouteState>({
    data: null,
    isLoading: false,
    error: null,
    isVisible: false
  })

  // Track the last places to avoid unnecessary recalculations
  const lastPlacesRef = useRef<DiscoveredPlace[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

  const calculateRoute = useCallback(async (places: DiscoveredPlace[]) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Check if places have actually changed
    const placesChanged = !arePlacesEqual(places, lastPlacesRef.current)
    if (!placesChanged && routeState.data) {
      return // Use cached route data
    }

    lastPlacesRef.current = places

    // Filter places with valid coordinates
    const validPlaces = places.filter(place =>
      place.latitude !== undefined &&
      place.longitude !== undefined &&
      !isNaN(place.latitude) &&
      !isNaN(place.longitude)
    )

    if (validPlaces.length < 2) {
      setRouteState(prev => ({
        ...prev,
        data: null,
        error: 'Mindestens 2 Orte mit Koordinaten erforderlich',
        isLoading: false
      }))
      return
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    setRouteState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }))

    try {
      const routeData = await calculateRouteMapbox(validPlaces)

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      if (routeData) {
        setRouteState(prev => ({
          ...prev,
          data: routeData,
          isLoading: false,
          error: null
        }))
      } else {
        setRouteState(prev => ({
          ...prev,
          data: null,
          isLoading: false,
          error: 'Route konnte nicht berechnet werden. Überprüfen Sie die Koordinaten der Orte.'
        }))
      }
    } catch (error) {
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      console.error('Route calculation error:', error)

      let errorMessage = 'Unbekannter Fehler bei der Routenberechnung'
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = 'API-Konfigurationsfehler. Bitte kontaktieren Sie den Administrator.'
        } else if (error.message.includes('No route found')) {
          errorMessage = 'Keine Route zwischen den Orten gefunden. Überprüfen Sie die Koordinaten.'
        } else if (error.message.includes('Network')) {
          errorMessage = 'Netzwerkfehler. Überprüfen Sie Ihre Internetverbindung.'
        } else {
          errorMessage = error.message
        }
      }

      setRouteState(prev => ({
        ...prev,
        data: null,
        isLoading: false,
        error: errorMessage
      }))
    }
  }, [routeState.data])

  const toggleRouteVisibility = useCallback(() => {
    setRouteState(prev => ({
      ...prev,
      isVisible: !prev.isVisible
    }))
  }, [])

  const clearRoute = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setRouteState({
      data: null,
      isLoading: false,
      error: null,
      isVisible: false
    })
    lastPlacesRef.current = []
  }, [])

  return {
    routeState,
    calculateRoute,
    toggleRouteVisibility,
    clearRoute
  }
}

/**
 * Compare two arrays of places to check if they're equal
 * This prevents unnecessary route recalculations
 */
function arePlacesEqual(places1: DiscoveredPlace[], places2: DiscoveredPlace[]): boolean {
  if (places1.length !== places2.length) {
    return false
  }

  return places1.every((place1, index) => {
    const place2 = places2[index]
    return (
      place1.name === place2.name &&
      place1.latitude === place2.latitude &&
      place1.longitude === place2.longitude
    )
  })
}