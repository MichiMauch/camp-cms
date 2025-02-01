"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map } from "@/components/map";
import MainNav from "../_components/main-nav";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BASE_IMAGE_URL = "https://pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev/";
const DEFAULT_IMAGE_EXTENSION = ".webp";

interface Campsite {
  id: number;
  name: string;
  location: string;
  teaser_image: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
}

function VisitedPlacesMap() {
  // <-- Entferne das "export" hier
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hoveredCampsite, setHoveredCampsite] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCampsites() {
      try {
        const response = await fetch("/api/plaetze");
        if (!response.ok) {
          throw new Error("Failed to fetch campsites");
        }
        const data = await response.json();
        setCampsites(data);
      } catch (error) {
        console.error("Failed to fetch campsites:", error);
      }
    }
    fetchCampsites();
  }, []);

  const groupedCampsites = campsites.reduce((acc, campsite) => {
    if (!acc[campsite.country]) {
      acc[campsite.country] = [];
    }
    acc[campsite.country].push(campsite);
    return acc;
  }, {} as Record<string, Campsite[]>);

  const filteredCampsites = selectedCountry
    ? groupedCampsites[selectedCountry] || []
    : campsites;

  const visitedPlaces = filteredCampsites
    .filter((campsite) => campsite.latitude && campsite.longitude)
    .map((campsite) => ({
      position: [campsite.latitude, campsite.longitude] as [number, number],
      popup: campsite.name,
      isHovered: campsite.id === hoveredCampsite,
    }));

  const defaultCenter: [number, number] = [46.8182, 8.2275];

  return (
    <>
      <MainNav />
      <div className="pt-16 grid grid-cols-2 gap-4 h-screen">
        <Card className="col-span-1 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-foreground">
          <CardHeader className="sticky top-0 bg-card z-10">
            <CardTitle>Liste aller Plätze</CardTitle>
            <Select
              value={selectedCountry || "all"}
              onValueChange={(value) =>
                setSelectedCountry(value === "all" ? null : value)
              }
            >
              <SelectTrigger className="mt-2 w-full">
                <SelectValue placeholder="Alle Länder" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Land</SelectLabel>
                  <SelectItem value="all">
                    Alle Länder ({campsites.length})
                  </SelectItem>
                  {Object.entries(groupedCampsites).map(
                    ([country, campsites]) => (
                      <SelectItem key={country} value={country}>
                        <img
                          src={`https://flagcdn.com/w20/${campsites[0].country_code}.png`}
                          alt={`${country} Flag`}
                          className="inline-block mr-2 h-4 w-4"
                        />
                        {country} ({campsites.length})
                      </SelectItem>
                    )
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {filteredCampsites.length > 0 ? (
              <div>
                <h2 className="text-lg font-bold mb-2">{selectedCountry}</h2>
                <ul>
                  {filteredCampsites
                    .sort((a, b) => a.location.localeCompare(b.location))
                    .map((campsite) => (
                      <li
                        key={campsite.id}
                        className="flex items-center space-x-6 mb-4"
                        onMouseEnter={() => setHoveredCampsite(campsite.id)}
                        onMouseLeave={() => setHoveredCampsite(null)}
                      >
                        <img
                          src={`${BASE_IMAGE_URL}${campsite.teaser_image}${DEFAULT_IMAGE_EXTENSION}`}
                          alt={campsite.name}
                          className="w-16 h-16 object-cover rounded transition-transform duration-300 ease-in-out transform hover:scale-110"
                        />
                        <div className="flex flex-col justify-center h-16">
                          <div>{campsite.location}</div>
                          <div>{campsite.name}</div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            ) : (
              <div>Keine Plätze gefunden</div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-1 h-full z-0">
          <CardHeader>
            <CardTitle>Besuchte Plätze</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <Map center={defaultCenter} markers={visitedPlaces} zoom={8} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default VisitedPlacesMap; // <-- Hier den default export setzen!
