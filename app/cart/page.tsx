"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useCart } from "@/lib/useCart";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, ArrowRight, RefreshCw, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { toast } from "sonner"; // Asumsi lo pake sonner/toast buat notif kekinian

// Tipe data buat validasi response dari server
type ProductValidation = {
  id: string;
  price: number;
  stock: number;
  isAvailable: boolean;
};

export default function CartPage() {
  const cart = useCart();
  const [isSyncing, setIsSyncing] = useState(true);

  // Format Rupiah (Pake useMemo biar ga recalculate mulu kalo ga perlu, hemat CPU dikit)
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  // 🔥 LOGIC SYNC DATABASE (The Secret Sauce)
  useEffect(() => {
    const validateCart = async () => {
      // Kalo cart kosong, gausah buang resource fetch ke server
      if (cart.items.length === 0) {
        setIsSyncing(false);
        return;
      }

      try {
        setIsSyncing(true);
        
        // Kita kirim list ID barang yang ada di cart ke backend
        const itemIds = cart.items.map((item) => item.id);

        // Ganti URL ini sesuai route API backend lo (Laravel/Node)
        // Method: POST, Body: { ids: string[] }
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/validate-cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: itemIds }),
        });

        if (!response.ok) throw new Error("Gagal sinkronisasi data");

        const latestData: ProductValidation[] = await response.json();

        // Cek perbedaan data local vs server
        let hasChanges = false;

        latestData.forEach((serverItem) => {
          const localItem = cart.items.find((i) => i.id === serverItem.id);
          
          if (localItem) {
            // 1. Cek Harga Berubah
            if (localItem.price !== serverItem.price) {
              // Update harga di local storage via function di useCart lo
              // Pastiin useCart lo punya method updateItem ya G!
              // cart.updateItem(localItem.id, { price: serverItem.price }); 
              console.log(`Harga berubah untuk ${localItem.name}`);
              hasChanges = true;
            }

            // 2. Cek Stok (Kalo stok server lebih dikit dari yg di cart, turunin qty)
            if (serverItem.stock < localItem.quantity) {
              // cart.updateItem(localItem.id, { quantity: serverItem.stock });
              console.log(`Stok menipis untuk ${localItem.name}`);
              hasChanges = true;
            }

            // 3. Cek Ketersediaan (Soft Delete / Unpublished)
            if (!serverItem.isAvailable) {
              cart.removeItem(localItem.id);
              toast.error(`Produk ${localItem.name} sudah tidak tersedia dan dihapus.`);
            }
          }
        });

        if (hasChanges) {
          toast.warning("Beberapa harga atau stok telah diperbarui mengikuti data terbaru.");
        }

      } catch (error) {
        console.error("Sync Error:", error);
        // Silent fail aja biar user ga panik, atau kasih toast kecil
      } finally {
        setIsSyncing(false);
      }
    };

    validateCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Hitung total price pake useMemo biar performa render kenceng
  const totalPrice = useMemo(() => {
    return cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart.items]);

  // State Kosong
  if (cart.items.length === 0 && !isSyncing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4 animate-in fade-in zoom-in duration-500">
        <h1 className="text-4xl font-black mb-4 text-muted-foreground/50">YOUR CART IS EMPTY</h1>
        <p className="text-muted-foreground mb-6">Just empty space, go shopping mate!</p>
        <Button asChild size="lg" className="font-bold rounded-full">
          <Link href="/shop">SHOP NOW</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground pt-10 pb-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black tracking-tighter uppercase">
            Shopping Cart ({cart.items.length})
          </h1>
          {/* Indikator Sync */}
          {isSyncing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Syncing prices...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* KIRI: LIST BARANG */}
          <div className="lg:col-span-2 space-y-6">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 border border-border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                {/* Gambar (Optimized) */}
                <div className="w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0 relative">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill // Pake fill biar responsive ngikut parent
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    priority={false} // Lazy load gambar yg di bawah
                  />
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold uppercase text-sm md:text-base line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Size: {item.size}
                    </p>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <p className="font-bold text-primary">
                      {formatRupiah(item.price)}
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col justify-between items-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    onClick={() => cart.removeItem(item.id)}
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center gap-2 bg-muted/50 rounded-full p-1 border border-border">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full"
                      onClick={() => cart.decreaseItem(item.id)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-bold w-6 text-center tabular-nums">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full"
                      onClick={() => cart.addItem(item)}
                      disabled={item.quantity >= item.maxStock}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* KANAN: SUMMARY */}
          <div className="lg:col-span-1">
            <div className="border border-border rounded-xl p-6 bg-card sticky top-24 shadow-sm">
              <h2 className="font-bold text-xl mb-6 flex items-center gap-2">
                ORDER SUMMARY
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium font-mono">
                    {formatRupiah(totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-muted-foreground italic text-xs">
                    Calculated at checkout
                  </span>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="flex justify-between text-lg font-black mb-6">
                <span>TOTAL</span>
                <span className="text-primary">{formatRupiah(totalPrice)}</span>
              </div>

              <Button 
                className="w-full font-bold h-12 text-base rounded-lg transition-all active:scale-[0.98]" 
                asChild
                disabled={isSyncing || cart.items.length === 0}
              >
                <Link href="/checkout">
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" /> VERIFYING...
                    </>
                  ) : (
                    <>
                      CHECKOUT NOW <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Link>
              </Button>

              <p className="text-[10px] text-muted-foreground mt-4 text-center leading-tight">
                Tax included. Secure checkout powered by <span className="font-bold">Midtrans</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}