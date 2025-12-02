"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import api from "@/lib/axios";
import { useCart } from "@/lib/useCart"; // Import Store tadi
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Heart, Share2 } from "lucide-react";
import { toast } from "sonner"; // Nanti kita install notifnya

// Tipe Data Lengkap
interface Variant {
  id: number;
  size: string;
  stock: number;
}

interface ProductDetail {
  id: number;
  name: string;
  description: string;
  price: number;
  weight: number;
  images: { image_url: string }[];
  variants: Variant[];
  is_collab: boolean;
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug;
  const cart = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<Variant | null>(null);
  const [mainImage, setMainImage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/products/${slug}`);
        setProduct(res.data.data);
        // Set gambar pertama jadi default
        if (res.data.data.images.length > 0) {
          setMainImage(res.data.data.images[0].image_url);
        }
      } catch (error) {
        console.error("Gagal load detail:", error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchData();
  }, [slug]);

  // Logic Add to Cart
  const handleAddToCart = () => {
    if (!product || !selectedSize) return;

    cart.addItem({
      id: `${product.id}-${selectedSize.id}`, // ID unik kombinasi
      productId: product.id,
      variantId: selectedSize.id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.image_url,
      size: selectedSize.size,
      maxStock: selectedSize.stock,
      weight: product.weight,
      quantity: 1
    });

    toast.success("Added to Cart!", {
        description: `${product.name} (Size: ${selectedSize.size})`,
        action: {
            label: "View Cart",
            onClick: () => window.location.href = "/cart" // Nanti kita arahin ke halaman cart
        },
    });
  };

  if (loading) return <div className="p-20 text-center">Loading Detail...</div>;
  if (!product) return <div className="p-20 text-center">Produk Gaib (404)</div>;

  return (
    <main className="min-h-screen bg-background text-foreground pt-10 pb-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* KIRI: GALERI FOTO */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden border border-border">
              <img src={mainImage} alt={product.name} className="object-cover w-full h-full" />
              {product.is_collab && (
                 <Badge className="absolute top-4 left-4 bg-red-600 text-white border-none rounded-none text-xs px-3 py-1">
                    LIMITED COLLAB
                 </Badge>
              )}
            </div>
            {/* Thumbnail Images */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setMainImage(img.image_url)}
                  className={`relative w-20 h-20 flex-shrink-0 border-2 rounded-md overflow-hidden ${mainImage === img.image_url ? 'border-foreground' : 'border-transparent'}`}
                >
                  <img src={img.image_url} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          </div>

          {/* KANAN: INFO PRODUK */}
          <div className="flex flex-col h-full">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-2 leading-none">
              {product.name}
            </h1>
            <p className="text-2xl font-medium text-muted-foreground mb-6">
              Rp {product.price.toLocaleString("id-ID")}
            </p>

            <div className="prose prose-invert text-muted-foreground text-sm mb-8 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>

            {/* PILIH SIZE */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="font-bold text-sm">SELECT SIZE</span>
                {selectedSize && (
                   <span className={`text-sm ${selectedSize.stock < 5 ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
                      {selectedSize.stock < 5 ? `Hurry! Only ${selectedSize.stock} left` : 'In Stock'}
                   </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((variant) => {
                  const isAvailable = variant.stock > 0;
                  return (
                    <button
                      key={variant.id}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSize(variant)}
                      className={`
                        w-14 h-14 flex items-center justify-center border font-bold text-sm transition-all
                        ${selectedSize?.id === variant.id 
                            ? 'bg-foreground text-background border-foreground' 
                            : 'bg-transparent text-foreground border-border hover:border-foreground'}
                        ${!isAvailable && 'opacity-30 cursor-not-allowed line-through'}
                      `}
                    >
                      {variant.size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-4 mt-auto">
               <Button 
                 size="lg" 
                 className="flex-1 h-14 text-lg font-bold rounded-none"
                 disabled={!selectedSize}
                 onClick={handleAddToCart}
               >
                 <ShoppingCart className="mr-2 w-5 h-5" />
                 {selectedSize ? "ADD TO CART" : "SELECT A SIZE"}
               </Button>
               
               <Button size="icon" variant="outline" className="h-14 w-14 border-border rounded-none">
                 <Heart className="w-5 h-5" />
               </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-6 text-center">
              Free shipping available for orders above Rp 500.000
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}