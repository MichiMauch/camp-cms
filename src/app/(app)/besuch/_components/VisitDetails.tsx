import React from "react";
import { MapPin, Calendar, Compass, CalendarPlus2 } from "lucide-react";

interface VisitDetailsProps {
  title: string;
  location: string;
  date: string;
  latitude: number;
  longitude: number;
  country: string;
  previousVisits?: string[]; // Liste der vorherigen Besuche hinzugefügt
}

const VisitDetails: React.FC<VisitDetailsProps> = ({
  title,
  location,
  date,
  latitude,
  longitude,
  country,
  previousVisits, // Liste der vorherigen Besuche hinzugefügt
}) => {
  return (
    <div className="col-span-12 lg:col-span-4 lg:row-span-2 bg-card rounded-[2rem] border p-8 shadow-lg">
      <h1 className="text-4xl font-bold mb-6">{title}</h1>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Standort</p>
            <p className="font-medium">
              {location}, {country} {/* Land hinter dem Standort anzeigen */}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Aufenthalt</p>
            <p className="font-medium">{date}</p>
          </div>
        </div>
        {previousVisits &&
          previousVisits.length > 0 && ( // Bedingte Anzeige der vorherigen Besuche
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CalendarPlus2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Vorherige Besuche
                </p>
                <ul className="list-disc list-inside">
                  {previousVisits.map((visit, index) => (
                    <li key={index} className="font-medium">
                      {visit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Compass className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Koordinaten</p>
            <p className="font-medium">
              {latitude}° N, {longitude}° E
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitDetails;
