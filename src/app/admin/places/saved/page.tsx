"use client"

import { useState, useEffect } from 'react'
import { Search, Filter, Trash2, Edit, MapPin, Calendar, Clock, Eye } from 'lucide-react'
import { DatabasePlace } from '@/lib/places/database-service'

export default function SavedPlacesPage() {
  const [places, setPlaces] = useState<DatabasePlace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  useEffect(() => {
    loadSavedPlaces()
  }, [])

  const loadSavedPlaces = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (selectedRegion) params.append('region', selectedRegion)
      if (selectedCategory) params.append('category', selectedCategory)

      const res = await fetch(`/api/places/save?${params.toString()}`)

      if (!res.ok) {
        throw new Error('Failed to load saved places')
      }

      const data = await res.json() as { data?: any[] }
      setPlaces(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const deletePlaceById = async (id: number) => {
    if (!confirm('Möchten Sie diesen Ort wirklich löschen?')) return

    try {
      const res = await fetch(`/api/places/save/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        throw new Error('Failed to delete place')
      }

      // Remove from local state
      setPlaces(prev => prev.filter(place => place.id !== id))
    } catch (err) {
      alert('Fehler beim Löschen: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  // Filter places based on search and filters
  const filteredPlaces = places.filter(place => {
    const matchesSearch = !searchQuery ||
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.location?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRegion = !selectedRegion || place.region === selectedRegion
    const matchesCategory = !selectedCategory || place.category === selectedCategory

    return matchesSearch && matchesRegion && matchesCategory
  })

  // Pagination
  const totalPages = Math.ceil(filteredPlaces.length / itemsPerPage)
  const paginatedPlaces = filteredPlaces.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Get unique regions and categories for filters
  const uniqueRegions = [...new Set(places.map(p => p.region).filter(Boolean))]
  const uniqueCategories = [...new Set(places.map(p => p.category).filter(Boolean))]

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
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
    switch (category?.toLowerCase()) {
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="w-8 h-8 text-blue-600" />
            Gespeicherte Orte
          </h1>
          <div className="text-sm text-gray-600">
            {filteredPlaces.length} von {places.length} Orten
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Orte durchsuchen..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Region Filter */}
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Alle Regionen</option>
              {uniqueRegions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Alle Kategorien</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>
                  {getCategoryIcon(category)} {category}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={loadSavedPlaces}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Lädt...
                </>
              ) : (
                <>
                  <Filter className="w-4 h-4" />
                  Aktualisieren
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Fehler:</strong> {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Lade gespeicherte Orte...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPlaces.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {places.length === 0 ? 'Noch keine Orte gespeichert' : 'Keine Orte gefunden'}
            </h2>
            <p className="text-gray-500">
              {places.length === 0
                ? 'Entdecken Sie interessante Orte und speichern Sie sie in der Datenbank.'
                : 'Versuchen Sie andere Suchbegriffe oder Filter.'
              }
            </p>
          </div>
        )}

        {/* Places Grid */}
        {!loading && paginatedPlaces.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedPlaces.map((place) => (
                <div
                  key={place.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {place.name}
                      </h3>
                      <span className="text-2xl ml-2">{getCategoryIcon(place.category)}</span>
                    </div>

                    {/* Category & Location */}
                    <div className="flex items-center gap-2 mb-3">
                      {place.category && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(place.category)}`}>
                          {place.category}
                        </span>
                      )}
                      {place.location && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {place.location}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {place.description && (
                      <p className="text-gray-700 text-sm mb-3 leading-relaxed line-clamp-3">
                        {place.description}
                      </p>
                    )}

                    {/* Why Interesting */}
                    {place.why_interesting && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          💡 Warum besonders
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {place.why_interesting}
                        </p>
                      </div>
                    )}

                    {/* Practical Info */}
                    <div className="space-y-1 text-xs text-gray-500 mb-4">
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
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="text-xs text-gray-400">
                        {place.region} • {new Date(place.created_at).toLocaleDateString('de-DE')}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => deletePlaceById(place.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Zurück
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm border border-gray-300 rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Weiter
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}