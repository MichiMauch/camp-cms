"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
      iso_alpha3?: string;
      [key: string]: unknown;
    };
  } | null;
  endDate: string;
  fileName: string;
  imageFile?: File;
  setError: (error: string) => void;
}

const SaveDataButton: React.FC<SaveDataButtonProps> = ({
  exifData,
  endDate,
  fileName,
  imageFile,
  setError,
}) => {
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

  const saveData = async () => {
    if (!exifData || !exifData.address) {
      setError("EXIF-Daten sind unvollständig.");
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

      // Sende die Daten an die API
      const response = await fetch("/api/visits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exifData,
          endDate,
          fileName: savedFileName,
        }),
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
      setError("Fehler beim Speichern der Daten.");
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
};

export default SaveDataButton;
