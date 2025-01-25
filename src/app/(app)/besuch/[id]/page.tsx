"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import {
  MapPin,
  Calendar,
  Compass,
  Sun,
  Wind,
  Droplets,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import MapView from "../../_components/mapview"; // Ensure this path is correct or update it to the correct path

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
        setLastVisit(data);
      } catch (err) {
        setError("Fehler beim Abrufen der Campingplatzdetails.");
        console.error(err);
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
          <div className="relative h-[40vh] overflow-hidden">
            <div className="absolute inset-0 parallax-image">
              <Image
                src={imageUrl}
                alt={lastVisit.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
          </div>

          {/* Content Grid mit überlappenden Elementen */}
          <div className="relative -mt-20 px-8 pb-8">
            <div className="grid grid-cols-12 gap-6">
              {/* Hauptinfo Karte */}
              <div className="col-span-12 lg:col-span-4 lg:row-span-2 bg-card rounded-[2rem] border p-8 shadow-lg">
                <h1 className="text-4xl font-bold mb-6">{lastVisit.title}</h1>
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Standort</p>
                      <p className="font-medium">{lastVisit.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Aufenthalt
                      </p>
                      <p className="font-medium">{lastVisit.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Compass className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Koordinaten
                      </p>
                      <p className="font-medium">
                        {lastVisit.latitude}° N, {lastVisit.longitude}° E
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wetter Container */}
              <div className="col-span-12 lg:col-span-8 bg-card rounded-[2rem] border overflow-hidden shadow-lg">
                <div className="h-full p-8">
                  <div className="flex items-start gap-8">
                    <div className="flex-1">
                      <h2 className="text-2xl font-semibold mb-6">
                        Aktuelle Wetterdaten
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Sun className="h-12 w-12 text-yellow-500" />
                            <span className="text-4xl font-bold">22°C</span>
                          </div>
                          <Badge className="text-base px-4 py-1">Sonnig</Badge>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Wind
                            </p>
                            <div className="flex items-center gap-2">
                              <Wind className="h-5 w-5 text-primary" />
                              <span className="text-xl">12 km/h</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Luftfeuchtigkeit
                            </p>
                            <div className="flex items-center gap-2">
                              <Droplets className="h-5 w-5 text-primary" />
                              <span className="text-xl">65%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Karte */}
              <div className="col-span-12 lg:col-span-8 bg-card rounded-[2rem] border overflow-hidden shadow-lg">
                <div className="h-[400px]">
                  <MapView {...lastVisit} />
                </div>
              </div>

              {/* Aktivitäten Container */}
              <div className="col-span-12 bg-card rounded-[2rem] border p-8 shadow-lg">
                <h2 className="text-2xl font-semibold mb-6">
                  Aktivitäten in der Umgebung
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      title: "Wandern im Schwarzwald",
                      distance: "2.5 km",
                      type: "Wandern",
                      gradient: "from-green-500/20 to-emerald-500/20",
                    },
                    {
                      title: "Titisee Bootsverleih",
                      distance: "4 km",
                      type: "Wassersport",
                      gradient: "from-blue-500/20 to-cyan-500/20",
                    },
                    {
                      title: "Feldberg Aussichtspunkt",
                      distance: "8 km",
                      type: "Aussicht",
                      gradient: "from-orange-500/20 to-amber-500/20",
                    },
                    {
                      title: "Ravennaschlucht",
                      distance: "12 km",
                      type: "Wandern",
                      gradient: "from-green-500/20 to-emerald-500/20",
                    },
                    {
                      title: "Hochseilgarten Titisee",
                      distance: "3.5 km",
                      type: "Abenteuer",
                      gradient: "from-red-500/20 to-rose-500/20",
                    },
                    {
                      title: "Schwarzwälder Skimuseum",
                      distance: "5 km",
                      type: "Kultur",
                      gradient: "from-purple-500/20 to-violet-500/20",
                    },
                  ].map((activity, index) => (
                    <div
                      key={index}
                      className={`group relative p-6 rounded-2xl bg-gradient-to-br ${activity.gradient} 
                        hover:scale-[1.02] transition-all cursor-pointer`}
                    >
                      <div className="absolute top-3 right-3">
                        <ChevronDown className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h3 className="font-medium mb-3 pr-6">
                        {activity.title}
                      </h3>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {activity.distance}
                        </span>
                        <Badge variant="secondary" className="font-normal">
                          {activity.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
