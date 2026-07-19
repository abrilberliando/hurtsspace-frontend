"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/lib/useAuth";
import { notFound } from "next/navigation"; // 👈 Just notFound, REMOVE useRouter
import { Skeleton } from "@/components/ui/skeleton";
import { HeartOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShopCard } from "@/components/ShopCard";

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
  // const router = useRouter(); 👈 THIS IS THE CULPRIT, JUST REMOVE IT!
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔥 STEALTH MODE: 404 if not logged in
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
        console.error("Failed to load wishlist", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchWishlist();
    
    // Safety check if user is null
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
                  <ShopCard key={item.id} item={item as any} />
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-700 rounded-xl bg-muted/10">
            <HeartOff className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-xl font-bold mb-2">Wishlist Empty</h2>
            <p className="text-muted-foreground mb-6">No items on your wishlist yet.</p>
            <Button asChild variant="outline">
                <Link href="/shopall">FIND ITEMS</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
