"use client";

import { UploadCloud } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FileUploadProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileUpload({
  className,
  onFileSelect,
  ...props
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [fileName, setFileName] = React.useState<string>("");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);

      // Create a new event to pass to the handler
      const event = {
        target: {
          files: e.dataTransfer.files,
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      onFileSelect(event);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
    onFileSelect(e);
  };

  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="picture">
        Lade hier ein Bild hoch. Es werden automatisch die Exif Daten aus dem
        Bild ausgelesen.
      </Label>
      <div
        className={cn(
          "relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border bg-muted/25 border-dashed border-muted-foreground/50 px-6 py-4 text-center transition-colors hover:bg-white",
          dragActive && "border-muted-foreground/25 bg-white",
          className
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <UploadCloud className="h-8 w-8 text-muted-foreground/100" />
        <p className="mt-2 text-sm text-muted-foreground">
          Drag & Drop oder klicken zum Auswählen
        </p>
        {fileName && (
          <p className="mt-2 text-sm text-muted-foreground">
            Ausgewählte Datei: {fileName}
          </p>
        )}
        <Input
          id="picture"
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
          {...props}
        />
      </div>
    </div>
  );
}
