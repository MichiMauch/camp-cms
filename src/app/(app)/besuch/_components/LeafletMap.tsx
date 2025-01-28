import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

declare module "leaflet" {
  namespace Routing {
    function control(options: any): any;
    function mapbox(accessToken: string, options?: any): any;
  }
}

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  name: string;
  campsiteLatitude: number;
  campsiteLongitude: number;
  onDistanceCalculated: (distance: number) => void;
  transportMode: "driving" | "cycling" | "walking";
}

export default function LeafletMap({
  latitude,
  longitude,
  name,
  campsiteLatitude,
  campsiteLongitude,
  onDistanceCalculated,
  transportMode,
}: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mapbox Access Token (ersetze mit deinem eigenen Token)
  const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  const updateRoute = useCallback(() => {
    if (!mapRef.current) return;

    // Remove existing routing control if it exists
    if (routingControlRef.current) {
      routingControlRef.current.remove();
      routingControlRef.current = null;
    }

    // Mapbox Profile basierend auf dem Transportmodus
    const profile =
      transportMode === "driving"
        ? "mapbox/driving"
        : transportMode === "cycling"
        ? "mapbox/cycling"
        : "mapbox/walking";

    // Add new routing control mit Mapbox
    routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(campsiteLatitude, campsiteLongitude),
        L.latLng(latitude, longitude),
      ],
      routeWhileDragging: false,
      showAlternatives: false,
      createMarker: () => null,
      router: L.Routing.mapbox(MAPBOX_ACCESS_TOKEN!, {
        profile: profile,
        geometries: "geojson",
      }),
      lineOptions: {
        styles: [
          {
            color:
              transportMode === "driving"
                ? "#6366f1"
                : transportMode === "cycling"
                ? "#22c55e"
                : "#f59e0b",
            opacity: 0.8,
            weight: 4,
          },
        ],
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
  }, [
    latitude,
    longitude,
    campsiteLatitude,
    campsiteLongitude,
    transportMode,
    onDistanceCalculated,
  ]);

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

    // Add tile layer (Mapbox Tiles)
    L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/outdoors-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`,
      {
        attribution:
          '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    ).addTo(mapRef.current);

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

    updateRoute();

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
    name,
    campsiteLatitude,
    campsiteLongitude,
    updateRoute,
  ]);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      initializeMap();
    }, 100);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [initializeMap, cleanup]);

  useEffect(() => {
    if (mapRef.current) {
      updateRoute();
    }
  }, [mapRef, updateRoute, transportMode]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-lg"
      style={{ minHeight: "400px", position: "relative" }}
    />
  );
}
