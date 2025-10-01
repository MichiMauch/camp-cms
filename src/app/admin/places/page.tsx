"use client"

import { useState } from 'react'
import { Globe, MapPin, Clock, Calendar, Lightbulb, Search, Loader2, Map, Save, Check, Route, Navigation } from 'lucide-react'
import { RegionService } from '@/lib/places/region-service'
import { LazyPlacesMap } from '@/components/LazyPlacesMap'
import { MapRegionSelector } from '@/components/MapRegionSelector'
import type { DiscoveredPlace, PlaceDiscoveryResponse, Coordinates } from '@/types/places'

export default function PlacesDiscoveryPage() {
  // Region-based search state
  const [selectedRegion, setSelectedRegion] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Coordinate-based search state
  const [searchType, setSearchType] = useState<'region' | 'coordinates'>('region')
  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinates | null>(null)
  const [searchRadius, setSearchRadius] = useState(50)

  // Common state
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<PlaceDiscoveryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlaceIndex, setSelectedPlaceIndex] = useState<number | null>(null)
  const [hoveredPlaceIndex, setHoveredPlaceIndex] = useState<number | null>(null)
  const [showMap, setShowMap] = useState(false) // Changed to false - no auto-show
  const [showRoute, setShowRoute] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const regions = RegionService.getAllRegions()
  const filteredRegions = searchQuery
    ? RegionService.searchRegions(searchQuery)
    : regions

  const savePlacesToDatabase = async (places: DiscoveredPlace[], region: string) => {
    setSaving(true)
    setSaveSuccess(false)

    try {
      const res = await fetch('/api/places/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ places, region })
      })

      if (!res.ok) {
        throw new Error('Failed to save places to database')
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000) // Hide success message after 3 seconds
    } catch (err) {
      console.error('Error saving places:', err)
      // Don't show error to user for auto-save, just log it
    } finally {
      setSaving(false)
    }
  }

  const discoverPlaces = async () => {
    if (searchType === 'region' && !selectedRegion) return
    if (searchType === 'coordinates' && !selectedCoordinates) return

    setLoading(true)
    setError(null)

    try {
      const requestBody = searchType === 'region'
        ? { searchType: 'region', region: selectedRegion }
        : { searchType: 'coordinates', center: selectedCoordinates, radius: searchRadius }

      const res = await fetch('/api/places/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!res.ok) {
        const errorData = await res.json() as { error?: string }
        throw new Error(errorData.error || 'Failed to discover places')
      }

      const data = await res.json() as PlaceDiscoveryResponse
      setResponse(data)

      // Auto-save removed - user controls saving now
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
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

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'natur': return 'bg-green-100 text-green-800'
      case 'kultur': return 'bg-purple-100 text-purple-800'
      case 'geschichte': return 'bg-amber-100 text-amber-800'
      case 'architektur': return 'bg-gray-100 text-gray-800'
      case 'abenteuer': return 'bg-red-100 text-red-800'
      case 'essen': return 'bg-orange-100 text-orange-800'
      case 'kunst': return 'bg-pink-100 text-pink-800'
      case 'spirituell': return 'bg-indigo-100 text-indigo-800'
      case 'wissenschaft': return 'bg-blue-100 text-blue-800'
      case 'unterhaltung': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <Globe className="w-8 h-8 text-blue-600" />
          Orte Entdecken
        </h1>

        {/* Search Method Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Entdecke faszinierende Orte</h2>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setSearchType('region')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                searchType === 'region'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Globe className="w-4 h-4" />
                Region wählen
              </div>
            </button>
            <button
              onClick={() => setSearchType('coordinates')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                searchType === 'coordinates'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Map className="w-4 h-4" />
                Auf Karte wählen
              </div>
            </button>
          </div>

          {/* Region Search */}
          {searchType === 'region' && (
            <div className="space-y-4">
              {/* Search Regions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Regionen durchsuchen
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nach einem Land oder einer Region suchen..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Region Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region auswählen
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Region wählen...</option>
                  {filteredRegions.map((region) => (
                    <option key={region.code} value={region.name}>
                      {region.name} {region.continent && `(${region.continent})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Map Search */}
          {searchType === 'coordinates' && (
            <MapRegionSelector
              center={selectedCoordinates}
              radius={searchRadius}
              onCenterChange={setSelectedCoordinates}
              onRadiusChange={setSearchRadius}
            />
          )}

          {/* Discover Button */}
          <div className="mt-6">
            <button
              onClick={discoverPlaces}
              disabled={(
                (searchType === 'region' && !selectedRegion) ||
                (searchType === 'coordinates' && !selectedCoordinates) ||
                loading
              )}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entdecke faszinierende Orte...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  Orte Entdecken
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {response && (
          <div className="space-y-6">
            {/* Summary & Map Toggle */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    Faszinierende Orte in {response.region}
                  </h2>
                  <p className="text-gray-600">
                    {response.places.length} interessante Orte zum Entdecken gefunden
                  </p>

                  {/* Save Status */}
                  {saving && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Speichere in Datenbank...
                    </div>
                  )}
                  {saveSuccess && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                      <Check className="w-4 h-4" />
                      Erfolgreich gespeichert!
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {/* Save to Database Button */}
                  <button
                    onClick={() => savePlacesToDatabase(response.places, response.region)}
                    disabled={saving}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Speichert...
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        Gespeichert!
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        In DB speichern
                      </>
                    )}
                  </button>

                  {/* Show Map Button */}
                  <button
                    onClick={() => setShowMap(!showMap)}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    <Map className="w-4 h-4" />
                    {showMap ? 'Karte ausblenden' : 'Karte anzeigen'}
                  </button>

                  {/* Show Route Button - only when map is visible and 2+ places */}
                  {showMap && response?.places && response.places.length >= 2 && (
                    <button
                      onClick={() => setShowRoute(!showRoute)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        showRoute
                          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Route className="w-4 h-4" />
                      {showRoute ? 'Route ausblenden' : 'Route berechnen'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Two Column Layout: Places & Map */}
            <div className={`grid gap-6 ${showMap ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
              {/* Places List */}
              <div className="space-y-4">
                {response.places.map((place, index) => (
                  <div
                    key={index}
                    className={`
                      bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 cursor-pointer
                      ${selectedPlaceIndex === index ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-lg'}
                      ${hoveredPlaceIndex === index ? 'bg-blue-50' : ''}
                    `}
                    onClick={() => setSelectedPlaceIndex(selectedPlaceIndex === index ? null : index)}
                    onMouseEnter={() => setHoveredPlaceIndex(index)}
                    onMouseLeave={() => setHoveredPlaceIndex(null)}
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {place.name}
                        </h3>
                        <span className="text-2xl">{getCategoryIcon(place.category)}</span>
                      </div>

                      {/* Category & Location */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(place.category)}`}>
                          {place.category}
                        </span>
                        {place.location && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {place.location}
                          </span>
                        )}
                        {place.latitude && place.longitude && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                            📍 Auf Karte
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                        {place.description}
                      </p>

                      {/* Why Interesting */}
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-1 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" />
                          Warum besonders
                        </h4>
                        <p className="text-sm text-gray-600">
                          {place.why_interesting}
                        </p>
                      </div>

                      {/* Practical Info */}
                      <div className="space-y-2 text-xs text-gray-500">
                        {place.estimated_visit_duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{place.estimated_visit_duration}</span>
                          </div>
                        )}
                        {place.best_time_to_visit && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Beste Zeit: {place.best_time_to_visit}</span>
                          </div>
                        )}
                        {place.practical_tips && (
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-xs text-blue-600 font-medium">
                              💡 {place.practical_tips}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lazy Loaded Map */}
              {showMap && (
                <LazyPlacesMap
                  places={response.places}
                  selectedPlaceIndex={selectedPlaceIndex}
                  onPlaceSelect={(index) => setSelectedPlaceIndex(index === -1 ? null : index)}
                  hoveredPlaceIndex={hoveredPlaceIndex}
                  showRoute={showRoute}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}