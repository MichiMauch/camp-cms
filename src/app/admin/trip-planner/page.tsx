"use client"

import { useState } from "react"
import { Calendar, MapPin, Clock, Route, Sparkles } from "lucide-react"

interface TripPlannerFormData {
  startDate: string
  endDate: string
  tripType: 'culture' | 'nature' | 'wellness' | 'beer' | 'mixed'
  maxDrivingTimePerDay: number
  preferredAmenities: string[]
  avoidCities: boolean
}

interface GeneratedTrip {
  id: string
  name: string
  description: string
  totalDays: number
  totalDistance: number
  estimatedCost: number
  stops: any[]
  route: any[]
}

export default function TripPlannerPage() {
  const [formData, setFormData] = useState<TripPlannerFormData>({
    startDate: '',
    endDate: '',
    tripType: 'mixed',
    maxDrivingTimePerDay: 4,
    preferredAmenities: [],
    avoidCities: false
  })

  const [generatedTrip, setGeneratedTrip] = useState<GeneratedTrip | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tripTypes = [
    { value: 'culture', label: 'Cultural Discovery', icon: '🏰', description: 'Castles, historic towns, UNESCO sites' },
    { value: 'nature', label: 'Nature Explorer', icon: '🌲', description: 'National parks, hiking, landscapes' },
    { value: 'wellness', label: 'Wellness Retreat', icon: '🧘', description: 'Spa towns, thermal baths, relaxation' },
    { value: 'beer', label: 'Beer Trail', icon: '🍺', description: 'Breweries, traditional pubs, beer culture' },
    { value: 'mixed', label: 'Grand Tour', icon: '🗺️', description: 'Best of everything' }
  ]

  const amenityOptions = [
    'Electricity', 'Water', 'WiFi', 'Shower', 'Restaurant', 'Shop', 'Pool', 'Playground'
  ]

  const handleInputChange = (field: keyof TripPlannerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      preferredAmenities: prev.preferredAmenities.includes(amenity)
        ? prev.preferredAmenities.filter(a => a !== amenity)
        : [...prev.preferredAmenities, amenity]
    }))
  }

  const generateTrip = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/trip-planner/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to generate trip')
      }

      const trip = await response.json() as GeneratedTrip
      setGeneratedTrip(trip)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  const saveTrip = async () => {
    if (!generatedTrip) return

    try {
      const response = await fetch('/api/trip-planner/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(generatedTrip)
      })

      if (response.ok) {
        alert('Trip saved successfully!')
      } else {
        throw new Error('Failed to save trip')
      }
    } catch (err) {
      alert('Error saving trip: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <Sparkles className="inline w-10 h-10 mr-2 text-blue-600" />
            AI Trip Planner
          </h1>
          <p className="text-xl text-gray-600">
            Plan your perfect Czech Republic adventure with AI assistance
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Planning Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Plan Your Trip</h2>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Trip Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Route className="inline w-4 h-4 mr-1" />
                Trip Type
              </label>
              <div className="grid grid-cols-1 gap-3">
                {tripTypes.map((type) => (
                  <label key={type.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="tripType"
                      value={type.value}
                      checked={formData.tripType === type.value}
                      onChange={(e) => handleInputChange('tripType', e.target.value)}
                      className="mr-3"
                    />
                    <span className="text-2xl mr-3">{type.icon}</span>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-gray-600">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>


            {/* Driving Time */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Max Driving Time per Day (hours)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Note: First day (arrival) and last day (return home) can exceed this limit
              </p>
              <input
                type="range"
                min="2"
                max="8"
                value={formData.maxDrivingTimePerDay}
                onChange={(e) => handleInputChange('maxDrivingTimePerDay', parseInt(e.target.value))}
                className="w-full mb-2"
              />
              <div className="text-center font-medium">{formData.maxDrivingTimePerDay} hours</div>
            </div>

            {/* Amenities */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <MapPin className="inline w-4 h-4 mr-1" />
                Preferred Amenities
              </label>
              <div className="grid grid-cols-2 gap-2">
                {amenityOptions.map((amenity) => (
                  <label key={amenity} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.preferredAmenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                      className="mr-2"
                    />
                    <span className="text-sm">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.avoidCities}
                  onChange={(e) => handleInputChange('avoidCities', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Avoid busy city centers</span>
              </label>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateTrip}
              disabled={!formData.startDate || !formData.endDate || isGenerating}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Trip...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Trip
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
          </div>

          {/* Generated Trip */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Your Generated Trip</h2>

            {!generatedTrip && !isGenerating && (
              <div className="text-center text-gray-500 py-12">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Fill out the form and click "Generate Trip" to create your AI-powered itinerary!</p>
              </div>
            )}

            {generatedTrip && (
              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">{generatedTrip.name}</h3>
                  <p className="text-gray-600 mb-4">{generatedTrip.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-sm text-blue-600">Duration</div>
                      <div className="font-semibold">{generatedTrip.totalDays} days</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-sm text-green-600">Distance</div>
                      <div className="font-semibold">{Math.round(generatedTrip.totalDistance)} km</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <div className="text-sm text-purple-600">Total Cost</div>
                      <div className="font-semibold">€{Math.round(generatedTrip.estimatedCost)}</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <div className="text-sm text-orange-600">Stops</div>
                      <div className="font-semibold">{generatedTrip.stops.length} places</div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Your Itinerary</h4>
                  <div className="space-y-3">
                    {generatedTrip.stops.map((stop, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium">{stop.campsite.name}</h5>
                          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Day {stop.day} - {stop.nights} night{stop.nights > 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{stop.campsite.address}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="mr-3">★ {stop.campsite.rating.toFixed(1)}</span>
                          <span>€{stop.campsite.price}/night</span>
                        </div>
                        {stop.highlights.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-500 mb-1">Highlights:</div>
                            <div className="flex flex-wrap gap-1">
                              {stop.highlights.map((highlight: string, i: number) => (
                                <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {highlight}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={saveTrip}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700"
                >
                  Save Trip to My Plans
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}