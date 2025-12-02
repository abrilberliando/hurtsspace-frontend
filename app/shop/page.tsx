"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/axios";
// 👇 IMPORT Product DARI SINI BIAR TIPE DATA LENGKAP & SAMA
import ProductCard, { Product } from "@/components/shared/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShopPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center">Loading Shop...</div>}>
            <ShopContent />
        </Suspense>
    );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("category_id");
  const searchQuery = searchParams.get("search");

  // State pake tipe data Product yang benar
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: null, name: "All" },
    { id: 1, name: "T-Shirts" },
    { id: 2, name: "Outerwear" },
    { id: 3, name: "Pants" },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const url = "/products";
        const params = new URLSearchParams();
        
        if (categoryId) params.append("category_id", categoryId);
        if (searchQuery) params.append("search", searchQuery);

        const res = await api.get(`${url}?${params.toString()}`);
        setProducts(res.data.data.data); 
      } catch (error) {
        console.error("Gagal ambil produk shop:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, searchQuery]);

  return (
    <main className="min-h-screen bg-background text-foreground pt-10 pb-20">
      <div className="container mx-auto px-4">
        
        {/* HEADER SHOP */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-border pb-6">
            <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 uppercase">
                    {searchQuery ? `Search: "${searchQuery}"` : "All Collection"}
                </h1>
                <p className="text-muted-foreground">
                    Menampilkan {products.length} artikel.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                    <Button 
                        key={cat.name}
                        asChild 
                        variant={categoryId == cat.id?.toString() || (!categoryId && !cat.id) ? "default" : "outline"}
                        size="sm"
                        className="rounded-full"
                    >
                        <a href={cat.id ? `/shop?category_id=${cat.id}` : "/shop"}>
                            {cat.name}
                        </a>
                    </Button>
                ))}
            </div>
        </div>

        {/* GRID PRODUK */}
        {loading ? (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-4">
                      <Skeleton className="h-[300px] w-full bg-muted" />
                      <Skeleton className="h-4 w-[200px] bg-muted" />
                      <Skeleton className="h-4 w-[100px] bg-muted" />
                  </div>
              ))}
           </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 gap-y-10">
            {products.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-border rounded-lg">
            <h2 className="text-2xl font-bold mb-2">Stok Kosong, G!</h2>
            <p className="text-muted-foreground">Belum ada barang di kategori ini.</p>
            <Button variant="link" asChild className="mt-4">
                <a href="/shop">Lihat Semua Barang</a>
            </Button>
          </div>
        )}

      </div>
    </main>
  );
}