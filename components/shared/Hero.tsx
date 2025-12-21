"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

// Interface data (Sama)
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

export default function Hero() {
  const [data, setData] = useState<HeroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
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

  useEffect(() => {
    if (!data) return;
    const images = (Array.isArray(data.background_images) ? data.background_images.filter(url => url) : []).slice(0, 5);
    const activeImages = images.length > 0 ? images : DEFAULT_IMAGES;
    if (activeImages.length <= 1) return;

    const slideInterval = setInterval(() => {
      setCurrentSlideIndex(prevIndex => (prevIndex + 1) % activeImages.length);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, [data]);

  if (loading) {
    // Skeleton disesuaikan agar tidak terlalu tinggi di HP
    return (
      <div className="relative w-full h-[70vh] md:h-[90vh] bg-black flex items-center justify-center">
        <Skeleton className="absolute inset-0 w-full h-full bg-zinc-900 animate-pulse" />
        <div className="relative z-10 flex flex-col items-center gap-3 w-full max-w-2xl px-4">
          <Skeleton className="h-3 w-24 md:w-32 bg-zinc-800" />
          <Skeleton className="h-10 md:h-16 w-3/4 bg-zinc-800" />
          <Skeleton className="h-3 md:h-4 w-2/3 bg-zinc-800" />
          <div className="flex gap-2 mt-4">
             <Skeleton className="h-10 w-28 bg-zinc-800" />
             <Skeleton className="h-10 w-28 bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  const content = {
    title: data?.title,
    subtitle: data?.subtitle,
    description: data?.description,
    button_text: data?.button_text,
    button_link: data?.button_link,
  };

  const images = (Array.isArray(data?.background_images) ? data.background_images.filter(url => url) : []).slice(0, 5);
  const activeImages = images.length > 0 ? images : DEFAULT_IMAGES;

  return (
    // UPDATE 1: Tinggi Section
    // Kita pakai h-[70vh] di mobile biar gak terlalu makan layar, tapi tetep berasa "hero".
    <section className="relative w-full h-[35vh] md:h-[90vh] flex items-center justify-center overflow-hidden bg-black transition-all duration-300">
      
      {/* Background Image (Sama) */}
      <div className="absolute inset-0 z-0">
        {activeImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
              index === currentSlideIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Component Image Next.js */}
            <Image
              src={image}
              alt={`Hero Background ${index + 1}`}
              fill // Wajib pakai fill buat gantiin background-image
              className="object-cover" // Biar gambarnya cover area kayak CSS background-size: cover
              priority={index === 0} // Gambar pertama diload duluan biar LCP kenceng
              sizes="100vw" // Kasih tau browser ini gambar bakal full width
              quality={50} // Optimasi kualitas
            />
            
            {/* Overlay Hitam (Ditaruh di atas Image tapi di dalam div yang sama) */}
            <div className="absolute inset-0 bg-black/50 md:bg-black/60 z-[1]" />
          </div>
        ))}
      </div>

      {/* 2. Content Tengah - KUNCI PERUBAHAN DISINI */}
      {/* Kita gunakan padding (px) yang lebih kecil di mobile biar kontennya muat */}
      <div className="relative z-10 text-center px-2 md:px-4 max-w-6xl mx-auto flex flex-col items-center justify-center h-full">
        
        {/* Subtitle: Font size dikecilin di mobile (text-[10px]) */}
        <p className="text-zinc-300 tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-base mb-2 md:mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 uppercase">
          {content.subtitle}
        </p>

        {/* Judul Besar: Font size mobile dikecilin signifikan (text-3xl) biar muat sebaris/dua baris */}
        <h1 className="text-3xl md:text-8xl font-black text-white tracking-tighter mb-3 md:mb-6 leading-none md:leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 uppercase drop-shadow-2xl px-2">
          {content.title}
        </h1>

        {/* Deskripsi: PENTING! Tidak di-hide lagi di mobile. */}
        {/* Ukuran font sangat kecil (text-[11px]) dan max-width dibatasi biar jadi miniatur */}
        {content.description && (
          <p className="text-zinc-200 text-[11px] md:text-lg mb-5 md:mb-8 max-w-[280px] md:max-w-lg mx-auto leading-tight md:leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 bg-black/10 p-1 md:p-0 rounded md:bg-transparent">
            {content.description}
          </p>
        )}

        {/* Button Container: PENTING! */}
        {/* Tetap flex-row (jejer samping) di SEMUA ukuran layar. */}
        {/* Gap dikecilin di mobile (gap-2) */}
        <div className="flex flex-row gap-2 md:gap-4 justify-center items-center w-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          
          {/* Tombol Shop Now */}
          <Button
            asChild
            size="lg"
            // Padding dan font size dikecilin SANGAT agresif di mobile biar muat jejer 2
            // px-4 py-3 text-xs (mobile) vs px-10 py-7 text-xl (desktop)
            className="bg-white text-black hover:bg-zinc-200 font-black px-4 py-3 md:px-10 md:py-7 text-xs md:text-xl rounded-none transition-transform hover:scale-105 tracking-wider h-auto"
          >
            <Link href={content.button_link || "/shop"}>
              {content.button_text}
            </Link>
          </Button>

          {/* Tombol Lookbook */}
          <Button
            asChild
            variant="outline"
            size="lg"
            // Padding dan font size sama kecilnya
            className="hidden md:block border-white text-white hover:bg-white font-bold px-4 py-3 md:px-8 md:py-7 text-xs md:text-lg rounded-none bg-transparent transition-transform hover:scale-105 h-auto whitespace-nowrap"
          >
            <Link href="/lookbook">VIEW LOOKBOOK</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}