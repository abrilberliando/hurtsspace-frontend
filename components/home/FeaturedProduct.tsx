"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ImageOff } from "lucide-react"; // Nambah icon buat fallback image

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  description: string;
  images: { image_url: string }[];
}

export default function FeaturedProduct() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeature = async () => {
      try {
        // Ambil 1 produk terbaru
        const res = await api.get("/products?limit=1");
        
        // FIX: Pake optional chaining (?.) biar gak error kalau data kosong
        const productsData = res.data?.data;

        if (Array.isArray(productsData) && productsData.length > 0) {
           setProduct(productsData[0]);
        }
      } catch (error) {
        console.error("Gagal load featured product", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeature();
  }, []);

  // Loading State
  if (loading) {
      return (
        <div className="container mx-auto px-4 py-20">
            <Skeleton className="h-[400px] md:h-[600px] w-full rounded-2xl" />
        </div>
      );
  }

  // Kalau gak ada produk, return null aja biar sectionnya ngilang (clean)
  if (!product) return null;

  // SAFE IMAGE LOGIC:
  // Cek apakah images ada dan punya isi. Kalau gak, pake fallback.
  const hasImage = product.images && product.images.length > 0;
  const imageUrl = hasImage ? product.images[0].image_url : null;

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="bg-zinc-900 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl border border-zinc-800">
        
        {/* Kiri: Gambar Besar */}
        <div className="md:w-1/2 relative h-[400px] md:h-[600px] bg-zinc-800 flex items-center justify-center">
             {imageUrl ? (
                 // eslint-disable-next-line @next/next/no-img-element
                <img 
                    src={imageUrl} 
                    alt={product.name} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
             ) : (
                // Fallback kalau gambar error/kosong
                 <div className="flex flex-col items-center text-zinc-600">
                     <ImageOff className="w-16 h-16 mb-2" />
                     <span className="font-mono text-xs uppercase tracking-widest">No Image Available</span>
                 </div>
             )}
        </div>

        {/* Kanan: Info */}
        <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center items-start text-white bg-zinc-900">
            <span className="text-zinc-400 tracking-[0.2em] text-xs md:text-sm font-bold mb-4 border border-zinc-700 px-3 py-1 rounded-full">
                FEATURED DROP
            </span>
            
            <h2 className="text-3xl md:text-5xl font-black uppercase mb-6 leading-tight tracking-tight">
                {product.name}
            </h2>
            
            <p className="text-zinc-400 mb-8 line-clamp-3 max-w-md text-sm md:text-base leading-relaxed">
                {product.description || "No description available for this item."}
            </p>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full sm:w-auto">
                <p className="text-2xl font-bold font-mono text-white">
                    Rp {product.price.toLocaleString("id-ID")}
                </p>
                <Button asChild size="lg" className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 font-bold rounded-full px-8 h-12 tracking-wide">
                    <Link href={`/products/${product.slug}`}>
                        COP NOW <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                </Button>
            </div>
        </div>

      </div>
    </section>
  );
}