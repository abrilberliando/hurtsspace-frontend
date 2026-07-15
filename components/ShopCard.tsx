"use client";

import { useState, useRef, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";

// Global Helpers (Hemat Memory)
const displayPrice = (val: string | number): number => {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return 0;
  return Math.floor(num);
};

export interface Variant {
  id: number;
  size: string;
  stock: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number | string;
  is_new_arrival?: boolean | number | string;
  images: { image_url: string }[];
  variants: Variant[];
  category?: { id?: number | string; name: string };
  category_id?: number | string;
}

function ShopCardComponent({ item }: { item: Product }) {
  const images = item.images || [];
  const variants = item.variants || [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [hasHovered, setHasHovered] = useState(false); // 🔥 Optimasi Lazy Image Fetch
  
  const containerRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<DOMRect | null>(null);

  // Calculate bounds ONLY on mouse enter
  const handleMouseEnter = useCallback(() => {
    setHasHovered(true); // User mulai interaksi, izinkan render gambar lain
    if (containerRef.current) {
      boundsRef.current = containerRef.current.getBoundingClientRect();
    }
  }, []);

  // Logic hover ringan tanpa calc layout ulang
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (images.length <= 1 || !boundsRef.current) return;

    const { left, width } = boundsRef.current;
    if (width === 0) return;

    const x = e.clientX - left;
    const percentage = x / width;
    const index = Math.floor(percentage * images.length);
    const safeIndex = Math.min(Math.max(index, 0), images.length - 1);

    setActiveIndex((prev) => (prev !== safeIndex ? safeIndex : prev));
  }, [images.length]);

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(0);
    boundsRef.current = null; // Cleanup memory
  }, []);

  const isNewArrival = item.is_new_arrival === 1 || item.is_new_arrival === "1" || item.is_new_arrival === true;

  return (
    <div className="w-full max-w-[350px] group relative select-none will-change-transform">
      {/* IMAGE */}
      <div
        ref={containerRef}
        className="relative aspect-[3/4] bg-muted overflow-hidden rounded-md mb-3 md:mb-4 cursor-pointer transform-gpu"
        onMouseEnter={handleMouseEnter} // Trigger calc here
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <Link
          href={`/products/${item.slug}`}
          className="block w-full h-full relative"
        >
          {images.length > 0 ? (
            images.map((img, idx) => {
              // 🔥 OPTIMASI: HANYA RENDER JIKA: idx === 0 ATAU user sudah pernah hover
              if (idx !== 0 && !hasHovered) return null;

              return (
                <Image
                  key={idx}
                  src={img.image_url}
                  alt={`${item.name} - ${idx}`}
                  fill
                  // Optimization: sizes accurate for grid
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={`
                    absolute inset-0 w-full h-full object-cover object-center 
                    transition-opacity duration-300 ease-in-out
                    ${
                      idx === activeIndex
                        ? "opacity-100 z-10"
                        : "opacity-0 z-0"
                    }
                  `}
                  draggable={false}
                  priority={idx === 0}
                  loading={idx === 0 ? "eager" : "lazy"}
                  quality={60} // Sedikit diturunin biar enteng
                />
              );
            })
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700 font-bold text-lg md:text-2xl">
              HURTS
            </div>
          )}
        </Link>
        
        {/* Badge New */}
        {isNewArrival && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider z-20">
            New
            </div>
        )}

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full shadow-sm backdrop-blur-sm transition-all duration-300 ${
                  i === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* INFO */}
      <div className="space-y-1 px-1">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 md:gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold uppercase text-xs md:text-sm tracking-wide leading-tight truncate">
              <Link
                href={`/products/${item.slug}`}
                className="hover:underline underline-offset-4"
              >
                {item.name}
              </Link>
            </h3>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 truncate">
              {item.category?.name || "Streetwear"}
            </p>
          </div>
          <p className="text-xs md:text-sm font-bold whitespace-nowrap">
            Rp {displayPrice(item.price).toLocaleString("id-ID")}
          </p>
        </div>

        {/* SIZE */}
        <div className="flex flex-wrap gap-1 pt-1">
          {variants.length > 0 ? (
            variants.map((variant) => {
              const isAvailable = variant.stock > 0;
              return (
                <span
                  key={variant.id}
                  className={`
                    text-[9px] md:text-[10px] px-1.5 py-0.5 border rounded-sm font-medium transition-colors
                    ${
                      isAvailable
                        ? "border-zinc-700 text-foreground cursor-default"
                        : "border-border text-muted-foreground/50 line-through bg-muted/30 cursor-not-allowed"
                    }
                  `}
                >
                  {variant.size}
                </span>
              );
            })
          ) : (
            <span className="text-[9px] md:text-[10px] text-muted-foreground italic">
              No size info
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// 🔥 MEMOIZATION: Mencegah re-render massal saat parent update
export const ShopCard = memo(ShopCardComponent);
