"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

// Define marker icon to use bus.png from public folder without shadow
const defaultIcon = L.icon({
  iconUrl: "/bus.png",
  iconRetinaUrl: "/bus.png",
  iconSize: [41, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const hoveredIcon = L.icon({
  iconUrl: "/bus.png",
  iconRetinaUrl: "/bus.png",
  iconSize: [50, 50],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface MapProps extends React.HTMLAttributes<HTMLDivElement> {
  center: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    popup?: string;
    isHovered?: boolean;
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
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      mapRef.current = L.map("map").setView(center, zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      return () => {
        mapRef.current?.remove();
      };
    }
  }, [center, zoom]);

  useEffect(() => {
    if (mapRef.current) {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = markers.map((marker) => {
        const markerIcon = marker.isHovered ? hoveredIcon : defaultIcon;

        const m = L.marker(marker.position, {
          icon: markerIcon,
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

        if (marker.isHovered) {
          m.setZIndexOffset(1000);
        } else {
          m.setZIndexOffset(0);
        }

        return m;
      });
    }
  }, [markers, draggable, onMarkerDrag]);

  return (
    <div
      id="map"
      className={cn("h-[400px] rounded-md", className)}
      {...props}
    />
  );
}
