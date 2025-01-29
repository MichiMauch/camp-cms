"use client";

import { useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import MapView from "../../_components/mapview"; // Ensure this path is correct or update it to the correct path
import WeatherDetails from "../_components/WeatherDetails";
import VisitDetails from "../_components/VisitDetails";
import ActivityList from "../_components/ActivityList";
import ParallaxImage from "../_components/ParallaxImage";

const BASE_IMAGE_URL = "https://pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev/";
const DEFAULT_IMAGE_EXTENSION = ".webp";

export default function CampingDetail({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const [params, setParams] = useState<{ id: string } | null>(null);
  const [lastVisit, setLastVisit] = useState({
    latitude: 0,
    longitude: 0,
    title: "",
    name: "",
    date: "",
    location: "",
    image: "",
    country: "",
    previousVisits: [], // Liste der vorherigen Besuche hinzugefügt
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchParams() {
      const resolvedParams = await paramsPromise;
      setParams(resolvedParams);
    }
    fetchParams();
  }, [paramsPromise]);

  useEffect(() => {
    async function fetchLastVisit() {
      if (!params) return;
      try {
        const response = await fetch(`/api/visit_detail/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch campsite details");
        }
        const data = await response.json();
        console.log("Fetched data:", data); // Logging hinzugefügt
        setLastVisit(data);
      } catch (err) {
        setError("Fehler beim Abrufen der Campingplatzdetails.");
        console.error("Fetch error:", err); // Fehlerprotokollierung hinzugefügt
      } finally {
        setLoading(false);
      }
    }

    fetchLastVisit();
  }, [params]);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrolled = containerRef.current.scrollTop;
        const image = document.querySelector(".parallax-image") as HTMLElement;
        if (image) {
          image.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
      }
    };

    const container = containerRef.current;
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const imageUrl = `${BASE_IMAGE_URL}${lastVisit.image}${DEFAULT_IMAGE_EXTENSION}`;

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Hauptcontainer mit Custom Scroll */}
      <ScrollArea ref={containerRef} className="h-screen">
        <div className="min-h-screen">
          {/* Bild Container mit Parallax */}
          <ParallaxImage imageUrl={imageUrl} title={lastVisit.title} />

          {/* Content Grid mit überlappenden Elementen */}
          <div className="relative -mt-20 px-8 pb-8">
            <div className="grid grid-cols-12 gap-6">
              {/* Hauptinfo Karte */}
              <VisitDetails
                title={lastVisit.title}
                location={lastVisit.location}
                date={lastVisit.date}
                latitude={lastVisit.latitude}
                longitude={lastVisit.longitude}
                country={lastVisit.country}
                previousVisits={lastVisit.previousVisits} // Liste der vorherigen Besuche übergeben
              />

              {/* Wetter Container */}
              <WeatherDetails
                latitude={lastVisit.latitude}
                longitude={lastVisit.longitude}
              />

              {/* Karte */}
              <div className="col-span-12 lg:col-span-8 bg-card rounded-[2rem] border overflow-hidden shadow-lg">
                <div className="h-[400px]">
                  <MapView {...lastVisit} />
                </div>
              </div>

              {/* Aktivitäten Container */}
              <ActivityList
                latitude={lastVisit.latitude}
                longitude={lastVisit.longitude}
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
