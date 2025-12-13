"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/lib/useAuth";
import { notFound } from "next/navigation"; // 👈 Cukup notFound, useRouter HAPUS AJA
import { Skeleton } from "@/components/ui/skeleton";
import { HeartOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// --- INTERFACES ---
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
  images: { image_url: string }[];
  variants: Variant[];
  category?: { name: string };
}

interface RawWishlistItem {
  id: number;
  product?: Product;
  name?: string;
  slug?: string;
  price?: number | string;
  images?: { image_url: string }[];
  variants?: Variant[];
}

export default function WishlistPage() {
  const { user } = useAuth();
  // const router = useRouter(); 👈 INI BIANG KEROKNYA, HAPUS AJA G!
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔥 STEALTH MODE: 404 kalau ga login
    if (!loading && !user) {
        notFound(); 
        return;
    }

    const fetchWishlist = async () => {
      try {
        const res = await api.get("/wishlist");
        
        const rawData: RawWishlistItem[] = res.data.data || [];

        const mappedProducts = rawData.map((item) => {
            if (item.product) {
                return {
                    ...item.product,
                    variants: item.product.variants || [] 
                };
            }
            return {
                id: item.id,
                name: item.name || "Unknown Product",
                slug: item.slug || "",
                price: item.price || 0,
                images: item.images || [],
                variants: item.variants || [],
            } as Product;
        });

        setProducts(mappedProducts);
      } catch (error) {
        console.error("Gagal load wishlist", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchWishlist();
    
    // Safety check kalau user null
    if (!user) {
        const timer = setTimeout(() => setLoading(false), 1000); 
        return () => clearTimeout(timer);
    }
    
  }, [user, loading]); // 👈 Array dependency sekarang stabil cuma 2 biji

  // Prevent Flash Content
  if (!loading && !user) return null;

  return (
    <main className="min-h-screen bg-background text-foreground pt-10 pb-20">
      <div className="container mx-auto px-4">
        
        {/* HEADER */}
        <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter">My Wishlist</h1>
            </div>
        </div>

        {loading ? (
           <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8 justify-items-center">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-full max-w-[350px] space-y-3">
                  <Skeleton className="aspect-[3/4] w-full rounded-lg bg-muted" />
                  <Skeleton className="h-4 w-2/3 bg-muted" />
                  <Skeleton className="h-4 w-1/3 bg-muted" />
                </div>
              ))}
           </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 gap-y-8 md:gap-8 md:gap-y-12 justify-items-center">
            {products.map((item) => (
              <WishlistCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-700 rounded-xl bg-muted/10">
            <HeartOff className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-xl font-bold mb-2">Wishlist Kosong</h2>
            <p className="text-muted-foreground mb-6">Belum ada barang inceran nih, G.</p>
            <Button asChild variant="outline">
                <Link href="/shop">CARI BARANG</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

// --- CARD COMPONENT (Gak ada perubahan, aman) ---
function WishlistCard({ item }: { item: Product }) {
  const images = item.images || [];
  const variants = item.variants || []; 

  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayPrice = (val: string | number): number => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 0;
    return Math.floor(num); 
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || images.length <= 1) return;
    const { left, width } = containerRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const percentage = x / width;
    const index = Math.floor(percentage * images.length);
    setActiveIndex(Math.min(Math.max(index, 0), images.length - 1));
  };

  const handleMouseLeave = () => {
    setActiveIndex(0);
  };

  return (
    <div className="w-full max-w-[350px] group relative select-none">
      <div
        ref={containerRef}
        className="relative aspect-[3/4] bg-muted overflow-hidden rounded-md mb-3 md:mb-4 cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <Link
          href={`/products/${item.slug}`}
          className="block w-full h-full relative"
        >
          {images.length > 0 ? (
            images.map((img, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={idx}
                src={img.image_url}
                alt={`${item.name} - ${idx}`}
                className={`
                    absolute inset-0 w-full h-full object-cover object-center 
                    transition-opacity duration-300 ease-in-out
                    ${idx === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"}
                `}
                draggable={false}
              />
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700 font-bold text-lg md:text-2xl">
              HURTS
            </div>
          )}
        </Link>

        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 hidden md:flex gap-1.5 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
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