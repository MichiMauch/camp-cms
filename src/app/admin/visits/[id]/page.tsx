"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, ImageIcon, Save, Loader2, Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "../../_components/DeleteConfirmDialog";
import { useRouter } from "next/navigation";

interface Visit {
  id: string;
  dateFrom: string;
  dateTo: string;
  visitImage: string;
  campsite: {
    id: number;
    name: string;
    location: string;
    latitude: number;
    longitude: number;
  };
}

// Helper function to convert date string to YYYY-MM-DD format for input
const formatDateForInput = (dateStr: string) => {
  try {
    // If the date is already in YYYY-MM-DD format, return it
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
    // If the date is in DD.MM.YYYY format, convert it
    const [day, month, year] = dateStr.split(".");
    if (!day || !month || !year) throw new Error("Invalid date format");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  } catch (error) {
    console.error("Error formatting date for input:", dateStr, error);
    return "";
  }
};

// Helper function to convert YYYY-MM-DD to database format
const formatDateForDB = (dateStr: string) => {
  try {
    // If date is already in YYYY-MM-DD format (from input), use it directly
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
    // If date is in DD.MM.YYYY format, convert it
    const [day, month, year] = dateStr.split(".");
    if (!day || !month || !year) throw new Error("Invalid date format");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  } catch (error) {
    console.error("Error formatting date for DB:", dateStr, error);
    return dateStr;
  }
};

export default function VisitDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const [params, setParams] = useState<{ id: string } | null>(null);
  const router = useRouter();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [editedVisit, setEditedVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchParams() {
      const resolvedParams = await paramsPromise;
      setParams(resolvedParams);
    }
    fetchParams();
  }, [paramsPromise]);

  useEffect(() => {
    async function fetchVisitDetails() {
      if (!params) return;
      try {
        const response = await fetch(`/api/visits/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch visit details");
        }
        const data = await response.json();
        console.log("Visit data received:", data); // Debug log
        setVisit(data);
        setEditedVisit(data);
      } catch (err) {
        setError("Fehler beim Abrufen der Besuchsdetails.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchVisitDetails();
  }, [params]);

  const handleSave = async () => {
    if (!editedVisit) return;

    setSaving(true);
    try {
      if (!params) throw new Error("Params are null");
      const response = await fetch(`/api/visits/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editedVisit,
          dateFrom: formatDateForDB(editedVisit.dateFrom),
          dateTo: formatDateForDB(editedVisit.dateTo),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update visit");
      }

      setVisit(editedVisit);
      toast({
        title: "Erfolgreich gespeichert",
        description: "Die Änderungen wurden gespeichert.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Fehler beim Speichern",
        description: "Die Änderungen konnten nicht gespeichert werden.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (!params) throw new Error("Params are null");
      const response = await fetch(`/api/visits?id=${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete visit");
      }

      toast({
        title: "Erfolgreich gelöscht",
        description: "Der Besuch wurde gelöscht.",
      });
      router.push("/admin/visits");
    } catch {
      toast({
        variant: "destructive",
        title: "Fehler beim Löschen",
        description: "Der Besuch konnte nicht gelöscht werden.",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-[300px] w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!visit || !editedVisit) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Keine Details gefunden.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-creteround tracking-tight">
          Besuchsdetails
        </h1>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="w-[120px]">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Speichern
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Speichern
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="text-black">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="campsite">Campingplatz</TabsTrigger>
          <TabsTrigger value="media">Medien</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Besuchsinformationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">Von</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={formatDateForInput(editedVisit.dateFrom)}
                    onChange={(e) =>
                      setEditedVisit({
                        ...editedVisit,
                        dateFrom: e.target.value, // Store the YYYY-MM-DD format directly
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">Bis</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={formatDateForInput(editedVisit.dateTo)}
                    onChange={(e) =>
                      setEditedVisit({
                        ...editedVisit,
                        dateTo: e.target.value, // Store the YYYY-MM-DD format directly
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campsite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campingplatz Informationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="text-lg font-medium">
                    {editedVisit.campsite.name}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ort</Label>
                  <p className="text-lg font-medium">
                    {editedVisit.campsite.location}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Breitengrad</Label>
                    <p className="text-lg font-medium">
                      {editedVisit.campsite.latitude}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Längengrad</Label>
                    <p className="text-lg font-medium">
                      {editedVisit.campsite.longitude}
                    </p>
                  </div>
                </div>
                {editedVisit.campsite.id && (
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link href={`/admin/campsites/${editedVisit.campsite.id}`}>
                      <MapPin className="mr-2 h-4 w-4" />
                      Zum Campingplatz
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medien</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-[16/9] relative overflow-hidden rounded-lg">
                {editedVisit.visitImage ? (
                  <img
                    src={`https://pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev/${editedVisit.visitImage}.webp`}
                    alt={`Bild des Besuchs bei ${editedVisit.campsite.name}`}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="visitImage">Bild-ID</Label>
                <Input
                  id="visitImage"
                  value={editedVisit.visitImage}
                  onChange={(e) =>
                    setEditedVisit({
                      ...editedVisit,
                      visitImage: e.target.value,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between items-center">
        <Button onClick={handleSave} disabled={saving} className="w-[120px]">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Speichern
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Speichern
            </>
          )}
        </Button>
        <Button
          variant="destructive"
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={saving || isDeleting}
          className="ml-auto"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Löschen
        </Button>
      </div>

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
}
