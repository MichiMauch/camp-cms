"use client";

import React from "react";
import { PlaceSelect } from "./PlaceSelect";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DatePicker } from "./DatePicker";
import Image from "next/image";
import SaveDataButton from "./SaveDataButton";

interface Campsite {
  id: string;
  name: string;
  location: string;
  teaser_image?: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
}

interface ExifData {
  modifyDate: string;
  gpsAltitude: number;
  latitude: number;
  longitude: number;
  address?: {
    display_name: string;
    tourism?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

interface VisitFormProps {
  exifData: ExifData;
  startDate: Date;
  endDate: Date;
  fileName: string;
  imageUrl?: string;
  imageFile?: File;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddressInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onExifDataChange?: (data: ExifData) => void; // Make this optional
}

export function VisitForm({
  exifData,
  startDate,
  endDate,
  fileName,
  imageUrl,
  imageFile,
  onInputChange,
  onAddressInputChange,
  onFileNameChange,
  onStartDateChange,
  onEndDateChange,
  onExifDataChange = () => {}, // Provide default empty function
}: VisitFormProps) {
  const [placeType, setPlaceType] = React.useState<"new" | "existing">("new");
  const [error, setError] = React.useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = React.useState<Campsite | null>(
    null
  );
  const [localExifData, setLocalExifData] = React.useState<ExifData>(exifData); // Add local state

  // Update local state when props change
  React.useEffect(() => {
    setLocalExifData(exifData);
  }, [exifData]);

  const handlePlaceSelect = (place: Campsite | null) => {
    setSelectedPlace(place);
    if (place) {
      // Aktualisiere die Formulardaten mit den ausgewählten Platzdaten
      const updatedExifData = {
        ...localExifData,
        latitude: place.latitude,
        longitude: place.longitude,
        address: {
          ...localExifData.address,
          display_name: localExifData.address?.display_name || "",
          tourism: place.name,
          village: place.location,
          country: place.country,
          country_code: place.country_code,
        },
      };
      setLocalExifData(updatedExifData); // Update local state
      onExifDataChange?.(updatedExifData); // Optional chaining for safety
    }
  };

  // Reset selectedPlace when switching to "new"
  React.useEffect(() => {
    if (placeType === "new") {
      setSelectedPlace(null);
    }
  }, [placeType]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basisdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="fileName">Bildname</Label>
                <Input
                  id="fileName"
                  name="fileName"
                  value={fileName}
                  onChange={onFileNameChange}
                />
              </div>

              <div className="space-y-4">
                <Label>Platz</Label>
                <RadioGroup
                  defaultValue="new"
                  value={placeType}
                  onValueChange={(value) =>
                    setPlaceType(value as "new" | "existing")
                  }
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="new" />
                    <Label htmlFor="new">Neuer Platz</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="existing" id="existing" />
                    <Label htmlFor="existing">Bestehender Platz</Label>
                  </div>
                </RadioGroup>

                {placeType === "existing" && (
                  <PlaceSelect
                    onPlaceSelect={handlePlaceSelect}
                    selectedPlace={selectedPlace}
                    className="mt-2"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="startDate">Datum von</Label>
                  <DatePicker date={startDate} onSelect={onStartDateChange} />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="endDate">Datum bis</Label>
                  <DatePicker date={endDate} onSelect={onEndDateChange} />
                </div>
              </div>
            </div>

            {imageUrl && (
              <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border">
                <Image
                  src={imageUrl || "/placeholder.svg"}
                  alt="Hochgeladenes Bild"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* GPS Daten Card */}
      <Card>
        <CardHeader>
          <CardTitle>GPS Daten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="gpsAltitude">Höhe</Label>
              <Input
                id="gpsAltitude"
                type="number"
                name="gpsAltitude"
                value={localExifData.gpsAltitude}
                onChange={onInputChange}
                disabled={placeType === "existing"}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="latitude">Breitengrad</Label>
              <Input
                id="latitude"
                type="number"
                name="latitude"
                value={localExifData.latitude}
                onChange={onInputChange}
                disabled={placeType === "existing"}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="longitude">Längengrad</Label>
              <Input
                id="longitude"
                type="number"
                name="longitude"
                value={localExifData.longitude}
                onChange={onInputChange}
                disabled={placeType === "existing"}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Standort Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Standort Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="tourism">Name</Label>
              <Input
                id="tourism"
                name="tourism"
                value={localExifData.address?.tourism || ""}
                onChange={onAddressInputChange}
                disabled={placeType === "existing"}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="village">Location</Label>
              <Input
                id="village"
                name="village"
                value={localExifData.address?.village || ""}
                onChange={onAddressInputChange}
                disabled={placeType === "existing"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="state">Bundesland/Kanton</Label>
              <Input
                id="state"
                name="state"
                value={localExifData.address?.state || ""}
                onChange={onAddressInputChange}
                disabled={placeType === "existing"}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="country">Land</Label>
              <Input
                id="country"
                name="country"
                value={localExifData.address?.country || ""}
                onChange={onAddressInputChange}
                disabled={placeType === "existing"}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="country_code">Ländercode</Label>
              <Input
                id="country_code"
                name="country_code"
                value={localExifData.address?.country_code || ""}
                onChange={onAddressInputChange}
                disabled={placeType === "existing"}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <SaveDataButton
        exifData={localExifData}
        endDate={endDate.toISOString().split("T")[0]}
        fileName={fileName}
        imageFile={imageFile}
        setError={setError}
        placeType={placeType}
        selectedPlace={selectedPlace}
      />

      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
