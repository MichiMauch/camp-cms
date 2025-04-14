"use client";

import { useState, useEffect } from "react";
import imageCompression from "browser-image-compression";
import * as exifr from "exifr";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

interface ConvertToWebPProps {
  onExifDataExtracted?: (data: ExifData) => void;
  onWebpReady?: (file: File) => void;
}

export default function ConvertToWebP({
  onExifDataExtracted,
  onWebpReady,
}: ConvertToWebPProps) {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [webpFile, setWebpFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalFile(file);
      setWebpFile(null);
      setPreviewURL(URL.createObjectURL(file));

      try {
        const exif = await exifr.parse(file, { gps: true });
        const latitude = exif?.latitude ?? exif?.GPSLatitude;
        const longitude = exif?.longitude ?? exif?.GPSLongitude;
        const altitude = exif?.altitude ?? exif?.GPSAltitude ?? 0;
        const dateRaw = exif?.DateTimeOriginal ?? exif?.ModifyDate;

        const formattedDate = dateRaw
          ? format(new Date(dateRaw), "dd.MM.yyyy")
          : format(new Date(), "dd.MM.yyyy");

        let addressInfo: {
          display_name?: string;
          address?: {
            village?: string;
            state?: string;
            country?: string;
            country_code?: string;
          };
        } = {};

        if (latitude && longitude) {
          try {
            const response = await fetch(
              `/api/nominatim?latitude=${latitude}&longitude=${longitude}`
            );
            addressInfo = await response.json();
          } catch (apiError) {
            console.warn("Nominatim-API Fehler:", apiError);
          }
        }

        const exifData: ExifData = {
          modifyDate: formattedDate,
          gpsAltitude: altitude,
          latitude,
          longitude,
          address: {
            display_name: addressInfo.display_name ?? "",
            tourism: "",
            village: addressInfo.address?.village ?? "",
            state: addressInfo.address?.state ?? "",
            country: addressInfo.address?.country ?? "",
            country_code: addressInfo.address?.country_code ?? "",
          },
        };

        onExifDataExtracted?.(exifData);
      } catch (err) {
        console.error("EXIF oder Nominatim-Fehler:", err);
      }
    }
  };

  const uploadToCloudflare = async (file: File) => {
    try {
      const response = await fetch(
        "https://upload-worker.michi-mauch.workers.dev",
        {
          method: "POST",
          body: file,
          headers: {
            "Content-Type": file.type,
            "X-Filename": file.name,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload fehlgeschlagen: ${errorText}`);
      }

      const result = await response.json();
      console.log("Upload erfolgreich:", result);
    } catch (error) {
      console.error("Upload-Fehler:", error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const calculateSavings = (original: number, compressed: number): string => {
    if (!original || !compressed) return "-";
    const percent = ((1 - compressed / original) * 100).toFixed(1);
    return `${percent}% Ersparnis`;
  };

  const convertToWebP = async () => {
    if (!originalFile) return;
    setLoading(true);
    try {
      const options = {
        maxWidthOrHeight: 1000,
        initialQuality: 0.5,
        useWebWorker: true,
      };

      const compressedBlob = await imageCompression(originalFile, options);
      const webpBlob = new Blob([compressedBlob], { type: "image/webp" });
      const webpFileFinal = new File(
        [webpBlob],
        originalFile.name.replace(/\.[^.]+$/, ".webp"),
        { type: "image/webp" }
      );

      setWebpFile(webpFileFinal);
      setPreviewURL(URL.createObjectURL(webpFileFinal));
      onWebpReady?.(webpFileFinal);
      await uploadToCloudflare(webpFileFinal);
    } catch (err) {
      console.error("WebP-Konvertierung fehlgeschlagen:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input type="file" accept="image/*" onChange={handleFileChange} />

      {previewURL && (
        <img
          src={previewURL}
          alt="Vorschau"
          className="max-w-xs rounded border"
        />
      )}

      {originalFile && (
        <p className="text-sm text-muted-foreground">
          Originalgröße: {formatBytes(originalFile.size)}
        </p>
      )}

      {webpFile && (
        <>
          <p className="text-sm text-muted-foreground">
            WebP-Größe: {formatBytes(webpFile.size)}
          </p>
          {originalFile && (
            <p className="text-sm text-muted-foreground">
              {calculateSavings(originalFile.size, webpFile.size)}
            </p>
          )}
        </>
      )}

      <div className="flex gap-4">
        <Button onClick={convertToWebP} disabled={!originalFile || loading}>
          {loading ? "Konvertiere..." : "In WebP umwandeln"}
        </Button>
        {webpFile && (
          <a
            href={URL.createObjectURL(webpFile)}
            download={webpFile.name}
            className="inline-block px-4 py-2 bg-green-600 text-white rounded"
          >
            Download WebP
          </a>
        )}
      </div>
    </div>
  );
}
