"use client";

import { useEffect, useRef, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

// Define marker icons using SVG from public folder
const defaultIcon = L.icon({
  iconUrl: "/bus-stop-blau.svg",
  iconRetinaUrl: "/bus-stop-blau.svg",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [1, -34],
});

const hoveredIcon = L.icon({
  iconUrl: "/bus-stop-rot.svg",
  iconRetinaUrl: "/bus-stop-rot.svg",
  iconSize: [55, 55],
  iconAnchor: [27, 55],
  popupAnchor: [1, -34],
});

interface MapProps extends React.HTMLAttributes<HTMLDivElement> {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    popup?: string;
    isHovered?: boolean;
  }>;
  onMarkerDrag?: (lat: number, lng: number) => void;
  draggable?: boolean;
}

export function Map(props: MapProps) {
  const {
    center = [46.8182, 8.2275], // Default center for Switzerland
    zoom = 13,
    markers = [],
    onMarkerDrag,
    draggable = false,
    className,
    ...restProps
  } = props || {};
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapId = useRef(`map-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (typeof window !== "undefined" && containerRef.current && !mapRef.current) {
      const map = L.map(containerRef.current).setView(center, zoom);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }
  }, []); // Remove dependencies to prevent re-initialization

  useEffect(() => {
    if (!mapRef.current) return;

    // If marker count changed, recreate all markers
    if (markersRef.current.length !== markers.length) {
      // Remove existing markers
      markersRef.current.forEach((marker) => marker.remove());
      
      // Create new markers
      markersRef.current = markers.map((marker) => {
        const m = L.marker(marker.position, {
          icon: defaultIcon,
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

        return m;
      });
    }

    // Update existing markers - always apply current hover state
    markersRef.current.forEach((leafletMarker, index) => {
      const marker = markers[index];
      if (marker && leafletMarker) {
        const newIcon = marker.isHovered ? hoveredIcon : defaultIcon;
        leafletMarker.setIcon(newIcon);
        leafletMarker.setZIndexOffset(marker.isHovered ? 1000 : 0);
      }
    });
  }, [markers, draggable, onMarkerDrag]);

  return (
    <div
      ref={containerRef}
      className={cn("h-[400px] rounded-md", className)}
      {...restProps}
    />
  );
}
