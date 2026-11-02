"use client";

import { useRef } from "react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyListItem } from "@/types";

interface Props {
  properties: PropertyListItem[];
}

export function FeaturedCarousel({ properties }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  // Duplicamos para loop infinito
  const items = [...properties, ...properties];

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => {
        if (trackRef.current) trackRef.current.style.animationPlayState = "paused";
      }}
      onMouseLeave={() => {
        if (trackRef.current) trackRef.current.style.animationPlayState = "running";
      }}
    >
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-white to-transparent dark:from-dark-bg" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-white to-transparent dark:from-dark-bg" />

      <div
        ref={trackRef}
        className="flex gap-5 animate-marquee"
        style={{ width: "max-content" }}
      >
        {items.map((p, i) => (
          <div key={`${p.id}-${i}`} className="w-72 shrink-0 sm:w-80">
            <PropertyCard property={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
