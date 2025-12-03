"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/lib/useAuth";
import { useRouter } from "next/navigation";
import ProductCard, { Product } from "@/components/shared/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { HeartOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function WishlistPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) router.push("/login");

    const fetchWishlist = async () => {
      try {
        const res = await api.get("/wishlist");
        setProducts(res.data.data);
      } catch (error) {
        console.error("Gagal load wishlist");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchWishlist();
  }, [user, router]);

  return (
    <main className="min-h-screen bg-background text-foreground pt-10 pb-20">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-black mb-8 uppercase tracking-tighter">My Wishlist</h1>

        {loading ? (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-[300px] w-full" />)}
           </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 gap-y-10">
            {products.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-lg">
            <HeartOff className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-xl font-bold mb-2">Wishlist Kosong</h2>
            <p className="text-muted-foreground mb-6">Belum ada barang inceran nih, G.</p>
            <Button asChild>
                <Link href="/shop">CARI BARANG</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}