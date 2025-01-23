import { VisitFormProps } from "../_types/upload-visit";
import { DatePicker } from "./DatePicker";
import SaveDataButton from "./SaveDataButton";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export function VisitForm({
  exifData,
  startDate,
  endDate,
  fileName,
  imageUrl,
  imageFile, // Add this prop
  onInputChange,
  onAddressInputChange,
  onFileNameChange,
  onStartDateChange,
  onEndDateChange,
}: VisitFormProps) {
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
                  src={imageUrl}
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
                value={exifData.gpsAltitude}
                onChange={onInputChange}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="latitude">Breitengrad</Label>
              <Input
                id="latitude"
                type="number"
                name="latitude"
                value={exifData.latitude}
                onChange={onInputChange}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="longitude">Längengrad</Label>
              <Input
                id="longitude"
                type="number"
                name="longitude"
                value={exifData.longitude}
                onChange={onInputChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
                value={exifData.address?.tourism || ""}
                onChange={onAddressInputChange}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="village">Location</Label>
              <Input
                id="village"
                name="village"
                value={exifData.address?.village || ""}
                onChange={onAddressInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="state">Bundesland/Kanton</Label>
              <Input
                id="state"
                name="state"
                value={exifData.address?.state || ""}
                onChange={onAddressInputChange}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="country">Land</Label>
              <Input
                id="country"
                name="country"
                value={exifData.address?.country || ""}
                onChange={onAddressInputChange}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="country_code">Ländercode</Label>
              <Input
                id="country_code"
                name="country_code"
                value={exifData.address?.country_code || ""}
                onChange={onAddressInputChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <SaveDataButton
        exifData={exifData}
        endDate={format(endDate, "dd.MM.yyyy")}
        fileName={fileName}
        imageFile={imageFile} // Pass the imageFile prop
        setError={() => {}}
      />
    </div>
  );
}
