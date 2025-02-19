import { Metadata } from "next";

interface PageProps {
  params: { id: string };
}

const BASE_IMAGE_URL = "https://pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev/";
const DEFAULT_IMAGE_EXTENSION = ".webp";

// Funktion zum Abrufen der Trip-Daten mit absoluter URL
async function getTrip(id: string) {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const requestUrl = `${baseUrl}/api/trips/${id}`;
    console.log("🔍 API-Request:", requestUrl);

    const response = await fetch(requestUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`❌ Fehler beim Abrufen des Trips: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log("✅ API Response:", JSON.stringify(data, null, 2));

    if (!data || !data.trip) {
      console.error("❌ API-Daten enthalten keinen gültigen Trip.");
      return null;
    }

    return data.trip;
  } catch (error) {
    console.error("❌ Fehler beim Abrufen des Trips:", error);
    return null;
  }
}

// Funktion zur Berechnung der Trip-Tage
function calculateTripDays(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Funktion zur Datumformatierung im Schweizer Format
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-CH", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// **generateMetadata in `layout.tsx` integriert**
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const trip = await getTrip(params.id);

  if (!trip) {
    return {
      title: "Trip nicht gefunden | WomoLog",
      description: "Dieser Trip konnte nicht gefunden werden.",
    };
  }

  const tripDays = calculateTripDays(trip.start_date, trip.end_date);
  const teaserImage =
    trip.campsites.length > 0
      ? `${BASE_IMAGE_URL}${trip.campsites[0].teaser_image}${DEFAULT_IMAGE_EXTENSION}`
      : "";

  return {
    metadataBase: new URL("https://womolog.ch"),
    title: `${trip.name} Trip`,
    description: `Den ${trip.name} Trip machten wir vom ${formatDate(
      trip.start_date
    )} bis ${formatDate(trip.end_date)}, dabei legten wir ${
      trip.total_distance
    } km zurück und waren innerhalb von ${tripDays} Tagen an ${
      trip.campsites.length
    } Orten.`,
    openGraph: {
      title: `${trip.name} Trip`,
      description: `Den ${trip.name} Trip machten wir vom ${formatDate(
        trip.start_date
      )} bis ${formatDate(trip.end_date)}, dabei legten wir ${
        trip.total_distance
      } km zurück und waren innerhalb von ${tripDays} Tagen an ${
        trip.campsites.length
      } Orten.`,
      url: `https://womolog.ch/trip/${params.id}`,
      images: teaserImage
        ? [{ url: teaserImage, width: 1200, height: 630, alt: trip.name }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${trip.name} Trip`,
      description: `Den ${trip.name} Trip machten wir vom ${formatDate(
        trip.start_date
      )} bis ${formatDate(trip.end_date)}, dabei legten wir ${
        trip.total_distance
      } km zurück und waren innerhalb von ${tripDays} Tagen an ${
        trip.campsites.length
      } Orten.`,
      images: teaserImage ? [teaserImage] : [],
    },
  };
}

// Standard `layout.tsx` für die Trip-Detailseite
export default function TripDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
