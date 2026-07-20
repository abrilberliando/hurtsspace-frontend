"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import api from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

export interface SplitBannerData {
  id: number;
  title: string;
  image_left: string;
  image_right: string;
  link_url: string;
  position: number;
}

interface BannerSplitProps {
  position: number;
  fallback?: React.ReactNode;
}

export default function BannerSplit({ position, fallback }: BannerSplitProps) {
  const [banner, setBanner] = useState<SplitBannerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  
  // Ref to store temporary cache data in memory (to avoid re-fetching on unmount-remount)
  const cache = useRef<Map<number, SplitBannerData>>(new Map());

  useEffect(() => {
    // 1. Cek Cache Memory dulu
    if (cache.current.has(position)) {
        setBanner(cache.current.get(position)!);
        setLoading(false);
        return;
    }

    const fetchBanner = async () => {
      try {
        // Optimization: Remove aggressive cache busting timestamp (t=Date.now())
        // Biarkan browser/CDN cache request ini sebentar (misal 60s) biar gak spam server
        const res = await api.get("/banner/active");
        
        const banners: SplitBannerData[] = Array.isArray(res.data)
          ? res.data
          : res.data.data || [];

        const found = banners.find((b) => b.position === position);

        if (found) {
          setBanner(found);
          cache.current.set(position, found); // Save to cache
        } else {
          setIsError(true);
        }
      } catch {
        setIsError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, [position]);

  if (loading) {
    return null;
  }

  if (!banner || isError) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <section className="relative w-full h-[30vh] md:h-[90vh] group overflow-hidden bg-black">
      <Link
        href={banner.link_url}
        target="_blank"
        className="absolute inset-0 z-20 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label={`Shop ${banner.title}`}
      />

      <div className="grid grid-cols-2 h-full w-full gap-0">
        {/* Kiri */}
        <div className="relative h-full w-full overflow-hidden">
          <Image
            src={banner.image_left}
            alt={`${banner.title} - Left View`}
            fill
            quality={60} // Lower slightly for background, eyes can't tell 60 vs 75 on mobile
            sizes="(max-width: 768px) 50vw, 50vw" // Akurat: Selalu setengah layar
            className="object-cover object-center transition-transform duration-1000 ease-out"
            priority // 🔥 Banner gede wajib priority biar LCP hijau
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-500" />
        </div>

        {/* Kanan */}
        <div className="relative h-full w-full overflow-hidden">
          <Image
            src={banner.image_right}
            alt={`${banner.title} - Right View`}
            fill
            quality={60}
            sizes="(max-width: 768px) 50vw, 50vw"
            className="object-cover object-center transition-transform duration-1000 ease-out"
            priority
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-500" />
        </div>
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-end p-4 md:p-12">
        <div className="container mx-auto w-full flex flex-row justify-between items-end gap-2 md:gap-6">
          <h2 className="text-3xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] drop-shadow-lg max-w-[60%] md:max-w-3xl break-words">
            {banner.title.split(" ").map((word, i) => (
              <span key={i} className="block">
                {word}
              </span>
            ))}
          </h2>

          <div className="flex items-center gap-1 md:gap-2 text-white font-bold tracking-widest text-xs md:text-xl group-hover:translate-x-2 transition-transform duration-300 pb-1">
            <span>WATCH NOW</span>
            <ArrowRight className="w-4 h-4 md:w-6 md:h-6" />
          </div>
        </div>
      </div>
    </section>
  );
}