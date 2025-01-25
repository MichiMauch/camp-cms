"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface CampingCardProps {
  id: string;
  title: string;
  dateFrom: string; // Neues Feld für das Startdatum
  dateTo: string; // Neues Feld für das Enddatum
  location: string;
  country: string; // Neues Feld für das Land
  image: string;
}

const BASE_IMAGE_URL = "https://pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev/";
const DEFAULT_IMAGE_EXTENSION = ".webp";

export default function CampingCard({
  id,
  title,
  dateFrom, // Neues Feld für das Startdatum
  dateTo, // Neues Feld für das Enddatum
  location,
  country, // Neues Feld für das Land
  image,
}: CampingCardProps) {
  const imageUrl = `${BASE_IMAGE_URL}${image}${DEFAULT_IMAGE_EXTENSION}`; // Baue den Bildpfad direkt

  return (
    <Link href={`/besuch/${id}`}>
      <motion.div
        className="group relative aspect-video w-[300px] cursor-pointer overflow-hidden rounded-lg md:w-[400px]"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <Image
          src={imageUrl} // Verwende den aufgelösten Bildpfad
          alt={title || "Camping Image"} // Füge das alt-Attribut hinzu
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Füge das sizes-Attribut hinzu
          priority // Füge das priority-Attribut hinzu
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E2D2F] via-[#1E2D2F]/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute bottom-[-40px]  left-0 right-0 p-4 transition-transform duration-300 group-hover:translate-y-[-30%]">
          <h3 className="text-lg font-bold text-[#A3E7CC]">{title}</h3>{" "}
          {/* Stelle sicher, dass der Titel hier angezeigt wird */}
          <div className="mt-1 text-sm text-[#A3E7CC]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p>
              {dateFrom} - {dateTo}
            </p>{" "}
            {/* Anzeige des Datums von bis */}
            <p>
              {location}, {country}
            </p>{" "}
            {/* Anzeige des Landes */}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
