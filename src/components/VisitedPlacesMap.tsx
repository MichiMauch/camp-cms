"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map } from "@/components/map";
import { getCampsites } from "@/lib/campsites";

interface Campsite {
  id: number;
  name: string;
  location: string;
  teaser_image: string;
  latitude: number;
  longitude: number;
}

export function VisitedPlacesMap() {
  const [campsites, setCampsites] = useState<Campsite[]>([]);

  useEffect(() => {
    async function fetchCampsites() {
      try {
        const data = await getCampsites();
        setCampsites(data);
      } catch (error) {
        console.error("Failed to fetch campsites:", error);
      }
    }

    fetchCampsites();
  }, []);

  // Konvertiere die Campsite-Daten in das richtige Format für die Map-Komponente
  const visitedPlaces = campsites
    .filter((campsite) => campsite.latitude && campsite.longitude)
    .map((campsite) => ({
      position: [campsite.latitude, campsite.longitude] as [number, number],
      popup: campsite.name,
    }));

  // Berechne den Mittelpunkt für die Karte (Schweiz)
  const defaultCenter: [number, number] = [46.8182, 8.2275];

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Besuchte Plätze</CardTitle>
      </CardHeader>
      <CardContent>
        <Map center={defaultCenter} markers={visitedPlaces} zoom={8} />
      </CardContent>
    </Card>
  );
}
