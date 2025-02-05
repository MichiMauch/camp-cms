"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, MapPin, BarChart3 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useScrollDirection } from "../../../hooks/use-scroll-direction";

const MENU_ITEMS = [
  {
    title: "Besuche",
    href: "/alle",
    icon: Menu,
  },
  {
    title: "Plätze",
    href: "/plaetze",
    icon: MapPin,
  },
  {
    title: "Trips",
    href: "/trips",
    icon: MapPin,
  },
  {
    title: "Statistik",
    href: "/stats",
    icon: BarChart3,
  },
];

export default function MainNav() {
  const pathname = usePathname();
  const isVisible = useScrollDirection();
  const [isScrolled, setIsScrolled] = useState(false);

  // Überwache Scroll-Position für Hintergrund-Effekt
  useEffect(() => {
    const scrollArea = document.querySelector(
      "[data-radix-scroll-area-viewport]"
    );

    const handleScroll = () => {
      if (scrollArea) {
        setIsScrolled(scrollArea.scrollTop > 50);
      }
    };

    scrollArea?.addEventListener("scroll", handleScroll);
    return () => scrollArea?.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Sheet>
      <motion.div
        className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between pl-4 pr-4 py-2 md:pl-8 md:pr-8 md:py-3"
        initial={{ backgroundColor: "rgba(30, 45, 47, 0.5)", y: 0 }}
        animate={{
          backgroundColor: isScrolled ? "#1E2D2F" : "rgba(30, 45, 47, 0.5)",
          backdropFilter: isScrolled ? "blur(10px)" : "blur(5px)",
          y: isVisible ? 0 : -100,
        }}
        transition={{
          duration: 0.3,
          y: {
            type: "spring",
            stiffness: 300,
            damping: 30,
          },
        }}
      >
        <Link href="/" className="text-xl font-bold text-[#A3E7CC]">
          WomoLog
        </Link>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#A3E7CC] hover:bg-[#A3E7CC]/10"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
      </motion.div>
      <SheetContent
        side="right"
        className="w-full border-[#A3E7CC]/10 bg-[#1E2D2F] p-0 sm:max-w-sm z-50"
      >
        <SheetHeader className="p-6">
          <SheetTitle className="text-left text-[#A3E7CC]">Menü</SheetTitle>
        </SheetHeader>
        <div className="grid gap-2 px-6">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`
                    flex items-center gap-3 rounded-lg px-3 py-4 text-lg
                    ${
                      isActive
                        ? "bg-[#A3E7CC]/10 text-[#A3E7CC]"
                        : "text-[#A3E7CC]/70 hover:bg-[#A3E7CC]/5 hover:text-[#A3E7CC]"
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {item.title}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
