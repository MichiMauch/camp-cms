"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface CampingCardProps {
  id: string;
  title: string;
  dateFrom: string;
  dateTo: string;
  location: string;
  country: string;
  image: string;
}

const BASE_IMAGE_URL = "https://pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev/";
const DEFAULT_IMAGE_EXTENSION = ".webp";

export default function CampingCard({
  id,
  title,
  dateFrom,
  dateTo,
  location,
  country,
  image,
}: CampingCardProps) {
  const imageUrl = `${BASE_IMAGE_URL}${image}${DEFAULT_IMAGE_EXTENSION}`;

  return (
    <Link href={`/besuch/${id}`}>
      <motion.div
        className="group w-[300px] md:w-[400px] cursor-pointer overflow-hidden rounded-lg"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <Image
          src={imageUrl}
          alt={title || "Camping Image"}
          width={400}
          height={225} // 16:9-Verhältnis
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
          className="object-cover w-full h-auto transition-transform duration-500 group-hover:scale-110 rounded-lg"
        />

        <div className="bg-gradient-to-t from-[#1E2D2F] via-[#1E2D2F]/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 absolute top-0 left-0 w-full h-full z-10" />

        <div className="absolute bottom-[-40px] left-0 right-0 p-4 transition-transform duration-300 group-hover:translate-y-[-30%] z-20">
          <h3 className="text-lg font-bold text-[#A3E7CC]">{title}</h3>
          <div className="mt-1 text-sm text-[#A3E7CC]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p>
              {dateFrom} - {dateTo}
            </p>
            <p>
              {location}, {country}
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
