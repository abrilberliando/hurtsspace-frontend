"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import ProductCard, { Product } from "@/components/shared/ProductCard";
import SectionHeader from "@/components/shared/SectionHeader";
import ProductGrid from "@/components/shared/ProductGrid";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewArrivals() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");
        // Ambil 4 produk teratas
        setProducts(res.data.data.data.slice(0, 4));
      } catch (error) {
        console.error("Gagal load new arrivals:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <section className="container mx-auto px-4 py-20">
      {/* 1. Header */}
      <SectionHeader title="Latest Drop" href="/shop?sort=new" />

      {/* 2. Content */}
      {loading ? (
        // Skeleton Loading khusus Grid
        <ProductGrid>
            {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                    <Skeleton className="aspect-3/4 w-full bg-muted" />
                    <Skeleton className="h-4 w-2/3 bg-muted" />
                    <Skeleton className="h-4 w-1/3 bg-muted" />
                </div>
            ))}
        </ProductGrid>
      ) : (
        // Grid Produk Asli
        <ProductGrid>
          {products.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </ProductGrid>
      )}
    </section>
  );
}