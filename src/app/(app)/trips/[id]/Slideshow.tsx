"use client";

import { useState, useEffect } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import ParallaxImage from "../../besuch/_components/ParallaxImage";

interface SlideshowProps {
  images: string[];
  titles: string[];
}

const BASE_IMAGE_URL = "https://pub-7b46ce1a4c0f4ff6ad2ed74d56e2128a.r2.dev/";
const DEFAULT_IMAGE_EXTENSION = ".webp";

export default function Slideshow({ images, titles }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // Zeit für das Anzeigen

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative w-full h-full">
      <TransitionGroup>
        <CSSTransition key={currentIndex} timeout={1000} classNames="fade">
          <div className="absolute top-0 left-0 w-full h-full">
            <ParallaxImage
              imageSrc={`${BASE_IMAGE_URL}${images[currentIndex]}${DEFAULT_IMAGE_EXTENSION}`}
              title={titles[currentIndex]}
            />
          </div>
        </CSSTransition>
      </TransitionGroup>
      <style jsx>{`
        .fade-enter {
          opacity: 0;
        }
        .fade-enter-active {
          opacity: 1;
          transition: opacity 1000ms;
        }
        .fade-exit {
          opacity: 1;
        }
        .fade-exit-active {
          opacity: 0;
          transition: opacity 1000ms;
        }
      `}</style>
    </div>
  );
}
