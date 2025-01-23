"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageIcon, Save, Loader2 } from "lucide-react";
import { Map } from "@/components/map";

interface Campsite {
  name: string;
  location: string;
  teaserImage: string;
  latitude: number;
  longitude: number;
}

export default function CampsiteDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const [campsite, setCampsite] = useState<Campsite | null>(null);
  const [editedCampsite, setEditedCampsite] = useState<Campsite | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const handleMarkerDrag = (lat: number, lng: number) => {
    if (editedCampsite) {
      setEditedCampsite({
        ...editedCampsite,
        latitude: lat,
        longitude: lng,
      });
    }
  };

  useEffect(() => {
    async function fetchCampsiteDetails() {
      try {
        const response = await fetch(`/api/campsites/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch campsite details");
        }
        const data = await response.json();
        setCampsite(data);
        setEditedCampsite(data);
      } catch {
        setError("Fehler beim Abrufen der Campingplatz-Details.");
        console.error("Fehler beim Abrufen der Campingplatz-Details."); // Ändere diese Zeile
      } finally {
        setLoading(false);
      }
    }

    fetchCampsiteDetails();
  }, [params.id]);

  const handleSave = async () => {
    if (!editedCampsite) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/campsites/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedCampsite),
      });

      if (!response.ok) {
        throw new Error("Failed to update campsite");
      }

      setCampsite(editedCampsite);
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

  if (!campsite || !editedCampsite) {
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
          {campsite.name}
        </h1>
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

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="location">Standort</TabsTrigger>
          <TabsTrigger value="media">Medien</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          {error && <div className="text-destructive text-center">{error}</div>}
          <Card>
            <CardHeader>
              <CardTitle>Grundinformationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editedCampsite.name}
                  onChange={(e) =>
                    setEditedCampsite({
                      ...editedCampsite,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Ort</Label>
                <Input
                  id="location"
                  value={editedCampsite.location}
                  onChange={(e) =>
                    setEditedCampsite({
                      ...editedCampsite,
                      location: e.target.value,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location" className="space-y-4">
          {error && <div className="text-destructive text-center">{error}</div>}
          <Card>
            <CardHeader>
              <CardTitle>Standort</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Breitengrad</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={editedCampsite.latitude}
                    onChange={(e) =>
                      setEditedCampsite({
                        ...editedCampsite,
                        latitude: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Längengrad</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={editedCampsite.longitude}
                    onChange={(e) =>
                      setEditedCampsite({
                        ...editedCampsite,
                        longitude: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <Map
                center={[editedCampsite.latitude, editedCampsite.longitude]}
                markers={[
                  {
                    position: [
                      editedCampsite.latitude,
                      editedCampsite.longitude,
                    ],
                    popup: editedCampsite.name,
                  },
                ]}
                draggable={true}
                onMarkerDrag={handleMarkerDrag}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          {error && <div className="text-destructive text-center">{error}</div>}
          <Card>
            <CardHeader>
              <CardTitle>Medien</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-[16/9] relative overflow-hidden rounded-lg">
                {editedCampsite.teaserImage ? (
                  <img
                    src={`https://pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev/${editedCampsite.teaserImage}.webp`}
                    alt={editedCampsite.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="teaserImage">Bild-ID</Label>
                <Input
                  id="teaserImage"
                  value={editedCampsite.teaserImage}
                  onChange={(e) =>
                    setEditedCampsite({
                      ...editedCampsite,
                      teaserImage: e.target.value,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
