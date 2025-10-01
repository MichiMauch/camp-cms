// Place Discovery API Endpoint

import { NextRequest, NextResponse } from 'next/server'
import { PlaceDiscoveryService } from '@/lib/places/discovery-service'
import type { PlaceDiscoveryRequest } from '@/types/places'

export async function POST(request: NextRequest) {
  try {
    const body: PlaceDiscoveryRequest = await request.json()

    // Validate search type
    if (!body.searchType || !['region', 'coordinates'].includes(body.searchType)) {
      return NextResponse.json(
        { error: 'searchType is required and must be either "region" or "coordinates"' },
        { status: 400 }
      )
    }

    // Validate region-based search
    if (body.searchType === 'region') {
      if (!body.region || typeof body.region !== 'string') {
        return NextResponse.json(
          { error: 'Region is required for region-based search' },
          { status: 400 }
        )
      }
      if (body.region.trim().length < 2) {
        return NextResponse.json(
          { error: 'Region must be at least 2 characters long' },
          { status: 400 }
        )
      }
    }

    // Validate coordinate-based search
    if (body.searchType === 'coordinates') {
      if (!body.center || typeof body.center.lat !== 'number' || typeof body.center.lng !== 'number') {
        return NextResponse.json(
          { error: 'Valid center coordinates are required for coordinate-based search' },
          { status: 400 }
        )
      }
      if (body.center.lat < -90 || body.center.lat > 90 || body.center.lng < -180 || body.center.lng > 180) {
        return NextResponse.json(
          { error: 'Invalid coordinates provided' },
          { status: 400 }
        )
      }
      if (!body.radius || body.radius < 5 || body.radius > 200) {
        return NextResponse.json(
          { error: 'Radius must be between 5 and 200 kilometers' },
          { status: 400 }
        )
      }
    }

    const searchTarget = body.searchType === 'region'
      ? `region: ${body.region}`
      : `coordinates: ${body.center!.lat.toFixed(4)}, ${body.center!.lng.toFixed(4)} (${body.radius}km radius)`

    console.log(`Discovering places for ${searchTarget}`)

    const discoveryService = new PlaceDiscoveryService()
    const response = await discoveryService.discoverPlaces(body)

    console.log(`Found ${response.places.length} places for ${searchTarget}`)

    return NextResponse.json(response)

  } catch (error) {
    console.error('Place discovery API error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Unknown error occurred' },
      { status: 500 }
    )
  }
}