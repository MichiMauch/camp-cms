"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

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

export default function MapViewModal({
  latitude,
  longitude,
  name,
  campsiteLatitude,
  campsiteLongitude,
}: MapViewModalProps) {
  const [distance, setDistance] = useState<number | null>(null);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900">{name}</h3>
        {distance !== null && (
          <p className="text-sm text-gray-600">
            Entfernung: {distance.toFixed(2)} km
          </p>
        )}
      </div>
      <div className="flex-1 relative min-h-[400px]">
        <LeafletMap
          latitude={latitude}
          longitude={longitude}
          name={name}
          campsiteLatitude={campsiteLatitude}
          campsiteLongitude={campsiteLongitude}
          onDistanceCalculated={setDistance}
        />
      </div>
    </div>
  );
}
