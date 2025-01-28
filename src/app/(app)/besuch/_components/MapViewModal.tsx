"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Car, Bike, FootprintsIcon } from "lucide-react";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
      <p>Lade Karte...</p>
    </div>
  ),
});

interface MapViewModalProps {
  latitude: number;
  longitude: number;
  name: string;
  campsiteLatitude: number;
  campsiteLongitude: number;
}

type TransportMode = "driving" | "cycling" | "walking";

interface TransportOption {
  value: TransportMode;
  label: string;
  icon: typeof Car | typeof Bike | typeof FootprintsIcon;
  description: string;
}

export default function MapViewModal({
  latitude,
  longitude,
  name,
  campsiteLatitude,
  campsiteLongitude,
}: MapViewModalProps) {
  const [distance, setDistance] = useState<number | null>(null);
  const [transportMode, setTransportMode] = useState<TransportMode>("driving");

  const transportOptions: TransportOption[] = [
    {
      value: "driving",
      label: "Auto",
      icon: Car,
      description: "Schnellste Route mit dem Auto",
    },
    {
      value: "cycling",
      label: "Fahrrad",
      icon: Bike,
      description: "Fahrradfreundliche Route",
    },
    {
      value: "walking",
      label: "Zu Fuss",
      icon: FootprintsIcon,
      description: "Fußgängerfreundliche Route",
    },
  ];

  const getEstimatedTime = (distance: number, mode: TransportMode) => {
    const speeds = {
      driving: 50, // km/h
      cycling: 15, // km/h
      walking: 5, // km/h
    };
    const hours = distance / speeds[mode];
    const minutes = Math.round(hours * 60);
    return minutes;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-medium">Wegstrecke nach</span>
            <h3 className="text-lg font-medium leading-6">
              {name}
              {distance !== null && (
                <span className="ml-2">
                  mit dem{" "}
                  {
                    transportOptions.find(
                      (option) => option.value === transportMode
                    )?.label
                  }
                  , {distance.toFixed(2)} km, ~
                  {getEstimatedTime(distance, transportMode)} Min.
                </span>
              )}
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={transportMode}
              onValueChange={(value: TransportMode) => setTransportMode(value)}
            >
              <SelectTrigger className="w-[235px] h-[30]">
                <SelectValue placeholder="Transportmittel" />
              </SelectTrigger>
              <SelectContent>
                {transportOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs">{option.description}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="flex-1 relative min-h-0">
        <LeafletMap
          latitude={latitude}
          longitude={longitude}
          name={name}
          campsiteLatitude={campsiteLatitude}
          campsiteLongitude={campsiteLongitude}
          onDistanceCalculated={setDistance}
          transportMode={transportMode}
        />
      </div>
    </div>
  );
}
