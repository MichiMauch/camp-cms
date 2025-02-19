import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const latitude = searchParams.get("latitude")
  const longitude = searchParams.get("longitude")

  console.log("Received coordinates:", { latitude, longitude })

  if (!latitude || !longitude) {
    return NextResponse.json({ error: "Latitude und Longitude sind erforderlich." }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=de`,
      {
        headers: {
          "User-Agent": "PhotoLocationApp/1.0", // Wichtig: Ersetzen Sie dies mit Ihrem App-Namen
          Accept: "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Nominatim API Fehler: ${response.status}`)
    }

    const data = await response.json()
    console.log("Nominatim API response:", data)

    if (!data || !data.address) {
      throw new Error("Keine Adressdaten in der Antwort gefunden")
    }

    const { address } = data

    // Bereite die Daten für die Antwort vor
    const result = {
      display_name: data.display_name,
      address: {
        tourism: address.tourism || address.amenity || address.leisure || "",
        village: address.village || address.town || address.city || "",
        state: address.state || address.county || "",
        country: address.country || "",
        country_code: address.country_code || "",
      },
    }

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    console.error("Nominatim API Fehler:", err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Fehler bei der Nominatim-API-Anfrage.",
      },
      { status: 500 },
    )
  }
}

