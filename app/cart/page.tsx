"use client";

import Link from "next/link";
import { useCart } from "@/lib/useCart";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function CartPage() {
  const cart = useCart();
  
  // Format Rupiah
  const formatRupiah = (num: number) => {
    return "Rp " + num.toLocaleString("id-ID");
  };

  // State Kosong
  if (cart.items.length === 0) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
            <h1 className="text-4xl font-black mb-4">YOUR CART IS EMPTY</h1>
            <p className="text-muted-foreground mb-8">
                Belum ada barang, G. Kalap dulu gih di Shop.
            </p>
            <Button asChild size="lg" className="font-bold">
                <Link href="/shop">SHOP NOW</Link>
            </Button>
        </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground pt-10 pb-20">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-black tracking-tighter mb-8 uppercase">Shopping Cart ({cart.items.length})</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* KIRI: LIST BARANG */}
            <div className="lg:col-span-2 space-y-6">
                {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 border border-border rounded-lg bg-card">
                        {/* Gambar */}
                        <div className="w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold uppercase text-sm md:text-base">{item.name}</h3>
                                <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <p className="font-bold">{formatRupiah(item.price)}</p>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col justify-between items-end">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-muted-foreground hover:text-red-500"
                                onClick={() => cart.removeItem(item.id)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>

                            <div className="flex items-center gap-2 bg-muted rounded-md p-1">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6"
                                    onClick={() => cart.decreaseItem(item.id)}
                                >
                                    <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6"
                                    onClick={() => cart.addItem(item)} // addItem otomatis nambah +1
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
                <div className="border border-border rounded-lg p-6 bg-card sticky top-24">
                    <h2 className="font-bold text-xl mb-6">ORDER SUMMARY</h2>
                    
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium">{formatRupiah(cart.totalPrice())}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Shipping</span>
                            <span className="text-muted-foreground italic">Calculated at checkout</span>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="flex justify-between text-lg font-bold mb-6">
                        <span>TOTAL</span>
                        <span>{formatRupiah(cart.totalPrice())}</span>
                    </div>

                    <Button className="w-full font-bold h-12 text-base" asChild>
                        {/* Nanti ini kita arahin ke Checkout Logic */}
                        <Link href="/checkout">
                            CHECKOUT NOW <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                    </Button>

                    <p className="text-xs text-muted-foreground mt-4 text-center">
                        Tax included. Secure checkout powered by Midtrans.
                    </p>
                </div>
            </div>

        </div>
      </div>
    </main>
  );
}