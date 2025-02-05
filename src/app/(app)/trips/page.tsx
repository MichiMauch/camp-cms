"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MainNav from "../_components/main-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Trip {
  id: number;
  name: string | null;
  start_date: string;
  end_date: string;
  teaser_images: string[];
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("de-CH");
}

function getDurationInDays(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

const BASE_IMAGE_URL = "https://pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev/";
const DEFAULT_IMAGE_EXTENSION = ".webp";

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTrips() {
      try {
        const response = await fetch("/api/trips");
        const data = await response.json();
        console.log("Fetched Trips:", data.trips); // Debug-Ausgabe
        setTrips(data.trips || []);
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrips();
  }, []);

  function getRandomImageUrl(teaserImages: string[]) {
    if (teaserImages.length === 0) return "";
    const randomIndex = Math.floor(Math.random() * teaserImages.length);
    return `${BASE_IMAGE_URL}${teaserImages[randomIndex]}${DEFAULT_IMAGE_EXTENSION}`;
  }

  if (isLoading) {
    return (
      <>
        <MainNav />
        <div className="pt-16 container mx-auto p-6">
          <div className="text-center">Lädt...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <MainNav />
      <div className="pt-16 container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Wohnmobil Trips</h1>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <Card
              key={trip.id}
              className="relative flex flex-col justify-between"
            >
              {trip.teaser_images.length > 0 && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-30"
                  style={{
                    backgroundImage: `url(${getRandomImageUrl(
                      trip.teaser_images
                    )})`,
                  }}
                ></div>
              )}
              <CardHeader className="relative z-10">
                <CardTitle>{trip.name || `Trip ${trip.id}`}</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 flex-grow">
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <span>
                      {formatDate(trip.start_date)} -{" "}
                      {formatDate(trip.end_date)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <div className="relative z-10 mt-auto p-4 flex justify-end">
                <Badge className="text-base px-4 py-1 whitespace-nowrap">
                  <Link
                    href={`/trips/${trip.id}`}
                    className="flex items-center"
                  >
                    Details
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
