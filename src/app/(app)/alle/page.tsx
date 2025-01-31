"use client";

import { useEffect, useState } from "react";
import MainNav from "../_components/main-nav";
import CampingCard from "../_components/camping-card"; // Importiere die CampingCard-Komponente

export default function AllVisitsPage() {
  interface Entry {
    id: number;
    name: string; // Stelle sicher, dass der Name hier korrekt definiert ist
    image: string;
    location: string;
    country: string;
    dateFrom: string;
    dateTo: string;
  }

  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    async function fetchEntries() {
      const response = await fetch(`/api/all`);
      const data = await response.json();
      setEntries(Array.isArray(data) ? data : []);
    }
    fetchEntries();
  }, []);

  return (
    <div className="min-h-screen bg-[#1E2D2F] pb-20 pt-16">
      <MainNav />
      <h1 className="text-center text-white font-varela text-4xl mb-4 mt-8">
        Alle Besuche
      </h1>
      <div className="flex flex-wrap justify-center gap-4 p-4">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <CampingCard
              key={entry.id}
              id={entry.id.toString()}
              title={entry.name || "Unbekannter Titel"} // Stelle sicher, dass der Titel hier übergeben wird
              image={entry.image} // Übergebe den Bildnamen
              location={entry.location}
              country={entry.country}
              dateFrom={entry.dateFrom}
              dateTo={entry.dateTo}
            />
          ))
        ) : (
          <div>No entries found</div>
        )}
      </div>
    </div>
  );
}
