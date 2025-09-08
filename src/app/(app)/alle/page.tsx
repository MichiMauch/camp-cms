"use client";

import { useEffect, useState, useMemo } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchEntries() {
      const response = await fetch(`/api/all`);
      const data = await response.json();
      setEntries(Array.isArray(data) ? data : []);
    }
    fetchEntries();
  }, []);

  // Fast client-side filtering with useMemo for performance
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) {
      return entries;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return entries.filter((entry) => {
      const name = entry.name?.toLowerCase() || "";
      const location = entry.location?.toLowerCase() || "";
      return name.includes(query) || location.includes(query);
    });
  }, [entries, searchQuery]);

  return (
    <div className="min-h-screen bg-[#1E2D2F] pb-20 pt-16">
      <MainNav />
      <h1 className="text-center text-white font-varela text-4xl mb-4 mt-8">
        Alle Besuche
      </h1>
      
      {/* Search Field */}
      <div className="max-w-md mx-auto mb-6 px-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Suche nach Platz oder Ort..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-[#2A3F42] text-white placeholder-gray-400 rounded-lg border border-[#3A4F52] focus:border-[#4A5F62] focus:outline-none focus:ring-2 focus:ring-[#4A5F62] focus:ring-opacity-50"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {searchQuery && (
          <p className="text-gray-400 text-sm mt-2 text-center">
            {filteredEntries.length} von {entries.length} Besuchen gefunden
          </p>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-4 p-4">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => (
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
        ) : searchQuery ? (
          <div className="text-white text-center w-full">
            Keine Besuche gefunden für "{searchQuery}"
          </div>
        ) : entries.length === 0 ? (
          <div className="text-white text-center w-full">
            Keine Besuche vorhanden
          </div>
        ) : null}
      </div>
    </div>
  );
}
