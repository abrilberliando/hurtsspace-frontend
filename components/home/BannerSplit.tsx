"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        // 👇 FIX UTAMA: BYPASS CACHE VERCEL/NEXT.JS
        // Tambahkan timestamp biar selalu fresh
        const res = await api.get(`/banner/active?t=${Date.now()}`); 
        
        // Cek struktur data (handle array root atau nested data.data)
        const banners: SplitBannerData[] = Array.isArray(res.data) 
                                           ? res.data 
                                           : (res.data.data || []);
        
        // Cari banner berdasarkan posisi
        const found = banners.find(b => b.position === position);
        
        if (found) {
          setBanner(found);
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

  // 1. Loading State
  if (loading) {
    return (
      <div className="h-[30vh] md:h-[90vh] w-full bg-background flex items-center justify-center">
        <Skeleton className="h-full w-full bg-muted animate-pulse" />
      </div>
    );
  }

  // 2. Fallback State
  if (!banner || isError) {
    return fallback ? <>{fallback}</> : null;
  }

  // 3. Success State
  return (
    // 👇 REVISI: Hapus 'my-10' dan border, tetap pertahankan height mobile/desktop
    <section className="relative w-full h-[30vh] md:h-[90vh] group overflow-hidden bg-black">
        
        <Link href={banner.link_url} className="absolute inset-0 z-20" />

        {/* Grid 2 Kolom */}
        <div className="grid grid-cols-2 h-full w-full gap-0">
            {/* Kiri */}
            <div className="relative h-full w-full overflow-hidden">
                <Image
                    src={banner.image_left} 
                    alt="Banner Left"
                    fill
                    quality={100}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 ease-out"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-500" />
            </div>

            {/* Kanan */}
            {/* 👇 FIX: Pastikan tidak ada border di tengah */}
            <div className="relative h-full w-full overflow-hidden">
                <Image 
                    src={banner.image_right} 
                    alt="Banner Right"
                    fill
                    quality={100}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 ease-out"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-500" />
            </div>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-end p-4 md:p-12">
            <div className="container mx-auto w-full flex flex-row justify-between items-end gap-2 md:gap-6">
                
                {/* Judul */}
                <h2 className="text-3xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] drop-shadow-lg max-w-[60%] md:max-w-3xl break-words">
                    {banner.title.split(" ").map((word, i) => (
                        <span key={i} className="block">{word}</span>
                    ))}
                </h2>

                {/* Tombol Shop */}
                <div className="flex items-center gap-1 md:gap-2 text-white font-bold tracking-widest text-xs md:text-xl group-hover:translate-x-2 transition-transform duration-300 pb-1">
                    <span>SHOP NOW</span>
                    <ArrowRight className="w-4 h-4 md:w-6 md:h-6" />
                </div>

            </div>
        </div>

    </section>
  );
}