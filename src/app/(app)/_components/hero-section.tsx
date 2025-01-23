"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { getImageUrl } from "@/utils/image";

interface HeroSectionProps {
  fallbackData?: {
    title: string;
    date: string;
    location: string;
    description: string;
    image: string;
    id: string;
  };
}

export default function HeroSection({ fallbackData }: HeroSectionProps) {
  const [data, setData] = useState(fallbackData || null);
  const [loading, setLoading] = useState(!fallbackData);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!fallbackData) {
      async function fetchLatestVisit() {
        try {
          const response = await fetch("/api/last_visit");
          if (!response.ok) {
            throw new Error("Failed to fetch latest visit data");
          }
          const result = await response.json();
          setData(result);
        } catch (err) {
          setError("Fehler beim Abrufen der Daten.");
          console.error(err);
        } finally {
          setLoading(false);
        }
      }

      fetchLatestVisit();
    }
  }, [fallbackData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-[#A3E7CC]/70">Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">{error || "Keine Daten verfügbar."}</p>
      </div>
    );
  }

  const { title, date, location, image, id } = data;

  return (
    <div className="relative aspect-[21/9] w-full overflow-hidden">
      <Image
        src={getImageUrl(image) || "/placeholder.svg"}
        alt={title}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1E2D2F] via-[#1E2D2F]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1E2D2F] via-[#1E2D2F]/50 to-transparent" />

      <div className="absolute inset-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute bottom-0 w-full"
        >
          <div className="pl-4 pr-4 pb-4 md:pl-8 md:pr-8 md:pb-8">
            <h1 className="mb-3 text-3xl font-bold text-[#A3E7CC] md:text-5xl lg:text-6xl">
              {title}
            </h1>
            <div className="mb-4 flex flex-wrap gap-4 text-lg text-[#A3E7CC]/70">
              <span>{date}</span>
              <span>•</span>
              <span>{location}</span>
            </div>
            <div className="flex gap-4">
              <Link href={`/entry/${id}`}>
                <Button
                  size="lg"
                  className="gap-2 bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90"
                >
                  <Play className="h-5 w-5" />
                  Details
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-[#A3E7CC]/30 bg-[#A3E7CC]/10 text-[#A3E7CC] backdrop-blur-sm hover:bg-[#A3E7CC]/20"
              >
                Auf der Karte ansehen
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
