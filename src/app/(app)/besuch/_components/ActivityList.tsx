import React, { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
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

  // Aktivitäten vom API holen
  useEffect(() => {
    async function fetchActivities() {
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

  if (loading) {
    return <div>Lädt...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

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
        <div className="flex gap-4">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActivities.map((activity, index) => {
          const routeType = activity.route || activity.type;

          return (
            <div
              key={index}
              className={`
                group relative p-6 rounded-2xl hover:scale-[1.02]
                transition-all cursor-pointer h-full text-black
                ${getDefaultBgClass(routeType)} 
                ${getHoverClass(routeType)}
              `}
            >
              <div className="flex justify-between items-center mb-3 pr-6">
                <h3 className="font-medium flex items-center">
                  {activity.title}
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
        })}
      </div>
    </div>
  );
};

export default ActivityList;
