"use client";

import { useEffect, useState } from "react";
import MainNav from "../_components/main-nav";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Compass, Tent, Bed, Bus, Route } from "lucide-react";

type Campsite = {
  name: string;
  location: string;
  country: string;
  latitude: number;
  longitude: number;
};

export default function CampingStatistics() {
  const [stats, setStats] = useState<{
    totalVisits: number;
    extremeCampsites: {
      north: Campsite;
      south: Campsite;
      east: Campsite;
      west: Campsite;
    };
    totalCampsites: number;
    currentYearVisits: number;
    totalNights: number;
    currentYearNights: number;
    currentYearCampsites: number;
    multiVisitTrips: number;
    multiVisitTripsCurrentYear: number;
    longestTripBreak: number;

    longestStay: {
      name: string;
      location: string;
      country: string;
      duration: number;
    };
    visitsPerMonth: Array<{
      month: string;
      count: number;
    }>;
    mostVisitedCampsites: Array<{
      name: string;
      location: string;
      country: string;
      visit_count: number;
    }>;
    visitsPerCountry: Array<{
      country: string;
      visit_count: number;
      country_code: string;
    }>;
    longestTrip: {
      distance: number;
      visitCount: number;
    };
    yearlyDistances: Array<{ year: string; kilometers: number }>;
    distance: {
      total: number;
      averagePerTrip: number;
      currentYear: {
        total: number;
        averagePerTrip: number;
      };
    };
  }>({
    totalVisits: 0,
    extremeCampsites: {
      north: { name: "", location: "", country: "", latitude: 0, longitude: 0 },
      south: { name: "", location: "", country: "", latitude: 0, longitude: 0 },
      east: { name: "", location: "", country: "", latitude: 0, longitude: 0 },
      west: { name: "", location: "", country: "", latitude: 0, longitude: 0 },
    },
    longestTripBreak: 0,
    totalCampsites: 0,
    currentYearVisits: 0,
    totalNights: 0,
    currentYearNights: 0,
    currentYearCampsites: 0,
    multiVisitTrips: 0,
    multiVisitTripsCurrentYear: 0,
    visitsPerMonth: [],
    longestStay: { name: "", location: "", country: "", duration: 0 },
    mostVisitedCampsites: [],
    yearlyDistances: [],
    visitsPerCountry: [],
    longestTrip: { distance: 0, visitCount: 0 },
    distance: {
      total: 0,
      averagePerTrip: 0,
      currentYear: {
        total: 0,
        averagePerTrip: 0,
      },
    },
  });

  useEffect(() => {
    async function fetchData() {
      const response = await fetch("/api/stats", {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        totalVisits: number;
        longestTripBreak: number;
        totalCampsites: number;
        currentYearVisits: number;
        totalNights: number;
        currentYearNights: number;
        currentYearCampsites: number;
        multiVisitTrips: number;
        multiVisitTripsCurrentYear: number;
        longestStay: {
          name: string;
          location: string;
          country: string;
          duration: number;
        };
        visitsPerMonth: Array<{
          month: string;
          count: number;
        }>;
        mostVisitedCampsites: Array<{
          name: string;
          location: string;
          country: string;
          visit_count: number;
        }>;
        visitsPerCountry: Array<{
          country: string;
          visit_count: number;
          country_code: string;
        }>;
        longestTrip: {
          distance: number;
          visitCount: number;
        };
        extremeCampsites: {
          north: {
            name: string;
            location: string;
            country: string;
            latitude: number;
            longitude: number;
          };
          south: {
            name: string;
            location: string;
            country: string;
            latitude: number;
            longitude: number;
          };
          east: {
            name: string;
            location: string;
            country: string;
            latitude: number;
            longitude: number;
          };
          west: {
            name: string;
            location: string;
            country: string;
            latitude: number;
            longitude: number;
          };
        };

        yearlyDistances: Array<{ year: string; kilometers: number }>;
        distance: {
          total: number;
          averagePerTrip: number;
          currentYear: {
            total: number;
            averagePerTrip: number;
          };
        };
      };
      setStats(data);
    }
    fetchData();
  }, []);

  return (
    <>
      <MainNav />
      <div className="pt-16 container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold mb-8">Camping Statistiken</h1>

        {/* Übersichtskarten */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Womo-Ausflüge
              </CardTitle>
              <Bus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVisits}</div>
              <p className="text-xs text-muted-foreground">
                {stats.currentYearVisits} dieses Jahr
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Besuchte Plätze
              </CardTitle>
              <Tent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCampsites}</div>
              <p className="text-xs text-muted-foreground">
                {stats.currentYearVisits} dieses Jahr
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Übernachtungen
              </CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNights}</div>
              <p className="text-xs text-muted-foreground">
                Ø{" "}
                {stats.totalVisits > 0
                  ? (stats.totalNights / stats.totalVisits).toFixed(1)
                  : 0}{" "}
                Nächte, <br />
                {stats.currentYearNights} Nächte dieses Jahr
              </p>
            </CardContent>
          </Card>
          {/* Gefahrene Kilometer */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Gefahrene Kilometer
              </CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.distance.total.toLocaleString("de-DE")}
              </div>
              <p className="text-sm text-muted-foreground">
                Ø {stats.distance.averagePerTrip.toLocaleString("de-DE")} km pro
                Trip, <br />
                {stats.distance.currentYear.total.toLocaleString("de-DE")} km
                dieses Jahr
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Trips mit mehreren Besuchen{" "}
              </CardTitle>
              <Bus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.multiVisitTrips}</div>
              <p className="text-xs text-muted-foreground">
                {stats.multiVisitTripsCurrentYear} dieses Jahr
                <br />
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Längster Trip
              </CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.longestTrip.distance.toLocaleString("de-DE")} Kilometer
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.longestTrip.visitCount} besuchte Orte
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Längster Aufenthalt
              </CardTitle>
              <Tent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.longestStay.duration} Nächte
              </div>
              <p className="text-xs text-muted-foreground">
                auf {stats.longestStay.name} ({stats.longestStay.location},{" "}
                {stats.longestStay.country})
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Längste Pause
              </CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.longestTripBreak} Tage
              </div>
              <p className="text-xs text-muted-foreground">
                ohne Wohnmobil-Reise
              </p>
            </CardContent>
          </Card>
        </div>
        {/* Jahresstatistiken */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Kilometer pro Jahr */}
          <Card>
            <CardHeader>
              <CardTitle>Kilometer pro Jahr</CardTitle>
              <CardDescription>Jährlich zurückgelegte Strecke</CardDescription>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <ChartContainer
                config={{
                  kilometers: {
                    label: "Kilometer",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="w-full h-[200px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.yearlyDistances}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="kilometers"
                      fill="var(--color-kilometers)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Interessante Distanz-Vergleiche */}
          <Card>
            <CardHeader>
              <CardTitle>Distanz-Vergleiche</CardTitle>
              <CardDescription>
                Basierend auf {stats.distance.total.toLocaleString("de-DE")}{" "}
                gefahrenen Kilometern
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="text-xl font-bold">
                    {Math.floor(stats.distance.total / 280)} mal
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Basel - Chiasso (280 km)
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-xl font-bold">
                    {(stats.distance.total / 40075).toFixed(2)} mal
                  </div>
                  <p className="text-sm text-muted-foreground">
                    um die Erde (40'075 km)
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-xl font-bold">
                    Noch{" "}
                    {(384400 - stats.distance.total)
                      .toLocaleString("de-DE")
                      .replace(/\./g, "'")}{" "}
                    km
                  </div>
                  <p className="text-sm text-muted-foreground">
                    bis zum Mond (384'400 km)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* 🔽 Statistik: Länder & häufigste Plätze nebeneinander */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Besuche nach Land</CardTitle>
              <CardDescription>Verteilung der Campingbesuche</CardDescription>
            </CardHeader>
            <CardContent>
              {/* 🔽 Anzeige der Verteilung nach Ländern */}
              <div className="space-y-2">
                {stats.visitsPerCountry.map((entry, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="flex items-center gap-2">
                      <span
                        className={`fi fi-${entry.country_code.toLowerCase()}`}
                      />
                      {entry.country}
                    </span>
                    <span className="font-bold">{entry.visit_count}</span>
                  </div>
                ))}
              </div>
              {/* 🔼 Ende: Anzeige der Verteilung nach Ländern */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Häufigste Besuche</CardTitle>
              <CardDescription>
                Anzahl der Besuche auf einem Platz
              </CardDescription>
            </CardHeader>
            {/* 🔽 Anzeige der meistbesuchten Campingplätze */}
            <CardContent>
              <div className="space-y-4">
                {stats.mostVisitedCampsites.map((site, index) => (
                  <div key={index} className="flex justify-between">
                    <span>
                      {site.name} ({site.location}, {site.country})
                    </span>
                    <span className="font-bold">
                      {site.visit_count} Besuche
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* 🔼 Ende: Statistik-Zeile mit zwei Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Statistik Säulendiagramm */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Besuche pro Monat</CardTitle>
              <CardDescription>
                Alle Campingplatz-Aufenthalte über alle Jahre
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: {
                    label: "Anzahl Besuche",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.visitsPerMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="count"
                      fill="var(--color-count)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
          {/* Extrempunkte in einer grossen Card */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Extremste Orte</CardTitle>
              <CardDescription>
                Nördlichster, südlichster, westlichster und östlichster Platz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 items-stretch">
                {["north", "south", "east", "west"].map((direction) => {
                  const campsite =
                    stats.extremeCampsites[
                      direction as keyof typeof stats.extremeCampsites
                    ];
                  return (
                    <div
                      key={direction}
                      className="rounded-lg border p-4 bg-muted/10 text-muted-foreground h-full"
                    >
                      <p className="text-sm text-muted-foreground capitalize">
                        {direction === "north"
                          ? "Nördlichster Platz"
                          : direction === "south"
                          ? "Südlichster Platz"
                          : direction === "east"
                          ? "Östlichster Platz"
                          : "Westlichster Platz"}
                      </p>
                      <p className="text-md font-semibold text-white">
                        {campsite.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {campsite.location}, {campsite.country}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center mt-6">
                <img
                  src="/cardinal.svg"
                  alt="Kompass"
                  className="w-16 h-16 opacity-80"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Letzte Besuche */}
      </div>
    </>
  );
}
