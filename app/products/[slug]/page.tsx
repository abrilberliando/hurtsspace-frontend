"use client";

import { useEffect, useState, memo, useCallback } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/axios";
import { useCart } from "@/lib/useCart";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart } from "lucide-react";
import { toast } from "sonner";
import { useCartAnimation } from "@/lib/cartAnimationContext";
import Suggested from "@/components/shared/Suggested";
import Image from "next/image";

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
  price: number | string;
  weight: number;
  images: { image_url: string }[];
  variants: Variant[];
  is_collab: number | string;
}

// --- HELPER (Memory Saver) ---
const displayPrice = (val: string | number): number => {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return 0;
  return Math.floor(num);
};

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data Utama
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/products/${slug}`);
        setProduct(res.data.data);
      } catch (error) {
        console.error("Failed to load details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug]);

  if (loading)
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center animate-pulse text-muted-foreground tracking-widest uppercase text-sm">
        Loading Detail...
      </div>
    );

  if (!product)
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center text-muted-foreground tracking-widest uppercase text-sm">
        Product Not Found (404)
      </div>
    );

  return (
    <main className="min-h-screen bg-background text-foreground pt-10 pb-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* 🔥 FIX 1: Pake key={product.id} */}
          {/* This forces React to destroy the old component and create a new one every time the ID changes */}
          {/* Jadi state gambar & size otomatis ke-reset tanpa useEffect aneh-aneh */}
          
          {/* BAGIAN KIRI: GALERI */}
          <ProductGallery product={product} key={`gallery-${product.id}`} />

          {/* BAGIAN KANAN: INFO & ACTIONS */}
          <ProductInfo product={product} key={`info-${product.id}`} />
          
        </div>
      </div>
      <Suggested />
    </main>
  );
}

// --- SUB-COMPONENT 1: GALLERY (FIXED) ---
const ProductGallery = memo(function ProductGallery({
  product,
}: {
  product: ProductDetail;
}) {
  // 🔥 FIX 2: State Initialization Langsung
  // No need for useEffect to set initial image. Just do it here.
  // Because there is a key in the parent, this will always be fresh when changing products.
  const [mainImage, setMainImage] = useState(
    product.images.length > 0 ? product.images[0].image_url : ""
  );

  if (!mainImage) return null;

  return (
    <div className="space-y-4">
      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden border border-border">
        <Image
          src={mainImage}
          alt={product.name}
          className="object-cover w-full h-full transition-all duration-500"
          draggable={false}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority // LCP Optimization
          quality={80}
        />
        {product.is_collab == 1 && (
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
            className={`relative w-20 h-20 shrink-0 border-2 rounded-md overflow-hidden transition-all ${
              mainImage === img.image_url
                ? "border-foreground opacity-100"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            <Image
              src={img.image_url}
              className="object-cover w-full h-full"
              alt={`thumb-${idx}`}
              fill
              sizes="80px"
              draggable={false}
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </div>
  );
});

// --- SUB-COMPONENT 2: INFO & ACTIONS (OPTIMIZED) ---
const ProductInfo = memo(function ProductInfo({
  product,
}: {
  product: ProductDetail;
}) {
  const cart = useCart();
  const { user } = useAuth();
  const { triggerFlyAnimation } = useCartAnimation();

  // Size state automatically null when product changes (because of key in parent)
  const [selectedSize, setSelectedSize] = useState<Variant | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Cek Wishlist (Client Side only when user exists)
  useEffect(() => {
    if (user) {
      api
        .get(`/wishlist/check/${product.id}`)
        .then((res) => setIsWishlisted(res.data.is_wishlisted))
        .catch(() => {});
    }
  }, [user, product.id]);

  // Logic Add Cart
  const handleAddToCart = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!selectedSize) return toast.error("Please select a size first, G!");

    const safePrice = displayPrice(product.price);

    cart.addItem({
      id: `${product.id}-${selectedSize.id}`,
      productId: product.id,
      variantId: selectedSize.id,
      name: product.name,
      price: safePrice,
      image: product.images[0]?.image_url,
      size: selectedSize.size,
      maxStock: selectedSize.stock,
      weight: product.weight,
      quantity: 1,
    });

    const imgUrl = product.images[0]?.image_url || "";
    triggerFlyAnimation(e.currentTarget, imgUrl); 

    toast.success("Added to Cart!", {
      description: `${product.name} (Size: ${selectedSize.size})`,
      action: {
        label: "View Cart",
        onClick: () => (window.location.href = "/cart"),
      },
    });
  }, [cart, product, selectedSize, triggerFlyAnimation]);

  // Logic Wishlist
  const handleToggleWishlist = useCallback(async () => {
    if (!user) return toast.error("Login first to save to wishlist!");

    // Optimistic Update
    setIsWishlisted((prev) => !prev);

    try {
      const res = await api.post("/wishlist/toggle", {
        product_id: product.id,
      });
      toast.success(res.data.message);
    } catch {
      setIsWishlisted((prev) => !prev); // Rollback
      toast.error("Failed to update wishlist");
    }
  }, [user, product.id]);

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-2 leading-none">
        {product.name}
      </h1>
      <p className="text-2xl font-medium text-muted-foreground mb-6">
        Rp {displayPrice(product.price).toLocaleString("id-ID")}
      </p>

      <div className="prose prose-invert text-muted-foreground text-sm mb-8 leading-relaxed whitespace-pre-line border-l-2 border-border pl-4">
        {product.description}
      </div>

      {/* SIZE SELECTOR */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="font-bold text-sm tracking-wide">SELECT SIZE</span>
          {selectedSize && (
            <span
              className={`text-sm font-medium ${
                selectedSize.stock < 5
                  ? "text-red-500 animate-pulse"
                  : "text-green-500"
              }`}
            >
              {selectedSize.stock < 5
                ? `Hurry! Only ${selectedSize.stock} left`
                : "In Stock"}
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
                  ${
                    selectedSize?.id === variant.id
                      ? "bg-foreground text-background border-foreground scale-105 shadow-lg"
                      : "bg-transparent text-foreground border-border hover:border-foreground"
                  }
                  ${
                    !isAvailable &&
                    "opacity-30 cursor-not-allowed line-through bg-muted"
                  }
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
          className="flex-1 h-14 text-lg font-bold rounded-none transition-transform active:scale-95"
          disabled={!selectedSize}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-2 w-5 h-5" />
          {selectedSize ? "ADD TO CART" : "SELECT A SIZE"}
        </Button>

        <Button
          size="icon"
          variant="outline"
          className={`h-14 w-14 border-border rounded-none transition-colors ${
            isWishlisted
              ? "bg-red-500/10 border-red-500 text-red-500 hover:text-red-600"
              : "hover:text-red-500"
          }`}
          onClick={handleToggleWishlist}
        >
          <Heart
            className={`w-6 h-6 ${isWishlisted ? "fill-current" : ""}`}
          />
        </Button>
      </div>
    </div>
  );
});