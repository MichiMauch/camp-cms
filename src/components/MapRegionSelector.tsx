"use client"

import { useState, useCallback, useEffect } from 'react'
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox'
import { MapPin, Crosshair, Globe } from 'lucide-react'
import type { Coordinates } from '@/types/places'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapRegionSelectorProps {
  center: Coordinates | null
  radius: number
  onCenterChange: (center: Coordinates) => void
  onRadiusChange: (radius: number) => void
}

export function MapRegionSelector({
  center,
  radius,
  onCenterChange,
  onRadiusChange
}: MapRegionSelectorProps) {
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  // Default to center of Europe if no center provided
  const defaultCenter = center || { lat: 50.0, lng: 10.0 }

  // Create circle for radius visualization
  const createCircle = useCallback((center: Coordinates, radiusKm: number) => {
    const points = 64
    const coords = []
    const earthRadiusKm = 6371

    for (let i = 0; i <= points; i++) {
      const angle = (i * 360) / points
      const angleRad = (angle * Math.PI) / 180

      const lat = center.lat + (radiusKm / earthRadiusKm) * (180 / Math.PI) * Math.cos(angleRad)
      const lng = center.lng + (radiusKm / earthRadiusKm) * (180 / Math.PI) * Math.sin(angleRad) / Math.cos((center.lat * Math.PI) / 180)

      coords.push([lng, lat])
    }

    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coords]
      }
    }
  }, [])

  // Handle map click
  const handleMapClick = useCallback((event: any) => {
    const { lng, lat } = event.lngLat
    const newCenter = { lat, lng }
    onCenterChange(newCenter)
    reverseGeocode(newCenter)
  }, [onCenterChange])

  // Reverse geocoding to get location name
  const reverseGeocode = async (coords: Coordinates) => {
    setIsLoadingLocation(true)
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&language=de`
      )

      if (response.ok) {
        const data = await response.json() as { features?: { place_name: string }[] }
        if (data.features && data.features.length > 0) {
          const placeName = data.features[0].place_name
          setSelectedLocation(placeName)
        }
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
      setSelectedLocation(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`)
    } finally {
      setIsLoadingLocation(false)
    }
  }

  // Get user's current location
  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsLoadingLocation(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          onCenterChange(newCenter)
          reverseGeocode(newCenter)
        },
        (error) => {
          console.error('Geolocation error:', error)
          setIsLoadingLocation(false)
        }
      )
    }
  }

  // Initial reverse geocoding when center changes
  useEffect(() => {
    if (center) {
      reverseGeocode(center)
    }
  }, [center])

  const circleFeature = center ? createCircle(center, radius) : null

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="space-y-4">
          {/* Current Location Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gewählter Standort
            </label>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-900">
                {isLoadingLocation ? 'Lade Standort...' : selectedLocation || 'Klicken Sie auf die Karte'}
              </span>
            </div>
            {center && (
              <div className="text-xs text-gray-500 mt-1">
                {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
              </div>
            )}
          </div>

          {/* Radius Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suchradius: {radius} km
            </label>
            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={radius}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5 km</span>
              <span>200 km</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={getCurrentLocation}
              disabled={isLoadingLocation}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
            >
              <Crosshair className="w-4 h-4" />
              <span>Mein Standort</span>
            </button>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="relative h-[400px] rounded-lg overflow-hidden border border-gray-200">
        <Map
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
          initialViewState={{
            latitude: defaultCenter.lat,
            longitude: defaultCenter.lng,
            zoom: 6
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          onClick={handleMapClick}
          cursor="crosshair"
        >
          {/* Center Marker */}
          {center && (
            <Marker
              latitude={center.lat}
              longitude={center.lng}
              anchor="center"
            >
              <div className="relative">
                <div className="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Suchzentrum
                </div>
              </div>
            </Marker>
          )}

          {/* Radius Circle */}
          {center && circleFeature && (
            <Source id="radius-circle" type="geojson" data={circleFeature}>
              <Layer
                id="radius-circle-fill"
                type="fill"
                paint={{
                  'fill-color': '#3b82f6',
                  'fill-opacity': 0.1
                }}
              />
              <Layer
                id="radius-circle-stroke"
                type="line"
                paint={{
                  'line-color': '#3b82f6',
                  'line-width': 2,
                  'line-opacity': 0.8
                }}
              />
            </Source>
          )}
        </Map>

        {/* Map Instructions Overlay */}
        <div className="absolute top-2 left-2 bg-white bg-opacity-90 rounded-lg p-3 text-sm text-gray-700 max-w-xs">
          <div className="flex items-center space-x-2 mb-1">
            <Globe className="w-4 h-4 text-blue-600" />
            <span className="font-medium">Suchbereich wählen</span>
          </div>
          <p className="text-xs">
            Klicken Sie auf die Karte, um das Zentrum des Suchbereichs festzulegen.
          </p>
        </div>
      </div>
    </div>
  )
}