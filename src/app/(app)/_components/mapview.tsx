"use client";

import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  latitude: number;
  longitude: number;
  name: string;
}

export default function MapView({ latitude, longitude, name }: MapViewProps) {
  useEffect(() => {
    // Leaflet map initialization
    const map = L.map("map", {
      scrollWheelZoom: false, // Disable zooming with scroll wheel
    }).setView([latitude, longitude], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Custom icon for the marker
    const busIcon = L.icon({
      iconUrl: "/bus.png",
      iconSize: [38, 38], // size of the icon
      iconAnchor: [22, 38], // point of the icon which will correspond to marker's location
      popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
    });

    // Add marker for the camping location
    L.marker([latitude, longitude], { icon: busIcon })
      .addTo(map)
      .bindPopup(name);

    // Cleanup on unmount
    return () => {
      map.remove();
    };
  }, [latitude, longitude, name]);

  return <div id="map" className="h-[400px] w-full rounded-lg z-10" />;
}
