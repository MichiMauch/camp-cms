"use client"

import { lazy, Suspense } from 'react'
import { DiscoveredPlace } from '@/types/places'
import { Loader2 } from 'lucide-react'

// Lazy load the actual map component
const PlacesMapComponent = lazy(() => import('./PlacesMapComponent').then(module => ({ default: module.PlacesMapComponent })))

interface LazyPlacesMapProps {
  places: DiscoveredPlace[]
  selectedPlaceIndex: number | null
  onPlaceSelect: (index: number) => void
  hoveredPlaceIndex: number | null
  showRoute?: boolean
  onRouteCalculated?: (routeData: any) => void
}

export function LazyPlacesMap(props: LazyPlacesMapProps) {
  return (
    <div className="lg:sticky lg:top-6 lg:h-fit">
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Karte der Orte
        </h3>

        <Suspense
          fallback={
            <div className="h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Karte wird geladen...</p>
              </div>
            </div>
          }
        >
          <PlacesMapComponent {...props} />
        </Suspense>
      </div>
    </div>
  )
}