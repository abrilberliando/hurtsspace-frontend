"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/axios";
import { useCart } from "@/lib/useCart";
import { useAuth } from "@/lib/useAuth"; // Buat cek login wishlist
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart } from "lucide-react";
import { toast } from "sonner";
import { useCartAnimation } from "@/lib/cartAnimationContext"; // Animasi Terbang

// --- Tipe Data ---
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
  
  // Hooks
  const cart = useCart();
  const { user } = useAuth();
  const { triggerFlyAnimation } = useCartAnimation();

  // State
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<Variant | null>(null);
  const [mainImage, setMainImage] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false); // Status Love

  // 1. Fetch Data Produk & Cek Wishlist
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/products/${slug}`);
        const productData = res.data.data;
        setProduct(productData);
        
        // Set gambar default
        if (productData.images.length > 0) {
          setMainImage(productData.images[0].image_url);
        }

        // Kalau User Login, cek status Wishlist
        if (user) {
            api.get(`/wishlist/check/${productData.id}`)
               .then(resWish => setIsWishlisted(resWish.data.is_wishlisted))
               .catch(() => {}); // Ignore error check
        }

      } catch (error) {
        console.error("Gagal load detail:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug, user]);

  // 2. Logic Add to Cart + Animation
  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!product || !selectedSize) return toast.error("Pilih size dulu, G!");

    // Masukin ke Store
    cart.addItem({
      id: `${product.id}-${selectedSize.id}`,
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

    // Trigger Animasi Terbang 🛸
    const imgUrl = product.images[0]?.image_url || "";
    triggerFlyAnimation(e.currentTarget, imgUrl);

    // Notif
    toast.success("Added to Cart!", {
        description: `${product.name} (Size: ${selectedSize.size})`,
        action: {
            label: "View Cart",
            onClick: () => window.location.href = "/cart"
        },
    });
  };

  // 3. Logic Wishlist Toggle
  const handleToggleWishlist = async () => {
    if (!user) return toast.error("Login dulu bos buat simpen wishlist!");
    if (!product) return;

    // Optimistic Update (Ubah UI duluan biar sat-set)
    const newState = !isWishlisted;
    setIsWishlisted(newState);

    try {
        const res = await api.post("/wishlist/toggle", { product_id: product.id });
        toast.success(res.data.message);
    } catch {
        setIsWishlisted(!newState); // Balikin kalau gagal (Rollback)
        toast.error("Gagal update wishlist");
    }
  };

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center animate-pulse">Loading Detail...</div>;
  if (!product) return <div className="min-h-screen pt-20 flex items-center justify-center">Produk Gaib (404)</div>;

  return (
    <main className="min-h-screen bg-background text-foreground pt-10 pb-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* KIRI: GALERI FOTO */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mainImage} alt={product.name} className="object-cover w-full h-full transition-all duration-500" />
              {product.is_collab && (
                 <Badge className="absolute top-4 left-4 bg-red-600 text-white border-none rounded-none text-xs px-3 py-1">
                    LIMITED COLLAB
                 </Badge>
              )}
            </div>
            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {product.images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setMainImage(img.image_url)}
                  className={`relative w-20 h-20 shrink-0 border-2 rounded-md overflow-hidden transition-all ${mainImage === img.image_url ? 'border-foreground opacity-100' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image_url} className="object-cover w-full h-full" alt="thumb" />
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

            <div className="prose prose-invert text-muted-foreground text-sm mb-8 leading-relaxed whitespace-pre-line border-l-2 border-border pl-4">
              {product.description}
            </div>

            {/* PILIH SIZE */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="font-bold text-sm tracking-wide">SELECT SIZE</span>
                {selectedSize && (
                   <span className={`text-sm font-medium ${selectedSize.stock < 5 ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
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
                        w-14 h-14 flex items-center justify-center border font-bold text-sm transition-all duration-200
                        ${selectedSize?.id === variant.id 
                            ? 'bg-foreground text-background border-foreground scale-105 shadow-lg' 
                            : 'bg-transparent text-foreground border-border hover:border-foreground'}
                        ${!isAvailable && 'opacity-30 cursor-not-allowed line-through bg-muted'}
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
               {/* Tombol Add To Cart */}
               <Button 
                 size="lg" 
                 className="flex-1 h-14 text-lg font-bold rounded-none transition-transform active:scale-95"
                 disabled={!selectedSize}
                 onClick={handleAddToCart}
               >
                 <ShoppingCart className="mr-2 w-5 h-5" />
                 {selectedSize ? "ADD TO CART" : "SELECT A SIZE"}
               </Button>
               
               {/* Tombol Wishlist */}
               <Button 
                 size="icon" 
                 variant="outline" 
                 className={`h-14 w-14 border-border rounded-none transition-colors ${isWishlisted ? 'bg-red-500/10 border-red-500 text-red-500 hover:text-red-600' : 'hover:text-red-500'}`}
                 onClick={handleToggleWishlist}
               >
                 <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
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