import React from "react";
import Image from "next/image";

interface ParallaxImageProps {
  imageUrl: string;
  title: string;
}

const ParallaxImage: React.FC<ParallaxImageProps> = ({ imageUrl, title }) => {
  return (
    <div className="relative h-[80vh] overflow-hidden">
      <div className="absolute inset-0 parallax-image">
        <Image src={imageUrl} alt={title} fill className="object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
};

export default ParallaxImage;
