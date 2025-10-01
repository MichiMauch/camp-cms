"use client"

import { Clock, MapPin } from 'lucide-react'
import { RouteData, formatDistance, formatDuration } from '@/lib/route-service'

interface RouteSegmentsProps {
  routeData: RouteData
}

export function RouteSegments({ routeData }: RouteSegmentsProps) {
  if (!routeData.segments || routeData.segments.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-600" />
        Etappen der {routeData.isRoundTrip ? 'Rundroute' : 'Route'}
      </h3>

      <div className="space-y-3">
        {routeData.segments.map((segment, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {segment.from} → {segment.to}
                </div>
                <div className="text-sm text-gray-500">
                  Etappe {index + 1} von {routeData.segments.length}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <MapPin className="w-3 h-3" />
                <span className="font-medium">{formatDistance(segment.distance)}</span>
              </div>
              <div className="flex items-center gap-1 text-blue-600">
                <Clock className="w-3 h-3" />
                <span className="font-medium">{formatDuration(segment.duration)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md">
          <div className="font-semibold text-blue-900">
            Gesamt{routeData.isRoundTrip ? 'e Rundroute' : 'route'}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-blue-700">
              <MapPin className="w-4 h-4" />
              <span className="font-bold">{formatDistance(routeData.distance)}</span>
            </div>
            <div className="flex items-center gap-1 text-blue-700">
              <Clock className="w-4 h-4" />
              <span className="font-bold">{formatDuration(routeData.duration)}</span>
            </div>
          </div>
        </div>

        {routeData.isRoundTrip && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            🔄 Diese Route führt dich wieder zum Ausgangspunkt zurück
          </div>
        )}
      </div>
    </div>
  )
}