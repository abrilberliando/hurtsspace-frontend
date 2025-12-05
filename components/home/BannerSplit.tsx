"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import api from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";

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

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await api.get("/banner/active");
        const banners: SplitBannerData[] = res.data.data;
        
        // Filter banner sesuai posisi yang diminta props
        const found = banners.find(b => b.position === position);
        
        if (found) {
            setBanner(found);
        } else {
            setIsError(true); // Gak nemu banner di posisi ini
        }
      } catch {
        setIsError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, [position]);

  // 1. Loading State (Tampilin Skeleton biar smooth)
  if (loading) {
    return (
      <div className="h-[500px] md:h-[90vh] w-full bg-background flex items-center justify-center">
        <Skeleton className="h-full w-full bg-muted animate-pulse" />
      </div>
    );
  }

  // 2. Fallback State (Kalau banner gak ada / error)
  if (!banner || isError) {
    // Kalau ada komponen fallback (misal Hero), render itu. Kalau gak, render null (ilang).
    return fallback ? <>{fallback}</> : null;
  }

  // 3. Success State (Banner Muncul)
  return (
    <section className="relative w-full h-[500px] md:h-[90vh] group overflow-hidden bg-black">
        
        <Link href={banner.link_url} className="absolute inset-0 z-20" />

        <div className="grid grid-cols-1 md:grid-cols-2 h-full w-full gap-0">
            {/* Kiri */}
            <div className="relative h-full w-full overflow-hidden">
                 <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out"
                    style={{ backgroundImage: `url(${banner.image_left})` }}
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-500" />
            </div>

            {/* Kanan */}
            <div className="relative h-full w-full overflow-hidden hidden md:block">
                <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out"
                    style={{ backgroundImage: `url(${banner.image_right})` }}
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-500" />
            </div>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-end p-6 md:p-12">
            <div className="container mx-auto w-full flex flex-col md:flex-row justify-between items-end gap-4">
                
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] drop-shadow-lg max-w-2xl">
                    {banner.title.split(" ").map((word, i) => (
                        <span key={i} className="block">{word}</span>
                    ))}
                </h2>

                <div className="flex items-center gap-2 text-white font-bold tracking-widest text-lg md:text-xl group-hover:translate-x-2 transition-transform duration-300">
                    SHOP NOW
                    <ArrowRight className="w-6 h-6" />
                </div>

            </div>
        </div>

    </section>
  );
}