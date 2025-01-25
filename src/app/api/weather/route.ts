import { NextResponse } from "next/server";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = searchParams.get("lat");
  const longitude = searchParams.get("lon");

  if (!latitude || !longitude) {
    return NextResponse.json(
      { error: "Missing latitude or longitude" },
      { status: 400 }
    );
  }

  if (!OPENWEATHER_API_KEY) {
    return NextResponse.json(
      { error: "Missing OpenWeather API key" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=de`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const weatherData = await response.json();
    return NextResponse.json(weatherData);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}
