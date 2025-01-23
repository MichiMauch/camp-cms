"use client";

import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Navigation } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface CampingEntryCardProps {
  title: string;
  date: string;
  location: string;
  image: string;
  attractions: string[];
  id: string;
}

export default function CampingEntryCard({
  title,
  date,
  location,
  image,
  attractions,
  id,
}: CampingEntryCardProps) {
  return (
    <div className="relative h-[420px]">
      <div className="absolute inset-0 rounded-2xl">
        <div className="relative h-full rounded-2xl border border-white/10 bg-black p-6">
          {/* Small image thumbnail */}
          <div className="absolute right-6 top-6 h-24 w-24 overflow-hidden rounded-xl">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover opacity-60"
            />
          </div>

          <div className="relative z-10 flex h-full flex-col">
            <div>
              <h3 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                  {title}
                </span>
              </h3>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-white/70">
                  <Calendar className="h-4 w-4" />
                  <span>{date}</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <MapPin className="h-4 w-4" />
                  <span>{location}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex-1">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-white/90">
                  Attraktionen:
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {attractions.map((attraction) => (
                    <div
                      key={attraction}
                      className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="relative z-10 text-sm text-white/70">
                        {attraction}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link href={`/entry/${id}`} className="mt-6 block">
              <Button className="relative w-full border border-white/10 bg-white/5 hover:bg-white/10">
                <span className="relative z-10 flex items-center gap-2 text-white">
                  <Navigation className="h-4 w-4" />
                  Entdecken
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
