"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// --- TYPES ---
interface Variant {
  id: number;
  size: string;
  stock: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  is_new_arrival: boolean;
  images: { image_url: string }[];
  variants: Variant[];
  category?: { name: string };
}

// --- MAIN COMPONENT ---
export default function NewArrivals() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Refs & State untuk Drag Scroll
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false); 

  // Fetch Data
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products?limit=8");
        const productData = res.data?.data || [];
        setProducts(productData);
      } catch (error) {
        console.error("Gagal load new arrivals:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Logic Tombol Panah
  const scrollButton = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 350;
      current.scrollBy({ 
        left: direction === "left" ? -scrollAmount : scrollAmount, 
        behavior: "smooth" 
      });
    }
  };

  // --- LOGIC DRAG TO SCROLL (MOUSE) ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDown(true);
    setIsDragging(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
    // Reset isDragging di next tick
    setTimeout(() => setIsDragging(false), 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; 
    scrollRef.current.scrollLeft = scrollLeft - walk;
    
    if (Math.abs(walk) > 5) {
        setIsDragging(true);
    }
  };

  return (
    <section className="py-10 border-b border-border bg-background">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-5">
            <div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-2">
                    New Arrivals
                </h2>
            </div>
            
            {/* Nav Buttons */}
            <div className="hidden md:flex gap-2">
    <Button 
        variant="outline" 
        size="icon" 
        onClick={() => scrollButton("left")} 
        className="rounded-full border-zinc-700 hover:bg-zinc-800 hover:text-white w-12 h-12"
    >
        <ChevronLeft className="w-6 h-6" />
    </Button>
    <Button 
        variant="outline" 
        size="icon" 
        onClick={() => scrollButton("right")} 
        className="rounded-full border-zinc-700 hover:bg-zinc-800 hover:text-white w-12 h-12"
    >
        <ChevronRight className="w-6 h-6" />
    </Button>
</div>
        </div>

        {/* CONTENT CAROUSEL */}
        <div className="relative">
            {loading ? (
                <div className="flex gap-6 overflow-hidden">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-[280px] md:w-[350px] flex-none space-y-4">
                            <Skeleton className="aspect-3/4 w-full rounded-lg bg-muted" />
                            <Skeleton className="h-4 w-2/3 bg-muted" />
                            <Skeleton className="h-4 w-1/3 bg-muted" />
                        </div>
                    ))}
                </div>
            ) : (
                <div 
                    ref={scrollRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    className={`
                        flex gap-6 overflow-x-auto pb-8 
                        /* Hide Scrollbar */
                        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
                        /* Cursor Style */
                        ${isDown ? 'cursor-grabbing' : 'cursor-grab'}
                    `}
                    style={{ scrollBehavior: isDown ? "auto" : "smooth" }}
                >
                    {Array.isArray(products) && products.length > 0 ? (
                        products.map((item) => (
                            <ArrivalCard key={item.id} item={item} isDraggingParent={isDragging} />
                        ))
                    ) : (
                        <div className="w-full text-center py-10 text-muted-foreground">
                            Belum ada barang baru nih, G.
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Bottom Action */}
        <div className="mt-3 text-center">
             <Button asChild variant="default" size="lg" className="px-10 h-12 font-bold tracking-widest text-xs md:text-sm rounded-none">
                <Link href="/shop?sort=new">
                    ALL NEW ARRIVALS
                </Link>
             </Button>
        </div>

      </div>
    </section>
  );
}

// --- SUB-COMPONENT: CARD DENGAN HOVER SWAP (INSTANT LOAD) ---
function ArrivalCard({ item, isDraggingParent }: { item: Product, isDraggingParent: boolean }) {
    const images = item.images || [];
    const variants = item.variants || [];
    
    // State untuk gambar aktif
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Logic Ganti Gambar berdasarkan Posisi Mouse
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        // Kalau lagi nge-drag parent (geser list), jangan ganti gambar
        if (isDraggingParent) return;
        if (!containerRef.current || images.length <= 1) return;
        
        const { left, width } = containerRef.current.getBoundingClientRect();
        const x = e.clientX - left; // Posisi X mouse relatif terhadap kartu
        
        const percentage = x / width;
        const index = Math.floor(percentage * images.length);
        
        const safeIndex = Math.min(Math.max(index, 0), images.length - 1);
        setActiveIndex(safeIndex);
    };

    const handleMouseLeave = () => {
        setActiveIndex(0); // Reset ke gambar pertama pas mouse keluar
    };

    const handleLinkClick = (e: React.MouseEvent) => {
        if (isDraggingParent) e.preventDefault();
    };

    return (
        <div className="w-[230px] md:w-[270px] flex-none snap-start group relative select-none">
            
            {/* 1. IMAGE CONTAINER (STACKED IMAGES) */}
            <div 
                ref={containerRef}
                className="relative aspect-3/4 bg-muted overflow-hidden rounded-md mb-4 border border-border"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {/* Badge */}
                <div className="absolute top-3 left-3 z-30 pointer-events-none">
                    <Badge className="bg-white text-black hover:bg-white font-bold rounded-none text-[10px]">NEW</Badge>
                </div>

                {/* Wrapper Link */}
                <Link 
                    href={`/products/${item.slug}`} 
                    onClick={handleLinkClick}
                    draggable={false}
                    className="block w-full h-full relative"
                >
                    {images.length > 0 ? (
                        // 👇 TEKNIK STACKING: Render SEMUA gambar, mainkan opacity
                        images.map((img, idx) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                                key={idx}
                                src={img.image_url} 
                                alt={`${item.name} - ${idx}`}
                                className={`
                                    absolute inset-0 w-full h-full object-cover object-center 
                                    transition-opacity duration-300 ease-in-out
                                    ${idx === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}
                                `}
                                draggable={false} 
                            />
                        ))
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700 font-bold text-2xl">HURTS</div>
                    )}
                </Link>

                {/* Dots Indicator */}
                {images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none">
                        {images.map((_, i) => (
                            <div 
                                key={i} 
                                className={`h-1.5 rounded-full shadow-sm backdrop-blur-sm transition-all duration-300 ${i === activeIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} 
                            />
                        ))}
                    </div>
                )}
                
                {/* Overlay Hitam Transparan buat Indikasi Area (Opsional) */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none bg-black z-20" />
            </div>

            {/* 2. INFO & SIZES */}
            <div className="space-y-2 px-1">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold uppercase text-sm tracking-wide leading-tight truncate">
                            <Link href={`/products/${item.slug}`} onClick={handleLinkClick} className="hover:underline underline-offset-4">
                                {item.name}
                            </Link>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{item.category?.name || "Streetwear"}</p>
                    </div>
                    <p className="text-sm font-bold whitespace-nowrap">Rp {item.price.toLocaleString("id-ID")}</p>
                </div>

                {/* 3. AVAILABLE SIZES */}
                <div className="flex flex-wrap gap-1 pt-1">
                    {variants.map((variant) => {
                        const isAvailable = variant.stock > 0;
                        return (
                            <span 
                                key={variant.id}
                                className={`
                                    text-[10px] px-2 py-1 border rounded-sm font-medium transition-colors
                                    ${isAvailable 
                                        ? 'border-zinc-700 text-foreground cursor-default' 
                                        : 'border-border text-muted-foreground/50 line-through bg-muted/30 cursor-not-allowed'}
                                `}
                            >
                                {variant.size}
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}