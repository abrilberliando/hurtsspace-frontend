"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ArrowDown } from "lucide-react"; // Nambah icon ArrowDown
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// --- INTERFACES ---
interface Product {
  id: number;
  name: string;
  price: number | string; 
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

export default function LookBookCard() {
  // State Data
  const [lookbooks, setLookbooks] = useState<Lookbook[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State UI
  const [activePoint, setActivePoint] = useState<number | null>(null);
  
  // 👇 STATE BARU: Limit Tampilan
  const [visibleCount, setVisibleCount] = useState(4); // Default 4

  useEffect(() => {
    const fetchLookbooks = async () => {
      try {
        const res = await api.get("/lookbooks");
        const data = res.data?.data || [];
        // Kita ambil banyak sekalian (misal 50), nanti di-filter pas render
        setLookbooks(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load lookbook", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLookbooks();
  }, []);

  // 🔥 HELPER: Logic Penyelamat Harga
  const displayPrice = (val: string | number): number => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 0;
    return Math.floor(num); 
  };

  // 👇 HELPER: Handle Load More
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 4); // Add 4 more items per click
  };

  // 👇 Current data to render
  const visibleLookbooks = lookbooks.slice(0, visibleCount);
  const hasMore = visibleCount < lookbooks.length; // Cek apa masih ada sisa?

  if (!loading && lookbooks.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-10">
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {visibleLookbooks.map((lookbook) => (
                <div key={lookbook.id} className="relative group block overflow-hidden bg-muted aspect-[3/4] rounded-sm animate-in fade-in duration-700">
                  
                  {/* Foto Utama */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <Image
                     src={lookbook.image_url} 
                     alt={"Lookbook"} 
                     quality={100}
                     fill
                     draggable={false}
                     sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                     className="object-cover w-full h-full transition-transform duration-1000" 
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* LOOPING HOTSPOTS */}
                  {lookbook.items.map((item) => (
                    <Popover 
                       key={item.id} 
                       open={activePoint === item.id} 
                       onOpenChange={(open) => setActivePoint(open ? item.id : null)}
                    >
                       <PopoverTrigger asChild>
                           <button
                               className={`absolute w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-20
                                 ${activePoint === item.id 
                                   ? 'bg-white text-black scale-110 rotate-45' 
                                   : 'bg-black/30 backdrop-blur-md border border-white/50 text-white hover:bg-white hover:text-black hover:scale-110'}
                               `}
                               style={{
                                   top: `${item.y_position}%`,
                                   left: `${item.x_position}%`,
                                   transform: 'translate(-50%, -50%)'
                               }}
                           >
                               <Plus className="w-4 h-4" />
                               {activePoint !== item.id && (
                                   <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-20 animate-ping"></span>
                               )}
                           </button>
                       </PopoverTrigger>
                       
                       {/* PRODUCT POPUP */}
                       <PopoverContent 
                           className="w-64 p-0 bg-background/95 backdrop-blur-xl border-border shadow-2xl rounded-xl overflow-hidden animate-in zoom-in-95 duration-200" 
                           sideOffset={10}
                           side="top"
                       >
                           <div className="flex gap-3 p-3 items-center">
                               {/* Small Product Photo */}
                               <div className="w-16 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0 border border-border/50">
                                   {/* eslint-disable-next-line @next/next/no-img-element */}
                                   <img src={item.product.images[0]?.image_url} className="w-full h-full object-cover" alt={item.product.name} />
                               </div>
                               
                               {/* Info & Tombol Shop */}
                               <div className="flex flex-col gap-1 min-w-0 w-full">
                                   <h4 className="font-bold text-xs leading-tight truncate">{item.product.name}</h4>
                                   
                                   <p className="text-xs font-medium text-muted-foreground">
                                       Rp {displayPrice(item.product.price).toLocaleString("id-ID")}
                                   </p>
                                   
                                   <Button size="sm" className="mt-1 w-full font-bold text-[10px] h-7" asChild>
                                       <Link href={`/products/${item.product.slug}`}>
                                           SHOP NOW
                                       </Link>
                                   </Button>
                               </div>
                           </div>
                       </PopoverContent>
                    </Popover>
                  ))}
                  
                  {/* Judul Lookbook di Bawah */}
                  <div className="absolute bottom-0 left-0 p-6 w-full pointer-events-none">
                     <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter drop-shadow-md">
                       {lookbook.title}
                     </h3>
                     <p className="text-white/70 text-xs mt-1 font-medium tracking-wide">Tap the dots to shop the look.</p>
                  </div>

                </div>
              ))}
            </div>

            {/* 👇 TOMBOL LOAD MORE (Hanya muncul jika masih ada sisa) */}
            {hasMore && (
                <div className="flex justify-center mt-12">
                    <Button 
                        onClick={handleLoadMore}
                        variant="outline"
                        size="lg"
                        className="px-12 h-14 border-foreground text-foreground font-bold transition-all tracking-widest text-sm rounded-none w-full md:w-auto"
                    >
                        Load More
                    </Button>
                </div>
            )}
        </>
      )}
    </section>
  );
}