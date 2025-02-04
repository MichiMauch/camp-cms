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
import { Tent, Bed, Bus, Route } from "lucide-react";

// Beispieldaten
const monthlyData = [
  { month: "Jan", visits: 2 },
  { month: "Feb", visits: 1 },
  { month: "Mar", visits: 0 },
  { month: "Apr", visits: 3 },
  { month: "Mai", visits: 4 },
  { month: "Jun", visits: 6 },
  { month: "Jul", visits: 8 },
  { month: "Aug", visits: 7 },
  { month: "Sep", visits: 5 },
  { month: "Okt", visits: 2 },
  { month: "Nov", visits: 1 },
  { month: "Dez", visits: 2 },
];

const countryData = [
  { country: "Deutschland", visits: 25 },
  { country: "Frankreich", visits: 12 },
  { country: "Italien", visits: 8 },
  { country: "Österreich", visits: 6 },
  { country: "Niederlande", visits: 4 },
];

const recentCampsites = [
  { name: "Camping am See", location: "Bayern", date: "15.10.2023" },
  { name: "Waldcamping Müller", location: "Hessen", date: "28.09.2023" },
  {
    name: "Strandcamping Nord",
    location: "Schleswig-Holstein",
    date: "15.09.2023",
  },
  { name: "Bergblick Camping", location: "Tirol, AT", date: "22.08.2023" },
  {
    name: "Seecamping Blau",
    location: "Baden-Württemberg",
    date: "05.08.2023",
  },
];

export default function CampingStatistics() {
  const [stats, setStats] = useState<{
    totalVisits: number;
    totalCampsites: number;
    currentYearVisits: number;
    totalNights: number;
    currentYearNights: number;
    currentYearCampsites: number;
    multiVisitTrips: number;
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
    totalCampsites: 0,
    currentYearVisits: 0,
    totalNights: 0,
    currentYearNights: 0,
    currentYearCampsites: 0,
    multiVisitTrips: 0,
    yearlyDistances: [],
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
      const response = await fetch("/api/stats");
      const data = await response.json();
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
                {stats.currentYearCampsites} dieses Jahr
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
                {stats.currentYearVisits} dieses Jahr
                <br />
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
            <CardContent>
              <ChartContainer
                config={{
                  kilometers: {
                    label: "Kilometer",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[200px]"
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
              <CardTitle>Interessante Distanz-Vergleiche</CardTitle>
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
        {/* Übernachtungen */}
        <Card>
          <CardHeader>
            <CardTitle>Übernachtungen</CardTitle>
            <CardDescription>
              Gesamtanzahl der Übernachtungen im Wohnmobil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Gesamt</span>
                <span className="text-2xl font-bold">
                  {stats.totalNights} Nächte
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Dieses Jahr</span>
                <span className="text-xl font-semibold">
                  {stats.currentYearNights} Nächte
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Durchschnitt pro Besuch</span>
                <span className="text-xl font-semibold">
                  {stats.totalVisits > 0
                    ? (stats.totalNights / stats.totalVisits).toFixed(1)
                    : 0}{" "}
                  Nächte
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Besuche pro Monat */}
        <Card>
          <CardHeader>
            <CardTitle>Saisonale Verteilung</CardTitle>
            <CardDescription>
              Anzahl der Campingbesuche pro Monat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                visits: { label: "Besuche", color: "hsl(var(--chart-2))" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="visits"
                    stroke="var(--color-visits)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Letzte Besuche */}
        <Card>
          <CardHeader>
            <CardTitle>Letzte Besuche</CardTitle>
            <CardDescription>
              Die 5 zuletzt besuchten Campingplätze
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCampsites.map((site, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="font-medium">{site.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {site.location}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {site.date}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weitere Statistiken */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Campingplätze</CardTitle>
              <CardDescription>Am häufigsten besuchte Plätze</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Camping Waldwiese</span>
                  <span className="font-bold">5 Besuche</span>
                </div>
                <div className="flex justify-between">
                  <span>Seecamping Blau</span>
                  <span className="font-bold">4 Besuche</span>
                </div>
                <div className="flex justify-between">
                  <span>Bergcamping Höhe</span>
                  <span className="font-bold">3 Besuche</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aufenthaltsdauer</CardTitle>
              <CardDescription>Statistiken zur Verweildauer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Längster Aufenthalt</span>
                  <span className="font-bold">12 Tage</span>
                </div>
                <div className="flex justify-between">
                  <span>Durchschnittlicher Aufenthalt</span>
                  <span className="font-bold">3.4 Tage</span>
                </div>
                <div className="flex justify-between">
                  <span>Kürzester Aufenthalt</span>
                  <span className="font-bold">1 Tag</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
