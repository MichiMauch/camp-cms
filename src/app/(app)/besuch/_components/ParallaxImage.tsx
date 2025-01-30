import type React from "react";
import Image from "next/image";

interface ParallaxImageProps {
  imageSrc: string; // Geändert von imageUrl zu imageSrc
  title: string;
}

const ParallaxImage: React.FC<ParallaxImageProps> = ({ imageSrc, title }) => {
  return (
    <div className="relative h-screen overflow-hidden z-10">
      <div className="absolute inset-0 parallax-image" style={{ top: "0" }}>
        <Image
          src={imageSrc || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
};

export default ParallaxImage;
