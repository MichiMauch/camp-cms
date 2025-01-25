import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  name: string;
}

export default function LeafletMap({
  latitude,
  longitude,
  name,
}: LeafletMapProps) {
  useEffect(() => {
    // Leaflet map initialization
    const map = L.map("map-modal").setView([latitude, longitude], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add marker for the camping location
    L.marker([latitude, longitude]).addTo(map).bindPopup(name).openPopup();

    // Cleanup on unmount
    return () => {
      map.remove();
    };
  }, [latitude, longitude, name]);

  return <div id="map-modal" className="h-full w-full rounded-lg" />;
}
