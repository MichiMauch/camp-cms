import { useState } from "react";
import exifr from "exifr";
import { ExifData } from "../_types/upload-visit";
import { formatDate, fetchAddress, generateFileName } from "../_utils/upload-visit";

export const useFileUpload = () => {
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Add this line

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setExifData(null);
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true); // Set loading state to true
      try {
        const exif = await exifr.parse(file);
        const latitude = exif?.latitude || exif?.GPSLatitude;
        const longitude = exif?.longitude || exif?.GPSLongitude;

        setImageFile(file);  // Store the File object
        const objectUrl = URL.createObjectURL(file);
        setImageUrl(objectUrl);

        if (!latitude || !longitude) {
          setError("Keine gültigen GPS-Daten gefunden.");
          return;
        }

        const modifyDate =
          exif?.ModifyDate || exif?.DateTimeOriginal
            ? formatDate(
                new Date(exif.ModifyDate || exif.DateTimeOriginal).toISOString()
              )
            : "Nicht verfügbar";

        const gpsAltitude =
          exif?.GPSAltitude !== undefined ? exif.GPSAltitude : 0;

        const address = await fetchAddress(latitude, longitude);

        const newFileName = generateFileName(
          address.address?.tourism || "unknown",
          modifyDate
        );

        setExifData({
          modifyDate,
          gpsAltitude,
          latitude,
          longitude,
          address: {
            display_name: address.display_name,
            tourism: address.address?.tourism,
            village: address.address?.village,
            country: address.address?.country,
            country_code: address.address?.country_code,
            state: address.address?.state,  // Add this line
          },
        });
        setFileName(newFileName);
      } catch (err) {
        setError("Fehler beim Verarbeiten der Daten.");
        console.error(err);
      } finally {
        setIsLoading(false); // Set loading state to false
      }
    }
  };

  return {
    exifData,
    setExifData,
    error,
    setError,
    fileName,
    setFileName,
    imageUrl,
    imageFile,
    handleFileChange,
    isLoading, // Add this line
  };
};

