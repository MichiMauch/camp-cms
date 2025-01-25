"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

interface MapViewModalProps {
  latitude: number;
  longitude: number;
  name: string;
}

export default function MapViewModal({
  latitude,
  longitude,
  name,
}: MapViewModalProps) {
  useEffect(() => {
    // Initialize the Leaflet map here if needed
  }, []);

  return <LeafletMap latitude={latitude} longitude={longitude} name={name} />;
}
