"use client";

import { useEffect, useState, memo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

// --- TYPES ---
interface HeroData {
  background_images: string[] | null;
  subtitle: string | null;
  title: string | null;
  description: string | null;
  button_text: string | null;
  button_link: string | null;
}

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1523396870179-16a196759575?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550302568-d65e917d23d9?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542475734-b2586e3f05c4?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1528699264426-5b4860b72a6a?q=80&w=1920&auto=format&fit=crop",
];

// --- SUB-COMPONENT: BACKGROUND SLIDER (ISOLATED) ---
// Ini memisahkan logic slider dari content utama.
// Jadi pas gambar ganti, teks "HURTSSPACE" gak ikut re-render.
const BackgroundSlider = memo(function BackgroundSlider({
  images,
}: {
  images: string[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="absolute inset-0 z-0 mt-8 select-none pointer-events-none">
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out will-change-opacity ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={image}
            alt={`Hero Background ${index + 1}`}
            fill
            className="object-cover"
            // Optimization: Gambar pertama priority true (LCP), sisanya lazy
            priority={index === 0}
            loading={index === 0 ? "eager" : "lazy"}
            sizes="100vw"
            quality={60} // Turunin dikit, background ketutup overlay item hitam jadi gak perlu tajem2
          />
          {/* Overlay Hitam */}
          <div className="absolute inset-0 bg-black/50 md:bg-black/60 z-[1]" />
        </div>
      ))}
    </div>
  );
});

// --- MAIN COMPONENT ---
export default function Hero() {
  const [data, setData] = useState<HeroData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const res = await api.get("/hero-section");
        setData(res.data.data);
      } catch (error) {
        console.error("Failed to load hero section:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHeroData();
  }, []);

  if (loading) {
    return (
      <div className="relative w-full h-[35vh] md:h-[90vh] bg-black flex items-center justify-center">
        <Skeleton className="absolute inset-0 w-full h-full bg-zinc-900 animate-pulse" />
        <div className="relative z-10 flex flex-col items-center gap-3 w-full max-w-2xl px-4">
          <Skeleton className="h-3 w-24 md:w-32 bg-zinc-800" />
          <Skeleton className="h-8 md:h-16 w-3/4 bg-zinc-800" />
          <Skeleton className="h-3 md:h-4 w-2/3 bg-zinc-800" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-10 w-28 bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  const content = {
    title: data?.title || "HURTSSPACE",
    subtitle: data?.subtitle || "",
    description: data?.description,
    button_text: data?.button_text || "SHOP NOW",
    button_link: data?.button_link || "/shop",
  };

  // Prepare images once
  const rawImages = Array.isArray(data?.background_images)
    ? data?.background_images.filter((url) => url)
    : [];
  const activeImages =
    rawImages.length > 0 ? rawImages.slice(0, 5) : DEFAULT_IMAGES;

  return (
    <section className="relative w-full h-[35vh] md:h-[90vh] flex items-center justify-center overflow-hidden bg-black">
      
      {/* 1. Background Slider (Memoized) */}
      {/* Component ini bakal handle state slide sendiri */}
      <BackgroundSlider images={activeImages} />

      {/* 2. Content Tengah (Static) */}
      {/* Bagian ini GAK BAKAL re-render pas background ganti */}
      <div className="relative z-10 text-center px-2 md:px-4 max-w-6xl mx-auto flex flex-col items-center justify-center h-full">
        
        {/* Subtitle */}
        <p className="text-zinc-300 tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-base mb-2 md:mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 uppercase font-medium">
          {content.subtitle}
        </p>

        {/* Judul Besar */}
        <h1 className="text-3xl md:text-8xl font-black text-white tracking-tighter mb-3 md:mb-6 leading-none md:leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 uppercase drop-shadow-2xl px-2">
          {content.title}
        </h1>

        {/* Deskripsi */}
        {content.description && (
          <p className="text-zinc-200 text-[11px] md:text-lg mb-5 md:mb-8 max-w-[280px] md:max-w-lg mx-auto leading-tight md:leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 bg-black/10 p-1 md:p-0 rounded md:bg-transparent">
            {content.description}
          </p>
        )}

        {/* Button Container */}
        <div className="flex flex-row gap-2 md:gap-4 justify-center items-center w-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          <Button
            asChild
            size="lg"
            className="bg-white text-black hover:bg-zinc-200 font-black px-4 py-3 md:px-10 md:py-7 text-xs md:text-xl rounded-none transition-transform hover:scale-105 tracking-wider h-auto"
          >
            <Link href={content.button_link}>
              {content.button_text}
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="hidden md:block border-white text-white hover:bg-white/10 font-bold px-4 py-3 md:px-8 md:py-7 text-xs md:text-lg rounded-none bg-transparent transition-transform hover:scale-105 h-auto whitespace-nowrap"
          >
            <Link href="/lookbook">VIEW LOOKBOOK</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}