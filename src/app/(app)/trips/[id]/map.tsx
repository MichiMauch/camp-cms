"use client";

import { useEffect, useCallback, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface Campsite {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  date: string;
  teaser_image: string; // Füge die teaser_image-Eigenschaft hinzu
  visit_id: string; // Füge die visit_id-Eigenschaft hinzu
}

interface MapProps {
  campsites: Campsite[];
}

const HOME_COORDINATES = {
  lat: 47.338728,
  lng: 8.0505824,
};

const BASE_IMAGE_URL = "https://pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev/";
const DEFAULT_IMAGE_EXTENSION = ".webp";

export default function TripMap({ campsites }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const popups = useRef<mapboxgl.Popup[]>([]);

  // Sortiere Campingplätze nach Datum
  const sortedCampsites = [...campsites].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Berechne den Mittelpunkt aller Campingplätze
  const center =
    sortedCampsites.length > 0
      ? {
          lat:
            sortedCampsites.reduce((sum, site) => sum + site.latitude, 0) /
            sortedCampsites.length,
          lng:
            sortedCampsites.reduce((sum, site) => sum + site.longitude, 0) /
            sortedCampsites.length,
        }
      : { lat: 46.8182, lng: 8.2275 };

  // Funktion zum Zeichnen der Route
  const drawRoute = useCallback(
    async (map: mapboxgl.Map) => {
      if (sortedCampsites.length < 1) return;

      // Erstelle die Koordinaten für die Route, einschließlich Start- und Endpunkt
      const coordinates = [
        [HOME_COORDINATES.lng, HOME_COORDINATES.lat], // Start
        ...sortedCampsites.map((site) => [site.longitude, site.latitude]),
        [HOME_COORDINATES.lng, HOME_COORDINATES.lat], // Ende
      ];

      try {
        // Erstelle die URLs für die Directions API Anfragen
        const requests = [];
        for (let i = 0; i < coordinates.length - 1; i++) {
          const start = coordinates[i].join(",");
          const end = coordinates[i + 1].join(",");
          const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start};${end}?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`;
          requests.push(fetch(url).then((res) => res.json()));
        }

        // Hole alle Routen
        const responses = await Promise.all(requests);

        // Zeichne jede Route
        responses.forEach((data, index) => {
          if (data.routes?.[0]?.geometry) {
            if (map.getSource(`route-${index}`)) {
              (
                map.getSource(`route-${index}`) as mapboxgl.GeoJSONSource
              ).setData({
                type: "Feature",
                properties: {},
                geometry: data.routes[0].geometry,
              });
            } else {
              map.addSource(`route-${index}`, {
                type: "geojson",
                data: {
                  type: "Feature",
                  properties: {},
                  geometry: data.routes[0].geometry,
                },
              });

              map.addLayer({
                id: `route-${index}`,
                type: "line",
                source: `route-${index}`,
                layout: {
                  "line-join": "round",
                  "line-cap": "round",
                },
                paint: {
                  "line-color": "#3b82f6",
                  "line-width": 4,
                  "line-opacity": 0.75,
                },
              });
            }
          }
        });
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    },
    [sortedCampsites]
  );

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [center.lng, center.lat],
      zoom: 7,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Deaktiviere das Scroll-Zoomen
    map.current.scrollZoom.disable();

    map.current.on("load", () => {
      if (map.current) {
        drawRoute(map.current);
      }
    });

    return () => {
      markers.current.forEach((marker) => marker.remove());
      popups.current.forEach((popup) => popup.remove());
      map.current?.remove();
    };
  }, [center.lat, center.lng, drawRoute]);

  useEffect(() => {
    if (!map.current) return;

    const addMarkers = () => {
      // Entferne bestehende Marker und Popups
      markers.current.forEach((marker) => marker.remove());
      popups.current.forEach((popup) => popup.remove());
      markers.current = [];
      popups.current = [];

      // Füge Home-Marker hinzu
      const homePopup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        className: "custom-popup", // Füge eine benutzerdefinierte Klasse hinzu
      }).setHTML(`
        <div class="p-2">
          <h3 class="font-bold">Start & Ende</h3>
          <p class="text-sm text-muted-foreground">
            Heimatstandort
          </p>
        </div>
      `);

      const homeEl = document.createElement("div");
      homeEl.className = "relative cursor-pointer";
      homeEl.innerHTML = `
        <div class="relative">
          <img src="/bus.png" alt="Home" class="w-8 h-8" />
          <div class="absolute -top-2 -right-2 bg-foreground text-background rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            H
          </div>
        </div>
      `;

      const homeMarker = new mapboxgl.Marker({ element: homeEl })
        .setLngLat([HOME_COORDINATES.lng, HOME_COORDINATES.lat])
        .setPopup(homePopup)
        .addTo(map.current!);

      markers.current.push(homeMarker);
      popups.current.push(homePopup);

      // Füge die Campingplatz-Marker hinzu
      sortedCampsites.forEach((site, index) => {
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
          className: "custom-popup", // Füge eine benutzerdefinierte Klasse hinzu
        }).setHTML(`
          <div class="p-2">
            <a href="/besuch/${
              site.visit_id
            }" class="text-sm font-bold text-black hover:underline">${
          site.name
        }, ${site.location}</a>
            <p class="text-sm text-black">
              Besucht am: ${new Date(site.date).toLocaleDateString("de-CH")}
            </p>
            <img src="${BASE_IMAGE_URL}${
          site.teaser_image
        }${DEFAULT_IMAGE_EXTENSION}" alt="${
          site.name
        }" class="w-full h-auto mt-2 rounded-lg" />
          </div>
        `);

        const el = document.createElement("div");
        el.className = "relative cursor-pointer";
        el.innerHTML = `
          <div class="relative">
            <img src="/bus.png" alt="Marker" class="w-8 h-8" />
            <div class="absolute -top-2 -right-2 bg-foreground text-background rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              ${index + 1}
            </div>
          </div>
        `;

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([site.longitude, site.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markers.current.push(marker);
        popups.current.push(popup);
      });
    };

    // Warte bis die Karte geladen ist
    if (map.current.loaded()) {
      addMarkers();
    } else {
      map.current.on("load", addMarkers);
    }
  }, [sortedCampsites]);

  // Füge CSS hinzu, um das Popup-Close-Icon zu stylen
  const style = document.createElement("style");
  style.innerHTML = `
    .mapboxgl-popup-close-button {
      color: black;
      font-weight: bold;
      right: 10px; /* Rechts ausrichten */
      transform: scale(2); /* Doppelt so groß */
    }
  `;
  document.head.appendChild(style);

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border">
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
}
