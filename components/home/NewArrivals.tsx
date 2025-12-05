"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Interface Data Lengkap
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

export default function NewArrivals() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Ambil produk terbaru
        const res = await api.get("/products?limit=8");
        
        // FIX: Kasih '?' (optional chaining) dan '|| []' biar gak crash kalau struktur API beda dikit
        const productData = res.data?.data || [];
        setProducts(productData);
      } catch (error) {
        console.error("Gagal load new arrivals, cek API lu G!", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Logic Scroll Kanan/Kiri Tombol Besar
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 320; // Sesuaikan dengan lebar kartu + gap
      if (direction === "left") {
        current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  return (
    <section className="py-20 border-b border-border bg-background">
      <div className="container mx-auto px-4">
        
        {/* HEADER SECTION */}
        <div className="flex justify-between items-end mb-8">
            <div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-2">
                    New Arrivals
                </h2>
                <p className="text-muted-foreground">Fresh drops straight from the lab.</p>
            </div>
            
            {/* Tombol Navigasi Desktop */}
            <div className="hidden md:flex gap-2">
                <Button variant="outline" size="icon" onClick={() => scroll("left")} className="rounded-full border-zinc-700 hover:bg-zinc-800 hover:text-white">
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => scroll("right")} className="rounded-full border-zinc-700 hover:bg-zinc-800 hover:text-white">
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>
        </div>

        {/* CONTENT CAROUSEL */}
        <div className="relative">
            {loading ? (
                <div className="flex gap-6 overflow-hidden">
                    {[...Array(4)].map((_, i) => (
                        // Skeleton ngikutin ukuran fixed card biar gak jomplang
                        <div key={i} className="w-[280px] md:w-[350px] flex-none space-y-4">
                            <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-1/3" />
                        </div>
                    ))}
                </div>
            ) : (
                // Scroll Container Utama
                <div 
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide"
                    style={{ scrollBehavior: "smooth" }}
                >
                    {/* FIX: Pastikan products itu array sebelum di-map */}
                    {Array.isArray(products) && products.length > 0 ? (
                        products.map((item) => (
                            <ArrivalCard key={item.id} item={item} />
                        ))
                    ) : (
                        <div className="w-full text-center py-10 text-muted-foreground">
                            Belum ada barang baru nih, G.
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* BOTTOM ACTION */}
        <div className="mt-8 text-center">
             <Button asChild variant="default" size="lg" className="px-10 h-12 font-bold tracking-widest text-xs md:text-sm">
                <Link href="/shop?sort=new">
                    VIEW ALL ARRIVALS
                </Link>
             </Button>
        </div>

      </div>
    </section>
  );
}

// 🧱 SUB-COMPONENT: KARTU PRODUK SPESIAL
function ArrivalCard({ item }: { item: Product }) {
    // FIX: Definisikan fallback biar gak error pas akses length/map dari undefined
    const images = item.images || [];
    const variants = item.variants || [];

    return (
        // 👇 FIX: Pake 'w-[...px]' fix dan 'flex-none' biar gak melar/gepeng
        <div className="w-[280px] md:w-[350px] flex-none snap-start group relative">
            
            {/* 1. IMAGE CAROUSEL (Scrollable Images) */}
            <div className="relative aspect-[3/4] bg-muted overflow-hidden rounded-md mb-4 border border-border">
                {/* Badge New */}
                <div className="absolute top-3 left-3 z-20">
                    <Badge className="bg-white text-black hover:bg-white font-bold rounded-none text-[10px]">NEW</Badge>
                </div>

                {/* Container Gambar Horizontal Scroll */}
                <div className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                    {images.length > 0 ? images.map((img, idx) => (
                        <Link key={idx} href={`/products/${item.slug}`} className="min-w-full h-full snap-center relative block">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src={img.image_url} 
                                alt={`${item.name} - ${idx}`}
                                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                            />
                        </Link>
                    )) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700 font-bold text-2xl">
                            HURTS
                        </div>
                    )}
                </div>

                {/* Indikator kalau gambar lebih dari 1 */}
                {images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                        {images.map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/50 shadow-sm backdrop-blur-sm" />
                        ))}
                    </div>
                )}
            </div>

            {/* 2. INFO & SIZES */}
            <div className="space-y-2 px-1">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0"> {/* min-w-0 biar truncate jalan */}
                        <h3 className="font-bold uppercase text-sm tracking-wide leading-tight truncate">
                            <Link href={`/products/${item.slug}`} className="hover:underline underline-offset-4">
                                {item.name}
                            </Link>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{item.category?.name || "Streetwear"}</p>
                    </div>
                    <p className="text-sm font-bold whitespace-nowrap">Rp {item.price.toLocaleString("id-ID")}</p>
                </div>

                {/* 3. AVAILABLE SIZES */}
                <div className="flex flex-wrap gap-1 pt-1">
                    {variants.length > 0 ? variants.map((variant) => {
                        const isAvailable = variant.stock > 0;
                        return (
                            <span 
                                key={variant.id}
                                className={`
                                    text-[10px] px-2 py-1 border rounded-sm font-medium transition-colors
                                    ${isAvailable 
                                        ? 'border-zinc-700 text-foreground hover:bg-foreground hover:text-background cursor-default' 
                                        : 'border-border text-muted-foreground/50 line-through bg-muted/30 cursor-not-allowed'}
                                `}
                            >
                                {variant.size}
                            </span>
                        );
                    }) : (
                        <span className="text-[10px] text-muted-foreground italic">No size info</span>
                    )}
                </div>
            </div>
        </div>
    );
}