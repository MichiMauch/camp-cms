import { NextResponse } from "next/server"
import { CzechTripAI, TripPreferences } from "@/lib/trip-ai-generator"

export async function POST(request: Request) {
  try {
    const body = await request.json() as any

    console.log("Received trip planning request:", body)

    // Validate required fields
    if (!body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      )
    }

    // Validate date range
    const startDate = new Date(body.startDate)
    const endDate = new Date(body.endDate)

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      )
    }

    const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    if (tripDays < 2) {
      return NextResponse.json(
        { error: "Trip must be at least 2 days long" },
        { status: 400 }
      )
    }

    if (tripDays > 30) {
      return NextResponse.json(
        { error: "Trip cannot be longer than 30 days" },
        { status: 400 }
      )
    }

    // Create trip preferences from request body
    const preferences: TripPreferences = {
      startDate: body.startDate,
      endDate: body.endDate,
      tripType: body.tripType || 'mixed',
      maxDrivingTimePerDay: body.maxDrivingTimePerDay || 4,
      preferredAmenities: body.preferredAmenities || [],
      avoidCities: body.avoidCities || false,
      homeCoordinates: [8.05558, 47.33243] // Zürich coordinates
    }

    console.log("Processed preferences:", preferences)

    // Initialize the Czech Trip AI
    const tripAI = new CzechTripAI()

    // Generate the trip
    console.log("Generating trip with AI...")
    const generatedTrip = await tripAI.generateTrip(preferences)

    console.log("Generated trip:", {
      name: generatedTrip.name,
      totalDays: generatedTrip.totalDays,
      totalDistance: generatedTrip.totalDistance,
      stopsCount: generatedTrip.stops.length
    })

    return NextResponse.json(generatedTrip)

  } catch (error) {
    console.error("Error generating trip:", error)

    // Return a more specific error message based on the error type
    if (error instanceof Error) {
      if (error.message.includes("Park4Night")) {
        return NextResponse.json(
          { error: "Unable to fetch campsite data. Please try again later." },
          { status: 503 }
        )
      }

      if (error.message.includes("network") || error.message.includes("fetch")) {
        return NextResponse.json(
          { error: "Network error occurred. Please check your connection and try again." },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      {
        error: "Failed to generate trip. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}