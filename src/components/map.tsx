"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

// Define marker icon to use bus.png from public folder without shadow
const icon = L.icon({
  iconUrl: "/bus.png",
  iconRetinaUrl: "/bus.png",
  iconSize: [41, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface MapProps extends React.HTMLAttributes<HTMLDivElement> {
  center: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    popup?: string;
  }>;
  onMarkerDrag?: (lat: number, lng: number) => void;
  draggable?: boolean;
}

export function Map({
  center,
  zoom = 13,
  markers = [],
  onMarkerDrag,
  draggable = false,
  className,
  ...props
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      mapRef.current = L.map("map").setView(center, zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      // Add markers
      if (markers.length > 0) {
        markers.forEach((marker) => {
          const m = L.marker(marker.position, {
            icon,
            draggable,
          }).addTo(mapRef.current!);

          if (marker.popup) {
            m.bindPopup(marker.popup);
          }

          if (draggable && onMarkerDrag) {
            m.on("dragend", (event) => {
              const marker = event.target;
              const position = marker.getLatLng();
              onMarkerDrag(position.lat, position.lng);
            });
          }

          if (draggable) {
            markerRef.current = m;
          }
        });
      }

      return () => {
        mapRef.current?.remove();
      };
    }
  }, [center, draggable, markers, onMarkerDrag, zoom]);

  // Update marker position if center changes
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng(center);
      mapRef.current.setView(center);
    }
  }, [center]);

  return (
    <div
      id="map"
      className={cn("h-[400px] rounded-md", className)}
      {...props}
    />
  );
}
