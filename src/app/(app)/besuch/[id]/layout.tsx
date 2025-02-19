import { Metadata } from "next";

const BASE_IMAGE_URL = "https://pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev/";
const DEFAULT_IMAGE_EXTENSION = ".webp";

interface PageProps {
  params: { id: string };
}

// API-Daten abrufen
async function getLastVisit(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const requestUrl = new URL(`/api/visit_detail/${id}`, baseUrl).toString();

    console.log("🔍 API-Request:", requestUrl); // Debugging-Log

    const response = await fetch(requestUrl, {
      cache: "no-store",
    });

    if (!response.ok)
      throw new Error(
        `Fehler beim Abrufen der Campingplatzdetails: ${response.status}`
      );

    const data = await response.json();
    console.log("✅ API Response:", data); // Debugging-Log

    return data;
  } catch (error) {
    console.error("❌ Fehler beim Abrufen der Campingplatzdetails:", error);
    return null;
  }
}

// `generateMetadata` jetzt in `layout.tsx`
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  console.log(
    "✅ generateMetadata wird in layout.tsx aufgerufen mit ID:",
    params.id
  );
  const lastVisit = await getLastVisit(params.id);

  if (!lastVisit) {
    console.log("❌ Kein lastVisit gefunden");
    return {
      title: "Campingplatz nicht gefunden | Womolog.ch",
      description: "Dieser Campingplatz konnte nicht gefunden werden.",
    };
  }

  console.log("🎉 Metadaten erfolgreich gesetzt:", lastVisit);

  const imageUrl = `${BASE_IMAGE_URL}${lastVisit.image}${DEFAULT_IMAGE_EXTENSION}`;

  return {
    title: `${lastVisit.title} | ${lastVisit.location} | Womolog.ch`,
    description: `Auf dem ${lastVisit.title} in ${lastVisit.location} waren wir an folgendem Datum: ${lastVisit.date}`,
    openGraph: {
      title: `${lastVisit.title} | ${lastVisit.location} | Womolog.ch`,
      description: `Auf dem ${lastVisit.title} in ${lastVisit.location} waren wir an folgendem Datum: ${lastVisit.date}`,
      url: `https://womolog.ch/besuch/${params.id}`,
      images: [
        { url: imageUrl, width: 1200, height: 630, alt: lastVisit.title },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${lastVisit.title} | ${lastVisit.location} | Womolog.ch`,
      description: `Auf dem ${lastVisit.title} in ${lastVisit.location} waren wir an folgendem Datum: ${lastVisit.date}`,
      images: [imageUrl],
    },
  };
}

export default function CampingDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
