import React from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Activity {
  title: string;
  distance: string;
  type: string;
  gradient: string;
}

const activities: Activity[] = [
  {
    title: "Wandern im Schwarzwald",
    distance: "2.5 km",
    type: "Wandern",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    title: "Titisee Bootsverleih",
    distance: "4 km",
    type: "Wassersport",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    title: "Feldberg Aussichtspunkt",
    distance: "8 km",
    type: "Aussicht",
    gradient: "from-orange-500/20 to-amber-500/20",
  },
  {
    title: "Ravennaschlucht",
    distance: "12 km",
    type: "Wandern",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    title: "Hochseilgarten Titisee",
    distance: "3.5 km",
    type: "Abenteuer",
    gradient: "from-red-500/20 to-rose-500/20",
  },
  {
    title: "Schwarzwälder Skimuseum",
    distance: "5 km",
    type: "Kultur",
    gradient: "from-purple-500/20 to-violet-500/20",
  },
];

const ActivityList: React.FC = () => {
  return (
    <div className="col-span-12 bg-card rounded-[2rem] border p-8 shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">
        Aktivitäten in der Umgebung
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map((activity, index) => (
          <div
            key={index}
            className={`group relative p-6 rounded-2xl bg-gradient-to-br ${activity.gradient} 
              hover:scale-[1.02] transition-all cursor-pointer`}
          >
            <div className="absolute top-3 right-3">
              <ChevronDown className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="font-medium mb-3 pr-6">{activity.title}</h3>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {activity.distance}
              </span>
              <Badge variant="secondary" className="font-normal">
                {activity.type}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityList;
