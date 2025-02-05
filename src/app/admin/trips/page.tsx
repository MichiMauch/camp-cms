"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit2Icon, SaveIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface Trip {
  id: number;
  name: string | null;
  start_date: string;
  end_date: string;
  total_distance: number;
  visit_count: number;
  visit_ids: string; // Geändert zu string, da es als GROUP_CONCAT String zurückkommt
  campsite_names: string; // Geändert zu string, da es als GROUP_CONCAT String zurückkommt
  visit_dates: string; // Hinzugefügt, da es in der API zurückgegeben wird
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("de-CH");
}

function formatDistance(distance: number) {
  return `${distance.toLocaleString("de-CH")} km`;
}

function getDurationInDays(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchTrips();
  }, []);

  async function fetchTrips() {
    try {
      const response = await fetch("/api/trips");
      if (!response.ok) throw new Error("Fehler beim Laden der Trips");
      const data = await response.json();
      setTrips(data.trips);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(id: number) {
    try {
      const response = await fetch("/api/trips", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          name: editingName,
        }),
      });

      if (!response.ok) throw new Error("Fehler beim Speichern");

      setTrips(
        trips.map((trip) =>
          trip.id === id ? { ...trip, name: editingName } : trip
        )
      );
      setEditingId(null);
      setEditingName("");

      toast({
        title: "Erfolgreich gespeichert",
        description: `Der Name wurde erfolgreich aktualisiert.`,
        duration: 3000,
      });
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
      toast({
        title: "Fehler beim Speichern",
        description: "Der Name konnte nicht gespeichert werden.",
        variant: "destructive",
        duration: 3000,
      });
    }
  }

  function handleEdit(trip: Trip) {
    setEditingId(trip.id);
    setEditingName(trip.name || "");
  }

  function handleCancel() {
    setEditingId(null);
    setEditingName("");
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    tripId: number
  ) {
    if (e.key === "Enter") {
      handleSave(tripId);
    } else if (e.key === "Escape") {
      handleCancel();
    }
  }

  if (isLoading) return <div className="p-8">Lädt...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Trips mit mehreren Besuchen ({trips.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Ende</TableHead>
                <TableHead>Dauer</TableHead>
                <TableHead>Distanz</TableHead>
                <TableHead>Besuche</TableHead>
                <TableHead className="min-w-[200px]">Campingplätze</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>{trip.id}</TableCell>
                  <TableCell>
                    {editingId === trip.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, trip.id)}
                          className="w-[200px]"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSave(trip.id)}
                          title="Speichern (Enter)"
                        >
                          <SaveIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancel}
                          title="Abbrechen (Esc)"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{trip.name || "—"}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(trip)}
                        >
                          <Edit2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(trip.start_date)}</TableCell>
                  <TableCell>{formatDate(trip.end_date)}</TableCell>
                  <TableCell>
                    {getDurationInDays(trip.start_date, trip.end_date)} Tage
                  </TableCell>
                  <TableCell>{formatDistance(trip.total_distance)}</TableCell>
                  <TableCell>{trip.visit_count}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {trip.campsite_names
                        ?.split("||")
                        .filter(Boolean)
                        .map((name, index) => (
                          <div key={index} className="text-muted-foreground">
                            {index + 1}. {name}
                          </div>
                        ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}
