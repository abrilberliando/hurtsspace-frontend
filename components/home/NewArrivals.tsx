"use client";

import { useEffect, useState, useRef, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

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
  price: number | string;
  is_new_arrival: boolean | number | string;
  is_featured?: boolean | number | string;
  created_at?: string;
  images: { image_url: string }[];
  variants: Variant[];
  category?: { name: string };
}

// --- MAIN COMPONENT ---
export default function Featured() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Refs & State for Drag Scroll
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch Data
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Optimization: If backend supports filtering, it's better to filter in query params
        // Contoh: /products?limit=15&featured=true
        const res = await api.get("/products?limit=50");
        const fetchedData = res.data?.data || [];

        let dataFix: Product[] = [];
        if (Array.isArray(res.data)) dataFix = res.data;
        else if (Array.isArray(res.data?.data)) dataFix = res.data.data;
        else if (Array.isArray(fetchedData)) dataFix = fetchedData;

        // Filter only "Featured"
        const featuredDrops = dataFix.filter((p) => {
          const val = p.is_featured;
          return val === 1 || val === "1" || val === true || val === "true";
        });

        setProducts(featuredDrops.slice(0, 15));
      } catch (error) {
        console.error("Failed to load featured products", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Arrow Button Logic (Memoized)
  const scrollButton = useCallback((direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 350;
      current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  }, []);

  // --- LOGIC DRAG TO SCROLL (Optimized handlers) ---
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDown(true);
    setIsDragging(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDown(false);
    setIsDragging(false);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDown(false);
    // Small timeout so child click event doesn't trigger immediately after drag
    setTimeout(() => setIsDragging(false), 50);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;

    if (Math.abs(walk) > 5) {
      setIsDragging(true);
    }
  }, [isDown, scrollLeft, startX]);

  return (
    <section className="py-10 border-b border-border bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-end mb-5">
          <div>
            <h2 className="text-2xl md:text-2xl font-black tracking-tighter uppercase mb-2">
              Featured
            </h2>
          </div>

          {/* Nav Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollButton("left")}
              className="rounded-full border-zinc-700 hover:bg-zinc-800 hover:text-white w-12 h-12"
              aria-label="Scroll Left"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollButton("right")}
              className="rounded-full border-zinc-700 hover:bg-zinc-800 hover:text-white w-12 h-12"
              aria-label="Scroll Right"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* CONTENT CAROUSEL */}
        <div className="relative">
          {loading ? (
            <div className="flex gap-4 md:gap-6 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-[220px] md:w-[350px] flex-none space-y-4"
                >
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
                flex gap-4 md:gap-6 overflow-x-auto pb-8 
                /* Hide Scrollbar */
                [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
                /* Cursor Style */
                ${isDown ? "cursor-grabbing" : "cursor-grab"}
              `}
              style={{ scrollBehavior: isDown ? "auto" : "smooth" }}
            >
              {Array.isArray(products) && products.length > 0 ? (
                products.map((item) => (
                  // Memoized Component called here
                  <ArrivalCardMemo
                    key={item.id}
                    item={item}
                    isDraggingParent={isDragging}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-zinc-700 w-full">
                  No featured items yet, G.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// --- SUB-COMPONENT: CARD (OPTIMIZED) ---
// Extract displayPrice logic so it's not recreated every render
const displayPrice = (val: string | number): number => {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return 0;
  return Math.floor(num);
};

function ArrivalCard({
  item,
  isDraggingParent,
}: {
  item: Product;
  isDraggingParent: boolean;
}) {
  const images = item.images || [];
  const variants = item.variants || [];

  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  // Ref to store bounding box size, to prevent recalculating
  const boundsRef = useRef<DOMRect | null>(null);

  // Logic New Arrival (Memoized)
  const isNewCalculated = useMemo(() => {
    const val = item.is_new_arrival;
    if (val === 1 || val === "1" || val === true || val === "true") return true;
    if (val === 0 || val === "0" || val === false || val === "false")
      return false;

    if (item.created_at) {
      const createdDate = new Date(item.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }
    return false;
  }, [item.is_new_arrival, item.created_at]);

  // Optimization: Calculate size ONLY on mouse enter
  const handleMouseEnter = () => {
    if (containerRef.current) {
      boundsRef.current = containerRef.current.getBoundingClientRect();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingParent || images.length <= 1 || !boundsRef.current) return;

    // Use value from ref, not getBoundingClientRect() directly (Reflow Saver!)
    const { left, width } = boundsRef.current;
    
    // Fallback safety if width is 0 (rare but safe)
    if (width === 0) return;

    const x = e.clientX - left;
    const percentage = x / width;
    const index = Math.floor(percentage * images.length);
    const safeIndex = Math.min(Math.max(index, 0), images.length - 1);
    
    // State update only if index changes (React batching handles this usually, but good logic)
    setActiveIndex((prev) => (prev !== safeIndex ? safeIndex : prev));
  };

  const handleMouseLeave = () => {
    setActiveIndex(0);
    boundsRef.current = null; // Cleanup ref
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    // Prevent navigation if user is just dragging the card
    if (isDraggingParent) e.preventDefault();
  };

  return (
    <div className="w-[150px] md:w-[280px] flex-none snap-start group relative select-none will-change-transform">
      {/* 1. IMAGE CONTAINER */}
      <div
        ref={containerRef}
        className="relative aspect-3/4 bg-white overflow-hidden rounded-md mb-3 md:mb-4 border border-border cursor-pointer transform-gpu"
        onMouseEnter={handleMouseEnter} // Trigger kalkulasi dimensi
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Badge New */}
        {isNewCalculated && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider z-20">
            New
          </div>
        )}

        <Link
          href={`/products/${item.slug}`}
          onClick={handleLinkClick}
          draggable={false}
          className="block w-full h-full relative"
        >
          {images.length > 0 ? (
            images.map((img, idx) => (
              <Image
                key={idx}
                src={img.image_url}
                alt={`${item.name} - ${idx}`}
                fill
                // Optimization: accurate sizes help browser download the right image
                sizes="(max-width: 768px) 220px, 280px"
                className={`
                  object-contain object-center 
                  transition-opacity duration-300 ease-in-out
                  ${
                    idx === activeIndex
                      ? "opacity-100 z-10"
                      : "opacity-0 z-0"
                  }
                `}
                draggable={false}
                // First image priority false (lazy), others also lazy
                // We rely on browser cache after first load
                loading="lazy"
                quality={60} // Slightly increase quality to keep it sharp but lightweight
              />
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700 font-bold text-2xl">
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

      {/* 2. INFO & SIZES */}
      <div className="space-y-1 px-1">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 md:gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold uppercase text-xs md:text-sm tracking-wide leading-tight truncate">
              <Link
                href={`/products/${item.slug}`}
                onClick={handleLinkClick}
                className="hover:underline underline-offset-4"
              >
                {item.name}
              </Link>
            </h3>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 truncate">
              {item.category?.name || "Streetwear"}
            </p>
          </div>
          <p className="text-xs md:text-sm font-bold whitespace-nowrap">
            Rp {displayPrice(item.price).toLocaleString("id-ID")}
          </p>
        </div>

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

const ArrivalCardMemo = memo(ArrivalCard);