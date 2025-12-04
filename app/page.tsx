"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import Hero from "@/components/shared/Hero";
import ProductCard, { Product } from "@/components/shared/ProductCard";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");
        // Ambil 4 produk teratas buat Latest Drop
        setProducts(res.data.data.data.slice(0, 4)); 
      } catch (error) {
        console.error("Gagal load produk:", error);
      }
    };
    fetchProducts();
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      
      {/* 1. HERO SECTION */}
      <Hero />

      {/* 2. NEW ARRIVALS SECTION */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl font-bold tracking-tighter">LATEST DROP</h2>
            <a href="/shop" className="text-muted-foreground hover:text-foreground transition text-sm underline underline-offset-4">
                View All
            </a>
        </div>

        {/* Grid Produk */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((item) => (
             // Sekarang aman karena 'item' udah punya slug
             <ProductCard key={item.id} item={item} />
          ))}
        </div>
      </section>

    </main>
  );
}