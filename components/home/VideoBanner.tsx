"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import api from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface VideoData {
  id: number;
  title: string | null;
  description: string | null;
  video_url: string;
  link_url: string | null;
}

export default function VideoBanner() {
  const [data, setData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        // Pake timestamp biar gak kena cache
        const res = await api.get(`/video-banner/active?t=${Date.now()}`);
        setData(res.data.data); // Bisa null kalau gak ada video aktif
      } catch (e) {
        console.error("Gagal load video banner");
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[50vh] md:h-[80vh] bg-black flex items-center justify-center">
         <Skeleton className="w-full h-full bg-zinc-900 animate-pulse" />
      </div>
    );
  }

  // Kalau gak ada data video aktif, return null (komponen gak muncul)
  if (!data) return null; 

  return (
    <section className="relative w-full h-[50vh] md:h-[80vh] overflow-hidden bg-black group">
      
      {/* VIDEO BACKGROUND */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-80"
        autoPlay
        loop
        muted 
        playsInline
        poster="/placeholder.png" 
      >
        <source src={data.video_url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* OVERLAY GELAP (Gradient biar teks kebaca) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 group-hover:bg-black/30 transition-all duration-500" />

      {/* CONTENT */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
        
        {data.title && (
            <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter drop-shadow-xl mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {data.title}
            </h2>
        )}

        {data.description && (
            <p className="text-zinc-200 text-sm md:text-xl max-w-2xl mb-8 font-medium tracking-wide drop-shadow-md animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
            {data.description}
            </p>
        )}

        {data.link_url && (
            <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 font-bold px-8 h-12 rounded-none tracking-widest animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-shadow">
                <Link href={data.link_url}>
                    EXPLORE NOW <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
            </Button>
        )}
      </div>
    </section>
  );
}