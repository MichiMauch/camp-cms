"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

interface PlaceSelectProps {
  onPlaceSelect: (place: Campsite | null) => void;
  selectedPlace: Campsite | null;
  className?: string;
}

export function PlaceSelect({
  onPlaceSelect,
  selectedPlace,
  className,
}: PlaceSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [places, setPlaces] = React.useState<Campsite[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/campsites");
        if (!response.ok) throw new Error("Failed to fetch campsites");
        const data = await response.json();
        setPlaces(data);
      } catch (error) {
        console.error("Error fetching campsites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={loading}
        >
          {loading
            ? "Lade Plätze..."
            : selectedPlace?.name || "Campingplatz auswählen..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Suche nach einem Campingplatz..." />
          <CommandList>
            <CommandEmpty>Keine Plätze gefunden.</CommandEmpty>
            <CommandGroup className="max-h-60 overflow-auto">
              {places.map((place) => (
                <CommandItem
                  key={place.id}
                  value={place.id}
                  onSelect={() => {
                    const isSelected = selectedPlace?.id === place.id;
                    onPlaceSelect(isSelected ? null : place);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedPlace?.id === place.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{place.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {place.location}
                      {place.country && `, ${place.country}`}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
