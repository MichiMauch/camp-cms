import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = searchParams.get("latitude");
  const longitude = searchParams.get("longitude");
  const radius = searchParams.get("radius") || "3000";

  if (!latitude || !longitude) {
    return NextResponse.json(
      { error: "Latitude und Longitude sind erforderlich." },
      { status: 400 }
    );
  }

  // Erweiterte Overpass-Query: Attraktionen, Fahrradtouren und Wanderwege
  const overpassQuery = `
    [out:json];
    (
      node["tourism"="attraction"](around:${radius},${latitude},${longitude});
      way["tourism"="attraction"](around:${radius},${latitude},${longitude});
      relation["tourism"="attraction"](around:${radius},${latitude},${longitude});

      relation["route"="bicycle"](around:${radius},${latitude},${longitude});
      relation["route"="foot"](around:${radius},${latitude},${longitude});
    );
    out center;`;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Fehler bei der Overpass-API-Anfrage.");
    }

    const data = await response.json();

    // Filtern: Nur Elemente mit `tags` und `tags.name` anzeigen
    const filteredData = {
      ...data,
      elements: data.elements.filter(
        (element: { tags?: { name?: string } }) => element.tags && element.tags.name
      ),
    };

    console.log("Gefilterte Overpass API-Daten:", filteredData); // Debug log
    return NextResponse.json(filteredData);
  } catch (error) {
    console.error("Error fetching data from Overpass API:", error);
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Ein unbekannter Fehler ist aufgetreten.",
      },
      { status: 500 }
    );
  }
}
