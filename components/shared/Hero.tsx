"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";

// Interface khusus data HeroSection (Sesuai Database)
interface HeroData {
  background_image: string;
  subtitle: string;
  title: string;
  description: string | null;
  button_text: string;
  button_link: string;
}

export default function Hero() {
  const [data, setData] = useState<HeroData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        // Nembak ke endpoint khusus Hero
        const res = await api.get("/hero-section");
        setData(res.data.data);
      } catch (error) {
        console.error("Gagal load hero section:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroData();
  }, []);

  if (loading) {
    return (
        <div className="relative w-full h-[85vh] bg-black flex items-center justify-center">
            <Skeleton className="absolute inset-0 w-full h-full bg-zinc-900 animate-pulse" />
            <div className="relative z-10 flex flex-col items-center gap-4 w-full max-w-2xl px-4">
                <Skeleton className="h-4 w-32 bg-zinc-800" />
                <Skeleton className="h-16 w-full bg-zinc-800" />
                <Skeleton className="h-4 w-2/3 bg-zinc-800" />
                <Skeleton className="h-12 w-48 bg-zinc-800 mt-4" />
            </div>
        </div>
    );
  }

  // 👇 FIX: Pastikan default value lengkap, dan gunakan OR (||) operator di setiap properti penting
  // biar kalau data dari API ada yang null/undefined, dia fallback ke default string.
  const content = {
    background_image: data?.background_image || "https://images.unsplash.com/photo-1523396870179-16a196759575?q=80&w=1920&auto=format&fit=crop",
    title: data?.title || "REDEFINE YOUR STREETWEAR.",
    subtitle: data?.subtitle || "EST. 2025 • INDONESIA",
    description: data?.description || "Minimalist cuts. Premium materials. Designed for the urban explorer who values silence in the noise.",
    button_text: data?.button_text || "SHOP COLLECTION",
    button_link: data?.button_link || "/shop" // 👈 INI OBATNYA: Fallback ke "/shop" kalau kosong
  };

  return (
    <section className="relative w-full h-[85vh] flex items-center justify-center overflow-hidden bg-black">
      
      {/* 1. Background Image Dinamis */}
      <div 
        className="absolute inset-0 z-0 animate-in fade-in duration-1000"
        style={{
            backgroundImage: `url('${content.background_image}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
        }}
      >
        {/* Overlay Hitam Pekat */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* 2. Content Tengah */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16 text-white">
        
        {/* Subtitle */}
        <p className="text-zinc-300 tracking-[0.3em] text-sm md:text-base mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 uppercase">
            {content.subtitle}
        </p>
        
        {/* Judul Besar */}
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 uppercase drop-shadow-2xl">
            {content.title}
        </h1>
        
        {/* Deskripsi */}
        {content.description && (
            <p className="text-zinc-300 text-lg mb-8 max-w-lg mx-auto leading-relaxed hidden md:block animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100">
                {content.description}
            </p>
        )}

        {/* Button Shop Now */}
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            <Button asChild size="lg" className="bg-white text-black hover:bg-zinc-200 font-black px-10 py-7 text-xl rounded-none transition-transform hover:scale-105 tracking-wider">
                {/* 👇 Pastikan href SELALU string, jangan undefined */}
                <Link href={content.button_link || "/shop"}>
                    {content.button_text}
                </Link>
            </Button>

             {/* Tombol Lookbook (Statis) */}
             <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black font-bold px-8 py-7 text-lg rounded-none bg-transparent transition-transform hover:scale-105">
                <Link href="/lookbook">
                    VIEW LOOKBOOK
                </Link>
            </Button>
        </div>

      </div>
    </section>
  );
}