"use client"

import { useEffect, useRef, useState } from 'react'
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/mapbox'
import { DiscoveredPlace } from '@/types/places'
import { useRouteCalculation } from '@/hooks/useRouteCalculation'
import { RouteSegments } from '@/components/RouteSegments'
import { formatDistance, formatDuration } from '@/lib/route-service'
import 'mapbox-gl/dist/mapbox-gl.css'

interface PlacesMapComponentProps {
  places: DiscoveredPlace[]
  selectedPlaceIndex: number | null
  onPlaceSelect: (index: number) => void
  hoveredPlaceIndex: number | null
  showRoute?: boolean
  onRouteCalculated?: (routeData: any) => void
}

export function PlacesMapComponent({
  places,
  selectedPlaceIndex,
  onPlaceSelect,
  hoveredPlaceIndex,
  showRoute = false,
  onRouteCalculated
}: PlacesMapComponentProps) {
  const mapRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const { routeState, calculateRoute } = useRouteCalculation()

  // Filter places that have valid coordinates
  const validPlaces = places.filter(place =>
    place.latitude !== undefined &&
    place.longitude !== undefined &&
    !isNaN(place.latitude) &&
    !isNaN(place.longitude)
  )

  // Calculate bounds for all places
  const getBounds = () => {
    if (validPlaces.length === 0) return null

    let minLat = Math.min(...validPlaces.map(p => p.latitude!))
    let maxLat = Math.max(...validPlaces.map(p => p.latitude!))
    let minLng = Math.min(...validPlaces.map(p => p.longitude!))
    let maxLng = Math.max(...validPlaces.map(p => p.longitude!))

    // Add padding
    const latPadding = (maxLat - minLat) * 0.1
    const lngPadding = (maxLng - minLng) * 0.1

    return {
      southwest: [minLng - lngPadding, minLat - latPadding],
      northeast: [maxLng + lngPadding, maxLat + latPadding]
    }
  }

  // Auto-fit map to show all places - only once when map loads
  useEffect(() => {
    if (mapRef.current && mapLoaded && validPlaces.length > 0) {
      const bounds = getBounds()
      if (bounds) {
        mapRef.current.fitBounds(
          [bounds.southwest, bounds.northeast],
          { padding: 40, duration: 1000 }
        )
      }
    }
  }, [mapLoaded, validPlaces.length]) // Only depends on mapLoaded and places count

  // Manual route calculation - only when explicitly requested
  useEffect(() => {
    if (showRoute && validPlaces.length >= 2 && mapLoaded) {
      calculateRoute(validPlaces)
    }
  }, [showRoute, mapLoaded]) // Removed validPlaces dependency to prevent loops

  // Notify parent when route is calculated
  useEffect(() => {
    if (routeState.data && onRouteCalculated) {
      onRouteCalculated(routeState.data)
    }
  }, [routeState.data, onRouteCalculated])

  // Get category icon
  const getCategoryIcon = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'natur': return '🌲'
      case 'kultur': return '🎭'
      case 'geschichte': return '🏛️'
      case 'architektur': return '🏰'
      case 'abenteuer': return '⛰️'
      case 'essen': return '🍽️'
      case 'kunst': return '🎨'
      case 'spirituell': return '🕉️'
      case 'wissenschaft': return '🔬'
      case 'unterhaltung': return '🎡'
      default: return '📍'
    }
  }

  // Get category color
  const getCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case 'natur': return '#10b981' // green
      case 'kultur': return '#8b5cf6' // purple
      case 'geschichte': return '#f59e0b' // amber
      case 'architektur': return '#6b7280' // gray
      case 'abenteuer': return '#ef4444' // red
      case 'essen': return '#f97316' // orange
      case 'kunst': return '#ec4899' // pink
      case 'spirituell': return '#6366f1' // indigo
      case 'wissenschaft': return '#3b82f6' // blue
      case 'unterhaltung': return '#eab308' // yellow
      default: return '#6b7280' // gray
    }
  }

  // Calculate center from valid places
  const getCenter = () => {
    if (validPlaces.length === 0) {
      return { latitude: 49.75, longitude: 15.5 } // fallback to Central Europe
    }

    const avgLat = validPlaces.reduce((sum, place) => sum + place.latitude!, 0) / validPlaces.length
    const avgLng = validPlaces.reduce((sum, place) => sum + place.longitude!, 0) / validPlaces.length

    return { latitude: avgLat, longitude: avgLng }
  }

  const center = getCenter()

  if (validPlaces.length === 0) {
    return (
      <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">🗺️</p>
          <p>Keine Koordinaten verfügbar</p>
          <p className="text-sm">Orte werden nach der Suche hier angezeigt</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative h-[400px] rounded-lg overflow-hidden border border-gray-200">
        <Map
          ref={mapRef}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
          initialViewState={{
            latitude: center.latitude,
            longitude: center.longitude,
            zoom: 6
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          onLoad={() => setMapLoaded(true)}
        >
          {validPlaces.map((place, index) => {
            const isSelected = selectedPlaceIndex === index
            const isHovered = hoveredPlaceIndex === index
            const scale = isSelected ? 1.5 : isHovered ? 1.2 : 1

            return (
              <Marker
                key={index}
                latitude={place.latitude!}
                longitude={place.longitude!}
                onClick={() => onPlaceSelect(index)}
              >
                <div
                  className={`
                    cursor-pointer transition-all duration-200 transform
                    ${isSelected ? 'z-50' : isHovered ? 'z-40' : 'z-30'}
                  `}
                  style={{
                    transform: `scale(${scale})`,
                    filter: isSelected ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none'
                  }}
                >
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold
                      border-2 border-white shadow-lg
                      ${isSelected ? 'ring-2 ring-blue-500' : ''}
                    `}
                    style={{ backgroundColor: getCategoryColor(place.category) }}
                  >
                    {getCategoryIcon(place.category)}
                  </div>
                </div>
              </Marker>
            )
          })}

          {/* Route visualization */}
          {showRoute && routeState.data && (
            <Source
              id="route"
              type="geojson"
              data={{
                type: "Feature",
                properties: {},
                geometry: routeState.data.geometry
              }}
            >
              <Layer
                id="route"
                type="line"
                paint={{
                  "line-color": "#3b82f6",
                  "line-width": 4,
                  "line-opacity": 0.75
                }}
                layout={{
                  "line-join": "round",
                  "line-cap": "round"
                }}
              />
            </Source>
          )}

          {selectedPlaceIndex !== null && selectedPlaceIndex < validPlaces.length && (
            <Popup
              latitude={validPlaces[selectedPlaceIndex].latitude!}
              longitude={validPlaces[selectedPlaceIndex].longitude!}
              closeButton={true}
              closeOnClick={false}
              onClose={() => onPlaceSelect(-1)}
              anchor="bottom"
              offset={[0, -10]}
            >
              <div className="p-2 max-w-xs">
                <h3 className="font-semibold text-sm mb-1">
                  {validPlaces[selectedPlaceIndex].name}
                </h3>
                <p className="text-xs text-gray-600 mb-2">
                  {validPlaces[selectedPlaceIndex].location}
                </p>
                <p className="text-xs leading-relaxed">
                  {validPlaces[selectedPlaceIndex].description}
                </p>
              </div>
            </Popup>
          )}
        </Map>

        {/* Route information overlay */}
        {showRoute && routeState.data && (
          <div className="absolute top-2 left-2 bg-white rounded-lg shadow-md p-3 text-sm z-10">
            <div className="flex items-center gap-2 text-blue-600">
              <span className="w-4 h-1 bg-blue-500 rounded"></span>
              <span className="font-medium">Route</span>
            </div>
            <div className="mt-1 space-y-1 text-xs text-gray-600">
              <div>{formatDistance(routeState.data.distance)}</div>
              <div>{formatDuration(routeState.data.duration)}</div>
            </div>
          </div>
        )}

        {/* Route loading indicator */}
        {showRoute && routeState.isLoading && (
          <div className="absolute top-2 left-2 bg-white rounded-lg shadow-md p-3 text-sm z-10">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span>Route wird berechnet...</span>
            </div>
          </div>
        )}

        {/* Route error indicator */}
        {showRoute && routeState.error && (
          <div className="absolute top-2 left-2 bg-white rounded-lg shadow-md p-3 text-sm z-10">
            <div className="flex items-center gap-2 text-red-600">
              <span>⚠️</span>
              <span>{routeState.error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Route Segments - show below map */}
      {showRoute && routeState.data && (
        <RouteSegments routeData={routeState.data} />
      )}
    </div>
  )
}