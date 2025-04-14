"use client";

import React, { useState, useEffect } from "react";
import { useFileUpload } from "./_hooks/useFileUpload";
import { VisitForm } from "./_components/VisitForm";
import { parse } from "date-fns";
import ConvertToWebP from "../_components/ConvertToWebP";
import { Loader2 } from "lucide-react";

export default function UploadVisitPage() {
  const {
    exifData,
    setExifData,
    error,
    fileName,
    setFileName,
    imageUrl,
    imageFile,
    setImageFile, // Sicherstellen, dass setImageFile hier verfügbar ist
    isLoading,
  } = useFileUpload();

  const [startDate, setStartDate] = useState<Date>(() => new Date());
  const [endDate, setEndDate] = useState<Date>(() => new Date());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (exifData) {
      setExifData({
        ...exifData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (exifData && exifData.address) {
      setExifData({
        ...exifData,
        address: {
          ...exifData.address,
          [e.target.name]: e.target.value,
        },
      });
    }
  };

  useEffect(() => {
    if (exifData?.modifyDate) {
      const value = exifData.modifyDate;
      const isString = typeof value === "string";

      const parsedDate = isString
        ? parse(value, "dd.MM.yyyy", new Date())
        : new Date(value);

      setStartDate(parsedDate);
    }
  }, [exifData?.modifyDate]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Besuch erfassen</h1>

      <div className="mb-6">
        <ConvertToWebP
          onExifDataExtracted={(data) => {
            setExifData(data);
          }}
          onWebpReady={(file) => {
            setImageFile(file);
          }}
        />
      </div>

      {isLoading && (
        <div className="flex justify-center items-center">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Bild wird verarbeitet...</span>
        </div>
      )}

      {error && <p className="text-red-500">{error}</p>}

      {exifData && (
        <VisitForm
          exifData={exifData}
          startDate={startDate}
          endDate={endDate}
          fileName={fileName}
          imageUrl={imageUrl}
          imageFile={imageFile}
          onInputChange={handleInputChange}
          onAddressInputChange={handleAddressInputChange}
          onFileNameChange={(e) => setFileName(e.target.value)}
          onStartDateChange={(date) => date && setStartDate(date)}
          onEndDateChange={(date) => date && setEndDate(date)}
        />
      )}
    </div>
  );
}
