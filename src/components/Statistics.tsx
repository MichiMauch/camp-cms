"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tent, Users } from "lucide-react";
import "flag-icons/css/flag-icons.min.css";

interface StatisticsProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  backgroundImage: string; // Hinzugefügt für das Flaggenbild
}

function StatisticsCard({
  title,
  value,
  icon,
  backgroundImage,
}: StatisticsProps) {
  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-no-repeat bg-center bg-cover opacity-20"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      ></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export function TotalVisitedPlaces() {
  const [totalVisitedPlaces, setTotalVisitedPlaces] = useState<number>(0);

  useEffect(() => {
    async function fetchTotalVisitedPlaces() {
      try {
        const response = await fetch("/api/statistics/campsites-count");
        if (!response.ok) {
          throw new Error("Failed to fetch total visited places");
        }
        const data = await response.json();
        setTotalVisitedPlaces(data.totalCampsites);
      } catch (error) {
        console.error("Failed to fetch total visited places:", error);
      }
    }

    fetchTotalVisitedPlaces();
  }, []);

  return (
    <StatisticsCard
      title="Besuchte Plätze"
      value={totalVisitedPlaces}
      icon={<Tent className="h-4 w-4 text-muted-foreground" />}
      backgroundImage=""
    />
  );
}

export function TotalVisits() {
  const [totalVisits, setTotalVisits] = useState<number>(0);

  useEffect(() => {
    async function fetchTotalVisits() {
      try {
        const response = await fetch("/api/statistics/visits-count");
        if (!response.ok) {
          throw new Error("Failed to fetch total visits");
        }
        const data = await response.json();
        setTotalVisits(data.totalVisits);
      } catch (error) {
        console.error("Failed to fetch total visits:", error);
      }
    }

    fetchTotalVisits();
  }, []);

  return (
    <StatisticsCard
      title="Besuche"
      value={totalVisits}
      icon={<Users className="h-4 w-4 text-muted-foreground" />}
      backgroundImage=""
    />
  );
}

// Neue Komponente für die Anzahl der Plätze pro Land
export function CampsitesByCountry() {
  const [campsitesByCountry, setCampsitesByCountry] = useState<
    { country_code: string; country: string; totalCampsites: number }[]
  >([]);

  useEffect(() => {
    async function fetchCampsitesByCountry() {
      try {
        const response = await fetch("/api/statistics/campsites-by-country");
        if (!response.ok) {
          throw new Error("Failed to fetch campsites by country");
        }
        const data = await response.json();
        setCampsitesByCountry(data);
      } catch (error) {
        console.error("Failed to fetch campsites by country:", error);
      }
    }

    fetchCampsitesByCountry();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {campsitesByCountry.map((item) => (
        <StatisticsCard
          key={item.country}
          title={item.country}
          value={item.totalCampsites}
          icon={<Tent className="h-4 w-4 text-muted-foreground" />}
          backgroundImage={`https://flagcdn.com/w320/${item.country_code.toLowerCase()}.png`}
        />
      ))}
    </div>
  );
}
