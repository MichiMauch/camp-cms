"use client";

import { useEffect, useState } from "react";
import HeroSection from "./_components/hero-section";
import ScrollSection from "./_components/scroll-section";
import MainNav from "./_components/main-nav";

export default function Page() {
  interface Entry {
    id: number;
    name: string;
    image: string;
    location: string;
    country: string;
    dateFrom: string;
    dateTo: string;
  }

  const [featuredEntry, setFeaturedEntry] = useState<Entry | null>(null);
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2018 + 1 },
    (_, i) => currentYear - i
  );

  useEffect(() => {
    async function fetchLatestVisit() {
      const response = await fetch("/api/last_visit");
      const data = await response.json();
      setFeaturedEntry(data);
    }
    fetchLatestVisit();
  }, []);

  if (!featuredEntry) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Willkommen bei Camp CMS
        </h1>
        <p className="text-gray-600">
          Diese Seite testet die Tailwind CSS Integration.
        </p>
      </div>
    </main>
  );
}
