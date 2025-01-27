import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

declare module "leaflet" {
  namespace Routing {
    function control(options: any): any;
    function osrmv1(options: any): any;
  }
}

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  name: string;
  campsiteLatitude: number;
  campsiteLongitude: number;
  onDistanceCalculated: (distance: number) => void;
}

export default function LeafletMap({
  latitude,
  longitude,
  name,
  campsiteLatitude,
  campsiteLongitude,
  onDistanceCalculated,
}: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const initializeMap = useCallback(() => {
    if (!containerRef.current || mapRef.current) return;

    // Create map instance
    mapRef.current = L.map(containerRef.current, {
      center: [
        (latitude + campsiteLatitude) / 2,
        (longitude + campsiteLongitude) / 2,
      ],
      zoom: 12,
      preferCanvas: true,
    });

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapRef.current);

    // Add markers
    const attractionIcon = L.icon({
      iconUrl: "/location-pin.png",
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    });

    const campsiteIcon = L.icon({
      iconUrl: "/bus.png",
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    });

    L.marker([latitude, longitude], { icon: attractionIcon })
      .addTo(mapRef.current)
      .bindPopup(name)
      .openPopup();

    L.marker([campsiteLatitude, campsiteLongitude], { icon: campsiteIcon })
      .addTo(mapRef.current)
      .bindPopup("Dein Standort")
      .openPopup();

    // Add routing
    routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(campsiteLatitude, campsiteLongitude),
        L.latLng(latitude, longitude),
      ],
      routeWhileDragging: false,
      showAlternatives: false,
      createMarker: () => null,
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
        profile: "driving",
      }),
      lineOptions: {
        styles: [{ color: "#6366f1", opacity: 0.8, weight: 4 }],
        addWaypoints: false,
      },
      show: false,
    }).addTo(mapRef.current);

    // Calculate distance
    routingControlRef.current.on("routesfound", (e: any) => {
      const routes = e.routes;
      if (routes?.[0]?.summary?.totalDistance) {
        onDistanceCalculated(routes[0].summary.totalDistance / 1000);
      }
    });

    // Fit bounds
    const bounds = L.latLngBounds([
      [latitude, longitude],
      [campsiteLatitude, campsiteLongitude],
    ]);
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });

    // Force a resize after initialization
    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 100);
  }, [
    latitude,
    longitude,
    campsiteLatitude,
    campsiteLongitude,
    onDistanceCalculated,
  ]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (routingControlRef.current) {
      routingControlRef.current.remove();
      routingControlRef.current = null;
    }
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  }, []);

  // Initialize map after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeMap();
    }, 100);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [initializeMap, cleanup]);

  // Handle prop changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
  }, [mapRef]); // Updated dependency array

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-lg"
      style={{ minHeight: "400px", position: "relative" }}
    />
  );
}
