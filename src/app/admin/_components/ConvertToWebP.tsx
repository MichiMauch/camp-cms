"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ConvertToWebP() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [webpFile, setWebpFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalFile(file);
      setWebpFile(null);
      setPreviewURL(URL.createObjectURL(file));
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
