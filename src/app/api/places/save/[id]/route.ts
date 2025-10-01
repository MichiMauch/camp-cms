import { NextRequest, NextResponse } from 'next/server'
import { PlaceDatabaseService } from '@/lib/places/database-service'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid place ID' },
        { status: 400 }
      )
    }

    const databaseService = new PlaceDatabaseService()
    const success = await databaseService.deletePlace(id)

    if (!success) {
      return NextResponse.json(
        { error: 'Place not found or could not be deleted' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Place deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting place:', error)

    return NextResponse.json(
      {
        error: 'Failed to delete place',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}