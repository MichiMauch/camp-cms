"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CampingCard from "./camping-card";
import { ChevronRight } from "lucide-react";

interface ScrollSectionProps {
  title: string;
  year: string;
}

export default function ScrollSection({ title, year }: ScrollSectionProps) {
  interface Entry {
    id: string;
    title: string;
    dateFrom: string;
    dateTo: string;
    location: string;
    country: string;
    image: string;
  }

  const [entries, setEntries] = useState<Entry[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    async function fetchEntries() {
      const response = await fetch(`/api/top20peryear?year=${year}`);
      const data = await response.json();
      if (Array.isArray(data) && data.length === 0) {
        const fallbackResponse = await fetch(
          `/api/top20peryear?fallbackYear=${year}`
        );
        const fallbackData = await fallbackResponse.json();
        setEntries(Array.isArray(fallbackData) ? fallbackData : []);
      } else {
        setEntries(Array.isArray(data) ? data : []);
      }
    }
    fetchEntries();
  }, [year]);

  return (
    <div className="w-full py-4">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative pt-8 pl-4 md:pl-8 flex items-center mb-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <h2 className="text-2xl font-bold text-[#A3E7CC] md:text-3xl">
          {title}
        </h2>
        <div className="relative ml-4 overflow-hidden">
          <a
            href={`/camps/${year}`}
            className="text-sm text-[#FF6B00] block"
            style={{
              transform: isHovered ? "translateX(0)" : "translateX(-100%)",
              transition: "transform 0.3s ease-in-out",
            }}
          >
            Alle durchstöbern <ChevronRight className="inline-block ml-1" />
          </a>
        </div>
      </motion.div>
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 pl-4 md:pl-8">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex-shrink-0"
              style={{
                paddingRight: index === entries.length - 1 ? "4rem" : "0",
              }}
            >
              <CampingCard {...entry} image={entry.image} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
