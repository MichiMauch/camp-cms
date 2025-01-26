import React, { useEffect, useState } from "react";
import { ExternalLink, Loader, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import styles from "./ActivityList.module.css";
import MapModal from "./MapModal";

interface Activity {
  title: string;
  description: string;
  type: string;
  gradient: string;
  from?: string;
  to?: string;
  distance?: string;
  route?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  charge?: string;
  location?: string;
}

const routeMapping: { [key: string]: string } = {
  attraction: "Attraktion",
  foot: "Wanderung",
  bicycle: "Biketour",
  caravan_site: "Camping",
};

const ActivityList: React.FC<{ latitude: number; longitude: number }> = ({
  latitude,
  longitude,
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [radius, setRadius] = useState("5000");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );

  // Funktion zum Abrufen der Aktivitäten vom API
  async function fetchActivities(forceReload = false) {
    setLoading(true);
    if (!latitude || !longitude) {
      setError("Koordinaten fehlen.");
      setLoading(false);
      return;
    }

    const cacheKey = `overpass_${latitude}_${longitude}_${radius}`;
    if (!forceReload) {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        setActivities(JSON.parse(cachedData));
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch(
        `/api/overpass?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }
      const data = await response.json();
      console.log("Fetched data from Overpass API:", data);

      if (!Array.isArray(data.elements)) {
        throw new Error("Unexpected response format");
      }

      const overpassActivities = data.elements.map((item: any) => ({
        title: item.tags.name || "Unbenannte Attraktion",
        description: item.tags.description || "",
        type:
          item.tags.tourism === "attraction"
            ? "attraction"
            : item.tags.tourism === "caravan_site"
            ? "caravan_site"
            : item.tags.route || "attraction",
        gradient: "from-gray-500/20 to-gray-500/20",
        from: item.tags.from || "",
        to: item.tags.to || "",
        distance: item.tags.distance || "",
        route: item.tags.route || "",
        website: item.tags.website || "",
        latitude: item.lat,
        longitude: item.lon,
        charge: item.tags.charge || "",
      }));

      setActivities(overpassActivities);
      localStorage.setItem(cacheKey, JSON.stringify(overpassActivities));

      // Abrufen der Ortsnamen im Hintergrund
      overpassActivities.forEach(async (activity: Activity) => {
        if (activity.latitude && activity.longitude) {
          const location = await fetchLocation(
            activity.latitude,
            activity.longitude
          );
          setActivities((prevActivities) =>
            prevActivities.map((a) =>
              a.latitude === activity.latitude &&
              a.longitude === activity.longitude
                ? { ...a, location }
                : a
            )
          );
        }
      });
    } catch (err) {
      setError("Fehler beim Abrufen der Aktivitäten.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchActivities();
  }, [latitude, longitude, radius]);

  // Funktion zum Abrufen des Ortsnamens anhand der Koordinaten
  async function fetchLocation(lat: number, lon: number): Promise<string> {
    const cacheKey = `nominatim_${lat}_${lon}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    try {
      const response = await fetch(
        `/api/nominatim?latitude=${lat}&longitude=${lon}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch location");
      }
      const data = await response.json();
      console.log("Fetched location data from Nominatim API:", data); // Debug log
      const location =
        data[0]?.address?.city ||
        data[0]?.address?.town ||
        data[0]?.address?.village ||
        "Unbekannter Ort";
      localStorage.setItem(cacheKey, JSON.stringify(location.toUpperCase()));
      return location.toUpperCase();
    } catch (err) {
      console.error("Fehler beim Abrufen des Ortsnamens:", err);
      return "UNBEKANNTER ORT";
    }
  }

  // Filter anwenden
  const filteredActivities = activities.filter(
    (activity) =>
      typeFilter === null ||
      activity.type === typeFilter ||
      activity.route === typeFilter
  );

  // Hilfsfunktionen für Klasse
  function getDefaultBgClass(routeType: string | undefined) {
    switch (routeType) {
      case "foot":
        return styles.foot;
      case "bicycle":
        return styles.bicycle;
      case "caravan_site":
        return styles.caravanSite;
      default:
        // Fallback = attraction
        return styles.attraction;
    }
  }

  function getHoverClass(routeType: string | undefined) {
    switch (routeType) {
      case "foot":
        return styles.hoverGradientFoot;
      case "bicycle":
        return styles.hoverGradientBicycle;
      case "caravan_site":
        return styles.hoverGradientCaravanSite;
      default:
        return styles.hoverGradientAttraction;
    }
  }

  return (
    <div className="col-span-12 bg-card rounded-[2rem] border p-8 shadow-lg relative z-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Aktivitäten in der Umgebung</h2>

        {/* Filter Dropdowns */}
        <div className="flex gap-4 items-center">
          {loading && (
            <Loader className="animate-spin h-6 w-6 text-muted-foreground" />
          )}
          <Select value={radius} onValueChange={setRadius}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Entfernung" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Entfernung</SelectLabel>
                <SelectItem value="1000">1 km</SelectItem>
                <SelectItem value="5000">5 km</SelectItem>
                <SelectItem value="10000">10 km</SelectItem>
                <SelectItem value="25000">25 km</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter || "all"}
            onValueChange={(value) =>
              setTypeFilter(value === "all" ? null : value)
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Aktivitätstyp" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Aktivitätstyp</SelectLabel>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="attraction">Attraktion</SelectItem>
                <SelectItem value="foot">Wanderung</SelectItem>
                <SelectItem value="bicycle">Biketour</SelectItem>
                <SelectItem value="caravan_site">Camping</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <button
            className="ml-4 text-sm text-blue-500"
            onClick={() => fetchActivities(true)}
          >
            Cache leeren und neu laden
          </button>
        </div>
      </div>

      {/* Grid der Aktivitäten */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
        {loading && (
          <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75 z-10 rounded-[1rem]">
            <Loader className="animate-spin h-8 w-8 text-muted-foreground" />
          </div>
        )}
        {filteredActivities.map((activity, index) => {
          const routeType = activity.route || activity.type;

          const content = (
            <div
              key={index}
              className={`
                group relative p-6 rounded-2xl hover:scale-[1.02]
                transition-all cursor-pointer h-full text-black
                ${getDefaultBgClass(routeType)} 
                ${getHoverClass(routeType)}
              `}
              onClick={() => setSelectedActivity(activity)}
            >
              <div className="flex flex-col justify-between items-start mb-3 pr-6">
                <span className="text-sm text-black flex items-center justify-between w-full">
                  <span className="flex items-center">
                    <MapPin
                      className="mr-2 h-4 w-4 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation(); // Verhindert Event-Bubbling
                        e.preventDefault();
                        setSelectedActivity(activity);
                      }}
                    />
                    {activity.location || " "}
                  </span>
                  <Badge variant="secondary" className="font-normal">
                    {routeType ? routeMapping[routeType] : "Unbekannt"}
                  </Badge>
                </span>

                <h2 className="font-semibold text-2xl flex items-center">
                  {activity.title}
                  {activity.website && (
                    <ExternalLink className="ml-2 h-4 w-4" />
                  )}
                </h2>
              </div>
              <div className="flex flex-col justify-between items-start">
                <span className="text-sm">
                  {activity.from && activity.to && activity.distance
                    ? `${activity.from} - ${activity.to}, ${activity.distance}km`
                    : activity.description
                    ? `${activity.description}${
                        activity.distance ? `, ${activity.distance}km` : ""
                      }`
                    : ""}
                </span>
                {activity.charge && (
                  <span className="text-sm">
                    <strong>Kosten:</strong> {activity.charge}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center mt-3">
                <button
                  className="text-sm text-black font-bold flex items-center"
                  onClick={() => setSelectedActivity(activity)}
                >
                  Auf Karte anzeigen
                  <MapPin className="ml-1 h-4 w-4" />
                </button>
                {activity.website && (
                  <a
                    href={activity.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-black font-bold flex items-center"
                  >
                    Details anzeigen
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          );

          return activity.website ? (
            <a
              key={index}
              href={activity.website}
              target="_blank"
              rel="noopener noreferrer"
              className="h-full"
            >
              {content}
            </a>
          ) : (
            content
          );
        })}
      </div>

      {selectedActivity && (
        <MapModal
          isOpen={!!selectedActivity}
          onClose={() => setSelectedActivity(null)}
          latitude={selectedActivity.latitude}
          longitude={selectedActivity.longitude}
          name={selectedActivity.title}
        />
      )}
    </div>
  );
};

export default ActivityList;
