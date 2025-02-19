import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.womolog.ch"),
  title: "Unsere Camperstatistik | womolog.ch | CampCMS",
  description:
    "Hier sind alle wichtigen Zahlen rund um unsere Wohnmobiltrips zu finden. Viel Spass beim Stöbern.",
  openGraph: {
    title: "Unsere Camperstatistik | womolog.ch | CampCMS",
    description:
      "Hier sind alle wichtigen Zahlen rund um unsere Wohnmobiltrips zu finden. Viel Spass beim Stöbern.",
    url: "https://www.womolog.ch/stats",
    images: [
      {
        url: "https://www.womolog.ch/images/stats-preview.jpg", // Hier eigenes Bild einfügen
        width: 1200,
        height: 630,
        alt: "Statistikübersicht unserer Wohnmobilreisen",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Unsere Camperstatistik | womolog.ch | CampCMS",
    description:
      "Hier sind alle wichtigen Zahlen rund um unsere Wohnmobiltrips zu finden. Viel Spass beim Stöbern.",
    images: ["https://www.womolog.ch/images/stats-preview.jpg"], // Hier eigenes Bild einfügen
  },
};

export default function StatsPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
