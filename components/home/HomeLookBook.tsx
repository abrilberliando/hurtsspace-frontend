"use client";

import { useEffect, useState, memo } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// --- TYPES ---
interface Product {
  id: number;
  name: string;
  price: number;
  slug: string;
  images: { image_url: string }[];
}

interface LookbookItem {
  id: number;
  x_position: number;
  y_position: number;
  product: Product;
}

interface Lookbook {
  id: number;
  title: string;
  image_url: string;
  items: LookbookItem[];
}

// --- SUB-COMPONENT: HOTSPOT (Memoized) ---
// Kita pisahin biar main component lebih bersih & logic popup terisolasi per titik
const LookbookHotspot = memo(({ item, activePoint, setActivePoint }: { 
    item: LookbookItem, 
    activePoint: number | null, 
    setActivePoint: (id: number | null) => void 
}) => {
    const isOpen = activePoint === item.id;

    return (
        <Popover open={isOpen} onOpenChange={(open) => setActivePoint(open ? item.id : null)}>
            <PopoverTrigger asChild>
                <button
                    className={`
                        absolute w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-20 shadow-lg
                        ${isOpen 
                            ? "bg-white text-black scale-110 rotate-45 ring-4 ring-black/10" 
                            : "bg-black/40 backdrop-blur-md border border-white/60 text-white hover:bg-white hover:text-black "
                        }
                    `}
                    style={{
                        top: `${item.y_position}%`,
                        left: `${item.x_position}%`,
                        transform: "translate(-50%, -50%)",
                    }}
                    aria-label={`View ${item.product.name}`}
                >
                    <Plus className="w-4 h-4" strokeWidth={3} />
                    
                    {/* Ping Effect (Cuma muncul kalau belum dibuka) */}
                    {!isOpen && (
                        <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-30 animate-ping duration-1000"></span>
                    )}
                </button>
            </PopoverTrigger>

            <PopoverContent
                className="w-64 p-0 bg-background/95 backdrop-blur-xl border-border shadow-2xl rounded-xl overflow-hidden"
                sideOffset={10}
                side="top"
                align="center"
            >
                {/* Render Content Cuma Kalau Open (Lazy Render) */}
                {isOpen && (
                    <div className="flex gap-3 p-3 items-center animate-in fade-in zoom-in-95 duration-200">
                        {/* Thumbnail Image */}
                        <div className="relative w-16 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0 border border-border/50">
                            <Image
                                src={item.product.images[0]?.image_url}
                                alt={item.product.name}
                                fill
                                sizes="64px"
                                className="object-cover"
                                quality={40} // Thumbnail kecil, quality rendah gpp
                            />
                        </div>

                        {/* Info */}
                        <div className="flex flex-col gap-1 min-w-0 w-full">
                            <h4 className="font-bold text-xs leading-tight truncate">
                                {item.product.name}
                            </h4>
                            <p className="text-xs font-medium text-muted-foreground">
                                Rp {item.product.price.toLocaleString("id-ID")}
                            </p>

                            <Button
                                size="sm"
                                className="mt-1 w-full font-bold text-[10px] h-7"
                                asChild
                            >
                                <Link href={`/products/${item.product.slug}`}>
                                    SHOP NOW
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
});
LookbookHotspot.displayName = "LookbookHotspot";


// --- MAIN COMPONENT ---
export default function HomeLookbook() {
  const [lookbooks, setLookbooks] = useState<Lookbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePoint, setActivePoint] = useState<number | null>(null);

  useEffect(() => {
    const fetchLookbooks = async () => {
      try {
        const res = await api.get("/lookbooks");
        const data = res.data?.data || [];
        setLookbooks(Array.isArray(data) ? data.slice(0, 2) : []);
      } catch (error) {
        console.error("Gagal load lookbook home", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLookbooks();
  }, []);

  if (!loading && lookbooks.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-10">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="aspect-[3/4] w-full rounded-sm" />
          <Skeleton className="aspect-[3/4] w-full rounded-sm" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lookbooks.map((lookbook) => (
            <div
              key={lookbook.id}
              className="relative group block overflow-hidden bg-muted aspect-[3/4] rounded-sm select-none"
            >
              {/* Background Image */}
              <Image
                src={lookbook.image_url}
                alt={lookbook.title|| "Product Thumbnail"}
                fill
                quality={80} // Naikkan dikit biar tajem
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover w-full h-full transition-transform duration-700"
                priority // Lookbook biasanya visual penting, load cepet
                draggable={false}
              />

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity" />

              {/* Hotspots */}
              {lookbook.items.map((item) => (
                <LookbookHotspot 
                    key={item.id} 
                    item={item} 
                    activePoint={activePoint} 
                    setActivePoint={setActivePoint} 
                />
              ))}

              {/* Title & Info */}
              <div className="absolute bottom-0 left-0 p-6 w-full pointer-events-none transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter drop-shadow-lg leading-none mb-2">
                  {lookbook.title}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-white animate-pulse"></span>
                    <p className="text-white/80 text-xs font-bold tracking-widest uppercase">
                    Tap the dots to shop
                    </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}