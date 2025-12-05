"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import ProductCard, { Product } from "@/components/shared/ProductCard";
import SectionHeader from "@/components/shared/SectionHeader";
import ProductGrid from "@/components/shared/ProductGrid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeShop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Ambil 8 produk (limit bisa diatur)
        const res = await api.get("/products?limit=8");
        
        // FIX 1: Safe Navigation (?.) + Fallback Array (|| [])
        // Ini biar kalau API structure beda dikit atau null, dia tetep jadi array kosong
        const fetchedData = res.data?.data || [];
        
        setProducts(fetchedData);
      } catch (error) {
        console.error("Gagal load shop home", error);
        // Optional: setProducts([]) disini juga boleh buat jaga-jaga
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <section className="container mx-auto px-4 py-20">
      <SectionHeader title="Shop Collection" href="/shop" />

      {loading ? (
        <ProductGrid>
            {/* Skeleton Loader */}
            {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-3">
                     <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                     <Skeleton className="h-4 w-2/3" />
                     <Skeleton className="h-4 w-1/3" />
                </div>
            ))}
        </ProductGrid>
      ) : (
        <>
            {/* FIX 2: Cek dulu apakah products itu array dan ada isinya */}
            {Array.isArray(products) && products.length > 0 ? (
                <ProductGrid>
                    {products.map((item) => (
                        <ProductCard key={item.id} item={item} />
                    ))}
                </ProductGrid>
            ) : (
                // Fallback kalau produk kosong
                <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-zinc-700">
                    <p>No products available at the moment, G.</p>
                </div>
            )}
            
            <div className="mt-12 text-center">
                <Button asChild variant="outline" size="lg" className="px-10 h-12 border-foreground text-foreground font-bold hover:bg-foreground hover:text-background transition-colors">
                    <Link href="/shop">VIEW ALL PRODUCTS</Link>
                </Button>
            </div>
        </>
      )}
    </section>
  );
}