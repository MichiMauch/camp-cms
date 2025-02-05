"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainNav from "../../_components/main-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Calendar,
  MapPin,
  Compass,
  CalendarPlus2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import dynamic from "next/dynamic";
import Slideshow from "./Slideshow";
import { useScroll, motion } from "framer-motion";
import { useScrollDirection } from "../../../../hooks/use-scroll-direction";

// Dynamischer Import der Map-Komponente ohne SSR
const TripMap = dynamic(() => import("./map"), { ssr: false });

interface Campsite {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  date: string;
  teaser_image: string;
  visit_id: string;
}

interface Trip {
  id: number;
  name: string | null;
  start_date: string;
  end_date: string;
  total_distance: number;
  campsites: Campsite[];
}

const BASE_IMAGE_URL = "https://pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev/";
const DEFAULT_IMAGE_EXTENSION = ".webp";

export default function TripDetailPage({ params }: { params: { id: string } }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isVisible = useScrollDirection();

  useEffect(() => {
    async function fetchTrip() {
      try {
        const response = await fetch(`/api/trips/${params.id}`);
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Trip nicht gefunden"
              : "Fehler beim Laden des Trips"
          );
        }
        const data = await response.json();
        setTrip(data.trip);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Ein unerwarteter Fehler ist aufgetreten"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrip();
  }, [params.id]);

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

  const calculateTripDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <>
      <MainNav />
      <motion.button
        onClick={() => router.back()}
        className="fixed top-[80px] left-8 z-50 bg-background/80 backdrop-blur-sm hover:bg-background/90 text-orange-500 px-4 py-2 rounded-lg"
        initial={{ y: 0 }}
        animate={{
          y: isVisible ? 0 : -100,
        }}
        transition={{
          duration: 0.3,
          y: {
            type: "spring",
            stiffness: 300,
            damping: 30,
          },
        }}
      >
        <span className="animate-pulse">← Zurück</span>
      </motion.button>
      <div className="relative">
        <div className="absolute top-0 left-0 w-full z-0">
          {trip && (
            <Slideshow
              images={trip.campsites.map((campsite) => campsite.teaser_image)}
              titles={trip.campsites.map((campsite) => campsite.name)}
            />
          )}
        </div>
        <div className="relative z-10 pt-[37vh] container mx-auto p-6">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Fehler</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : trip ? (
            <div className="space-y-6">
              <div className="w-full md:w-1/3">
                <Card className="bg-[rgba(31,41,45,0.8)]">
                  <CardHeader>
                    <CardTitle className="text-4xl">
                      {trip.name || `Trip ${trip.id}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Zeitraum
                          </p>
                          <p className="font-medium">
                            {new Date(trip.start_date).toLocaleDateString(
                              "de-CH"
                            )}{" "}
                            -{" "}
                            {new Date(trip.end_date).toLocaleDateString(
                              "de-CH"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Distanz
                          </p>
                          <p className="font-medium">
                            {trip.total_distance.toLocaleString("de-CH")} km
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Compass className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Tracker
                          </p>
                          <p className="font-medium">
                            {calculateTripDays(trip.start_date, trip.end_date)}{" "}
                            Tage | {trip.campsites.length} Locations
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Locations
                          </p>
                          <ol className="list-decimal list-inside">
                            {trip.campsites.map((campsite, index) => (
                              <li key={campsite.id} className="font-medium">
                                {campsite.name}, {campsite.location}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="w-full">
                <Card className="bg-[rgba(31,41,45,0.8)]">
                  <CardHeader>
                    <CardTitle>Besuchte Plätze</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {trip.campsites.length > 0 ? (
                      <div className="w-full">
                        <TripMap campsites={trip.campsites} />
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        Keine Campingplätze für diesen Trip gefunden
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertTitle>Nicht gefunden</AlertTitle>
              <AlertDescription>
                Der angeforderte Trip wurde nicht gefunden.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </>
  );
}
