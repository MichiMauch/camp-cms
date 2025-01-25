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
}

const routeMapping: { [key: string]: string } = {
  attraction: "Attraktion",
  foot: "Wanderung",
  bicycle: "Biketour",
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

  // Aktivitäten vom API holen
  useEffect(() => {
    async function fetchActivities() {
      setLoading(true);
      if (!latitude || !longitude) {
        setError("Koordinaten fehlen.");
        setLoading(false);
        return;
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
              : item.tags.route || "attraction",
          gradient: "from-gray-500/20 to-gray-500/20",
          from: item.tags.from || "",
          to: item.tags.to || "",
          distance: item.tags.distance || "",
          route: item.tags.route || "",
          website: item.tags.website || "",
          latitude: item.lat,
          longitude: item.lon,
        }));

        setActivities(overpassActivities);
      } catch (err) {
        setError("Fehler beim Abrufen der Aktivitäten.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [latitude, longitude, radius]);

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
              </SelectGroup>
            </SelectContent>
          </Select>
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
              <div className="flex justify-between items-center mb-3 pr-6">
                <h3 className="font-medium flex items-center">
                  {activity.title}
                  <MapPin
                    className="ml-2 h-4 w-4 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation(); // Verhindert Event-Bubbling
                      e.preventDefault();
                      setSelectedActivity(activity);
                    }}
                  />

                  {activity.website && (
                    <ExternalLink className="ml-2 h-4 w-4" />
                  )}
                </h3>
                <Badge variant="secondary" className="font-normal">
                  {routeType ? routeMapping[routeType] : "Unbekannt"}
                </Badge>
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
