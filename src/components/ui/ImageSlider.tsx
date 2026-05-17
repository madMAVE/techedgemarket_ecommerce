"use client";
import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageSliderProps {
  images: string[];
  alt: string;
  sizes?: string;
}

export default function ImageSlider({ images, alt, sizes = "300px" }: ImageSliderProps) {
  const [current, setCurrent] = useState(0);
  const count = images.length;

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent(i => (i - 1 + count) % count);
  };

  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent(i => (i + 1) % count);
  };

  const goTo = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent(index);
  };

  return (
    <div className="relative h-full w-full overflow-hidden group/slider">
       {/* Slides track */}
       <div
         className="flex h-full transition-transform duration-300 ease-in-out"
         style={{ transform: `translateX(-${current * 100}%)` }}
       >
         {images.map((src, i) => (
           <div key={i} className="relative h-full w-full shrink-0 overflow-hidden">
             <Image
               src={src}
               alt={`${alt} — view ${i + 1}`}
               fill
               className="object-cover transition-transform duration-500 group-hover/slider:scale-110"
               sizes={sizes}
             />
           </div>
         ))}
       </div>

      {/* Prev / Next arrows — only shown when multiple images */}
      {count > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity duration-200 hover:bg-white"
          >
            <ChevronLeft className="w-4 h-4 text-slate-700" />
          </button>
          <button
            onClick={next}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity duration-200 hover:bg-white"
          >
            <ChevronRight className="w-4 h-4 text-slate-700" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {count > 1 && (
        <div className="absolute bottom-2.5 left-0 right-0 z-10 flex items-center justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={e => goTo(e, i)}
              aria-label={`Go to image ${i + 1}`}
              className={`rounded-full bg-white shadow-sm transition-all duration-200 ${
                i === current
                  ? "w-2.5 h-2.5 opacity-100"
                  : "w-1.5 h-1.5 opacity-50 hover:opacity-75"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
