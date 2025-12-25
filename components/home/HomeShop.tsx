"use client";

import { useEffect, useState, useRef, memo, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

interface Variant {
  id: number;
  size: string;
  stock: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number | string;
  is_new_arrival: boolean;
  images: { image_url: string }[];
  variants: Variant[];
  category?: { name: string };
}

// --- HELPER FUNCTION (Diluar component biar hemat memori) ---
const displayPrice = (val: string | number): number => {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return 0;
  return Math.floor(num);
};

export default function HomeShop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Optimization: Pastikan limit di API endpoint kerja
        const res = await api.get("/products?limit=8");
        const fetchedData = res.data?.data || [];

        // Safety check array
        const limitedData = Array.isArray(fetchedData)
          ? fetchedData.slice(0, 8)
          : [];
        setProducts(limitedData);
      } catch (error) {
        console.error("Gagal load shop home", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <section className="container mx-auto px-4 py-10">
      <div className="flex justify-between items-end mb-5">
        <h2 className="text-2xl md:text-2xl font-black tracking-tighter uppercase">
          Shop Collection
        </h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 justify-items-center">
          {/* Array.from lebih efisien drpd spread syntax buat array kosong */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-full max-w-[350px] space-y-3">
              <Skeleton className="aspect-[3/4] w-full rounded-lg bg-muted" />
              <Skeleton className="h-4 w-2/3 bg-muted" />
              <Skeleton className="h-4 w-1/3 bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 gap-y-8 md:gap-8 md:gap-y-12 justify-items-center">
            {products.length > 0 ? (
              products.map((item) => <ShopCardMemo key={item.id} item={item} />)
            ) : (
              <div className="col-span-full text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-zinc-700 w-full">
                <p>No products available at the moment, G.</p>
              </div>
            )}
          </div>

          <div className="mt-7 md:mt-7 text-center">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="px-12 h-14 border-foreground text-foreground font-bold transition-all tracking-widest text-sm rounded-none w-full md:w-auto hover:bg-foreground hover:text-background"
            >
              <Link href="/shop">VIEW ALL PRODUCTS</Link>
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

// --- SUB-COMPONENT: SHOP CARD ---
function ShopCard({ item }: { item: Product }) {
  const images = item.images || [];
  const variants = item.variants || [];

  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Optimization: Ref buat nyimpen ukuran bounding box
  const boundsRef = useRef<DOMRect | null>(null);

  // 1. Hitung ukuran CUMA pas mouse masuk (Hemat CPU!)
  const handleMouseEnter = useCallback(() => {
    if (containerRef.current) {
      boundsRef.current = containerRef.current.getBoundingClientRect();
    }
  }, []);

  // 2. Logic hover ringan tanpa getBoundingClientRect()
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (images.length <= 1 || !boundsRef.current) return;

    // Ambil data dari Ref
    const { left, width } = boundsRef.current;
    if (width === 0) return;

    const x = e.clientX - left;
    const percentage = x / width;
    const index = Math.floor(percentage * images.length);
    const safeIndex = Math.min(Math.max(index, 0), images.length - 1);

    // State update
    setActiveIndex((prev) => (prev !== safeIndex ? safeIndex : prev));
  }, [images.length]);

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(0);
    boundsRef.current = null; // Cleanup
  }, []);

  return (
    <div className="w-full max-w-[350px] group relative select-none will-change-transform">
      {/* IMAGE CONTAINER */}
      <div
        ref={containerRef}
        className="relative aspect-[3/4] bg-white overflow-hidden rounded-md mb-3 md:mb-4 cursor-pointer transform-gpu"
        onMouseEnter={handleMouseEnter} // Trigger kalkulasi disini
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <Link
          href={`/products/${item.slug}`}
          className="block w-full h-full relative"
        >
          {images.length > 0 ? (
            images.map((img, idx) => (
              <Image
                key={idx}
                src={img.image_url}
                alt={`${item.name} - ${idx}`}
                fill
                // Optimization: Sizes yang pas buat grid 2-4 kolom
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={`
                  absolute inset-0 w-full h-full object-contain object-center
                  transition-opacity duration-300 ease-in-out
                  ${
                    idx === activeIndex
                      ? "opacity-100 z-10"
                      : "opacity-0 z-0"
                  }
                `}
                draggable={false}
                // Lazy load semua image di grid bawah, kecuali bener2 perlu priority
                loading="lazy" 
                quality={50}
              />
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700 font-bold text-lg md:text-2xl">
              HURTS
            </div>
          )}
        </Link>

        {/* Dots Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full shadow-sm backdrop-blur-sm transition-all duration-300 ${
                  i === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* INFO & SIZES */}
      <div className="space-y-1 px-1">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 md:gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold uppercase text-xs md:text-sm tracking-wide leading-tight truncate">
              <Link
                href={`/products/${item.slug}`}
                className="hover:underline underline-offset-4"
              >
                {item.name}
              </Link>
            </h3>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 truncate">
              {item.category?.name || "Streetwear"}
            </p>
          </div>
          {/* Pake helper displayPrice yg global */}
          <p className="text-xs md:text-sm font-bold whitespace-nowrap">
            Rp {displayPrice(item.price).toLocaleString("id-ID")}
          </p>
        </div>

        {/* AVAILABLE SIZES */}
        <div className="flex flex-wrap gap-1 pt-1">
          {variants.length > 0 ? (
            variants.map((variant) => {
              const isAvailable = variant.stock > 0;
              return (
                <span
                  key={variant.id}
                  className={`
                    text-[9px] md:text-[10px] px-1.5 py-0.5 border rounded-sm font-medium transition-colors
                    ${
                      isAvailable
                        ? "border-zinc-700 text-foreground cursor-default"
                        : "border-border text-muted-foreground/50 line-through bg-muted/30 cursor-not-allowed"
                    }
                  `}
                >
                  {variant.size}
                </span>
              );
            })
          ) : (
            <span className="text-[9px] md:text-[10px] text-muted-foreground italic">
              No size info
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// 🔥 MEMOIZATION: Mencegah re-render yang tidak perlu
const ShopCardMemo = memo(ShopCard);