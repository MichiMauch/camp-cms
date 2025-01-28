import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

const hideRoutingContainer = `
  .leaflet-routing-container {
    display: none !important;
  }
`;

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
  const markersRef = useRef<{ attraction?: L.Marker; campsite?: L.Marker }>({});

  const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = hideRoutingContainer;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Funktion zum Öffnen beider Popups
  const openBothPopups = useCallback(() => {
    if (markersRef.current.campsite) {
      markersRef.current.campsite.openPopup();
    }
    if (markersRef.current.attraction) {
      markersRef.current.attraction.openPopup();
    }
  }, []);

  const updateRoute = useCallback(() => {
    if (!mapRef.current) return;

    if (routingControlRef.current) {
      routingControlRef.current.remove();
      routingControlRef.current = null;
    }

    const profile =
      transportMode === "driving"
        ? "mapbox/driving"
        : transportMode === "cycling"
        ? "mapbox/cycling"
        : "mapbox/walking";

    routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(campsiteLatitude, campsiteLongitude),
        L.latLng(latitude, longitude),
      ],
      routeWhileDragging: false,
      showAlternatives: false,
      createMarker: () => null,
      router: L.Routing.mapbox(MAPBOX_ACCESS_TOKEN, {
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
      fitSelectedRoutes: false,
    }).addTo(mapRef.current);

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
    MAPBOX_ACCESS_TOKEN,
  ]);

  const initializeMap = useCallback(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: [
        (latitude + campsiteLatitude) / 2,
        (longitude + campsiteLongitude) / 2,
      ],
      zoom: 12,
      preferCanvas: true,
      closePopupOnClick: false, // Diese Option erlaubt mehrere offene Popups
    });

    L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/outdoors-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`,
      {
        attribution:
          '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    ).addTo(mapRef.current);

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

    // Erstelle die Marker und ihre Popups
    const campsitePopup = L.popup({
      closeButton: false,
      autoClose: false,
      closeOnClick: false,
    }).setContent("Dein Standort");

    const attractionPopup = L.popup({
      closeButton: false,
      autoClose: false,
      closeOnClick: false,
    }).setContent(name);

    // Erstelle die Marker und binde die Popups
    const campsiteMarker = L.marker([campsiteLatitude, campsiteLongitude], {
      icon: campsiteIcon,
    })
      .addTo(mapRef.current)
      .bindPopup(campsitePopup);

    const attractionMarker = L.marker([latitude, longitude], {
      icon: attractionIcon,
    })
      .addTo(mapRef.current)
      .bindPopup(attractionPopup);

    // Öffne beide Popups
    campsiteMarker.openPopup();
    attractionMarker.openPopup();

    updateRoute();

    const bounds = L.latLngBounds([
      [latitude, longitude],
      [campsiteLatitude, campsiteLongitude],
    ]);
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });

    setTimeout(() => {
      mapRef.current?.invalidateSize();
      // Öffne die Popups erneut nach dem Zoom
      campsiteMarker.openPopup();
      attractionMarker.openPopup();
    }, 100);
  }, [
    latitude,
    longitude,
    name,
    campsiteLatitude,
    campsiteLongitude,
    updateRoute,
    MAPBOX_ACCESS_TOKEN,
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
    markersRef.current = {};
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
  }, [updateRoute]); // Removed transportMode from dependencies

  // Event-Listener für Map-Bewegungen
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;
      const handleMoveEnd = () => {
        openBothPopups();
      };

      map.on("moveend", handleMoveEnd);
      map.on("zoomend", handleMoveEnd);

      return () => {
        map.off("moveend", handleMoveEnd);
        map.off("zoomend", handleMoveEnd);
      };
    }
  }, [openBothPopups]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ minHeight: "400px" }}
    />
  );
}
