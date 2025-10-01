import { NextRequest, NextResponse } from 'next/server'
import { PlaceDatabaseService } from '@/lib/places/database-service'
import type { DiscoveredPlace } from '@/types/places'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { places?: any[], region?: string }

    // Validate request body
    if (!body.places || !Array.isArray(body.places)) {
      return NextResponse.json(
        { error: 'Places array is required' },
        { status: 400 }
      )
    }

    if (!body.region || typeof body.region !== 'string') {
      return NextResponse.json(
        { error: 'Region is required' },
        { status: 400 }
      )
    }

    const { places, region } = body as { places: DiscoveredPlace[], region: string }

    // Validate places
    for (const place of places) {
      if (!place.name || typeof place.name !== 'string') {
        return NextResponse.json(
          { error: 'Each place must have a valid name' },
          { status: 400 }
        )
      }
    }

    // Save places to database
    const databaseService = new PlaceDatabaseService()
    const savedPlaces = await databaseService.savePlaces(places, region)

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${savedPlaces.length} places`,
      data: {
        savedPlaces: savedPlaces.length,
        places: savedPlaces
      }
    })

  } catch (error) {
    console.error('Error saving places:', error)

    return NextResponse.json(
      {
        error: 'Failed to save places',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve saved places
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region')
    const category = searchParams.get('category')
    const limit = searchParams.get('limit')

    const databaseService = new PlaceDatabaseService()

    const filters = {
      region: region || undefined,
      category: category || undefined,
      limit: limit ? parseInt(limit) : undefined
    }

    const places = await databaseService.getPlaces(filters)

    return NextResponse.json({
      success: true,
      data: places
    })

  } catch (error) {
    console.error('Error retrieving places:', error)

    return NextResponse.json(
      {
        error: 'Failed to retrieve places',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}