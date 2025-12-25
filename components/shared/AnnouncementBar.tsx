"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import Marquee from "react-fast-marquee";
import { X } from "lucide-react";

interface RunningText {
  id: number;
  content: string;
  link_url: string | null;
}

export default function AnnouncementBar() {
  const [texts, setTexts] = useState<RunningText[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Pake timestamp biar cache fresh terus dan gak nyangkut data lama
        const res = await api.get("/running-text/active?t=" + Date.now());
        // Handle format response (data wrapper)
        const data = res.data.data || [];
        setTexts(data);
      } catch (error) {
        console.error("Gagal load running text", error);
      }
    };
    fetchData();
  }, []);

  // Kalau gak ada teks aktif atau user nge-close, jangan render apa-apa
  if (texts.length === 0 || !isVisible) return null;

  return (
    <div className="bg-foreground text-background h-10 flex items-center relative overflow-hidden z-[60] border-b border-white/10">
      <Marquee 
        gradient={false} 
        speed={40} 
        className="font-bold text-xs md:text-sm tracking-widest uppercase py-2 h-full flex items-center"
      >
        {texts.map((text) => (
          <span key={text.id} className="mx-8 md:mx-20 flex items-center gap-2">
            {text.content}
            {text.link_url && (
              <Link 
                href={text.link_url} 
                className="underline underline-offset-4 hover:text-primary transition-colors font-black"
              >
                (CHECK IT OUT)
              </Link>
            )}
          </span>
        ))}
      </Marquee>
      
    </div>
  );
}