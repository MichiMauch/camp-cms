"use client";

import React, { useState } from "react";
import { useFileUpload } from "./_hooks/useFileUpload";
import { VisitForm } from "./_components/VisitForm";
import { parse } from "date-fns";
import { FileUpload } from "./_components/FileUpload";
import { Loader2 } from "lucide-react";

export default function UploadVisitPage() {
  const {
    exifData,
    setExifData,
    error,
    fileName,
    setFileName,
    imageUrl,
    imageFile, // Add this line
    handleFileChange,
    isLoading, // Add this line
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

  // Update start date when exif data changes
  React.useEffect(() => {
    if (exifData?.modifyDate) {
      const parsedDate = parse(exifData.modifyDate, "dd.MM.yyyy", new Date());
      setStartDate(parsedDate);
    }
  }, [exifData?.modifyDate]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Besuch erfassen</h1>

      <div className="mb-6">
        <FileUpload onFileSelect={handleFileChange} />
      </div>

      {isLoading && (
        <div className="flex justify-center items-center">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Bild wird hochgeladen...</span>
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
          imageFile={imageFile} // Add this line
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
