"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface SaveDataButtonProps {
  exifData: {
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
  };
  endDate: string;
  fileName: string;
  imageFile?: File;
  setError: (error: string) => void;
  placeType: "new" | "existing";
  selectedPlace: Campsite | null;
}

export default function SaveDataButton({
  exifData,
  endDate,
  fileName,
  imageFile,
  setError,
  placeType,
  selectedPlace,
}: SaveDataButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (file: File, filename: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", filename);

    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error || "Upload failed");
    }

    return filename;
  };

  const formatDate = (dateString: string) => {
    // Überprüfe, ob das Datum bereits im Format DD.MM.YYYY ist
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateString)) {
      return dateString;
    }

    // Wenn es ein ISO-String ist, konvertiere ihn
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const saveData = async () => {
    if (!exifData || !exifData.address) {
      setError("EXIF-Daten sind unvollständig.");
      return;
    }

    if (placeType === "existing" && !selectedPlace) {
      setError("Bitte wählen Sie einen bestehenden Platz aus.");
      return;
    }

    setIsLoading(true);

    try {
      let savedFileName = fileName;

      if (imageFile) {
        try {
          savedFileName = await uploadImage(imageFile, fileName);
          console.log("Image uploaded successfully, filename:", savedFileName);
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          toast({
            variant: "destructive",
            title: "Fehler beim Hochladen",
            description: (uploadError as Error).message,
          });
          setIsLoading(false);
          return;
        }
      }

      // Format dates
      const formattedModifyDate = formatDate(exifData.modifyDate);
      const formattedEndDate = formatDate(endDate);

      // Prepare the data based on placeType
      const visitData = {
        exifData: {
          ...exifData,
          modifyDate: formattedModifyDate,
          address:
            placeType === "existing"
              ? {
                  ...exifData.address,
                  tourism: selectedPlace?.name,
                  village: selectedPlace?.location,
                  country: selectedPlace?.country,
                  country_code: selectedPlace?.country_code,
                }
              : exifData.address,
        },
        endDate: formattedEndDate,
        fileName: savedFileName,
        placeType,
        campsiteId: selectedPlace?.id,
      };

      console.log("Sending data to API:", JSON.stringify(visitData, null, 2));

      // Send the data to the API
      const response = await fetch("/api/visits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(visitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save data");
      }

      setError("");
      toast({
        title: "Erfolg",
        description: "Daten wurden erfolgreich gespeichert!",
      });
    } catch (err) {
      console.error("Fehler beim Speichern der Daten:", err);
      setError(
        err instanceof Error ? err.message : "Fehler beim Speichern der Daten."
      );
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Beim Speichern ist ein Fehler aufgetreten.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={saveData}
      disabled={isLoading}
      className="w-full md:w-auto"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Speichern...
        </>
      ) : (
        "Daten speichern"
      )}
    </Button>
  );
}
