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
    <div className="min-h-screen bg-[#1E2D2F] pb-10 pt-8">
      <MainNav />
      <HeroSection />
      {years.map((year) => (
        <ScrollSection
          key={year}
          title={`Besuche ${year}`}
          year={year.toString()}
        />
      ))}
    </div>
  );
}
