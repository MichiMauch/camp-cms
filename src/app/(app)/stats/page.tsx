"use client";

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
import { Tent, Calendar, Map, Car } from "lucide-react";

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

const yearlyData = [
  { year: "2019", kilometers: 4521, campsites: 8 },
  { year: "2020", kilometers: 2890, campsites: 5 },
  { year: "2021", kilometers: 5234, campsites: 10 },
  { year: "2022", kilometers: 7845, campsites: 15 },
  { year: "2023", kilometers: 8459, campsites: 17 },
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
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-8">Camping Statistiken</h1>

      {/* Übersichtskarten */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Besuchte Campingplätze
            </CardTitle>
            <Tent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">55</div>
            <p className="text-xs text-muted-foreground">12 dieses Jahr</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtnächte</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">186</div>
            <p className="text-xs text-muted-foreground">
              Ø 3.4 Nächte pro Besuch
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Besuchte Länder
            </CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Meist besucht: Deutschland
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gefahrene Kilometer
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.459</div>
            <p className="text-xs text-muted-foreground">Ø 154 km pro Trip</p>
          </CardContent>
        </Card>
      </div>

      {/* Campingplätze pro Land */}
      <Card>
        <CardHeader>
          <CardTitle>Campingplätze pro Land</CardTitle>
          <CardDescription>
            Anzahl der besuchten Campingplätze nach Land
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              visits: {
                label: "Besuche",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="visits" fill="var(--color-visits)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Besuche pro Monat */}
      <Card>
        <CardHeader>
          <CardTitle>Saisonale Verteilung</CardTitle>
          <CardDescription>Anzahl der Campingbesuche pro Monat</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              visits: {
                label: "Besuche",
                color: "hsl(var(--chart-2))",
              },
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

      {/* Jahresstatistiken */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Kilometer pro Jahr */}
        <Card>
          <CardHeader>
            <CardTitle>Kilometer pro Jahr</CardTitle>
            <CardDescription>Jährlich zurückgelegte Strecke</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {yearlyData.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{data.year}</span>
                  <span>{data.kilometers.toLocaleString()} km</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Besuche pro Jahr */}
        <Card>
          <CardHeader>
            <CardTitle>Besuche pro Jahr</CardTitle>
            <CardDescription>Anzahl der Campingplätze pro Jahr</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                campsites: {
                  label: "Campingplätze",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="campsites"
                    fill="var(--color-campsites)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

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
                <div className="text-sm text-muted-foreground">{site.date}</div>
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
  );
}
