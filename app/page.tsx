"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import Hero from "@/components/shared/Hero"; // Import Hero

interface Product {
  id: number;
  name: string;
  price: number;
  images: { image_url: string }[];
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    // Ambil data produk (Limit 4 aja buat preview di home)
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");
        setProducts(res.data.data.data.slice(0, 4)); 
      } catch (error) {
        console.error(error);
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
            <a href="/shop" className="text-zinc-500 hover:text-white transition text-sm underline underline-offset-4">View All</a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {products.map((item) => (
            <div key={item.id} className="group cursor-pointer">
              <div className="relative aspect-[3/4] bg-zinc-900 overflow-hidden mb-4">
                <img 
                  src={item.images[0]?.image_url} 
                  alt={item.name} 
                  className="object-cover w-full h-full group-hover:scale-105 transition duration-500"
                />
                {/* Badge New */}
                <div className="absolute top-2 left-2 bg-white text-black text-[10px] font-bold px-2 py-1">NEW</div>
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wide">{item.name}</h3>
              <p className="text-zinc-400 text-sm mt-1">Rp {item.price.toLocaleString("id-ID")}</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}