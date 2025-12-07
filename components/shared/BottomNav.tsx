"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, ShoppingBag, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/lib/useCart";
import { useAuth } from "@/lib/useAuth";

export default function BottomNav() {
  const pathname = usePathname();
  const cart = useCart();
  const { user } = useAuth();

  const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);

  // Helper buat cek active state
  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border pb-safe md:hidden block">
      <div className="flex justify-around items-center h-16 px-2">
        
        {/* 1. HOME */}
        <Link 
            href="/" 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* 2. NEW (New Arrivals) */}
        <Link 
            href="/new-arrivals" // Nanti bisa disesuaikan filternya
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname.includes('sort=new') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium">New</span>
        </Link>

        {/* 3. SHOP (DITONJOLKAN / Floating) */}
        <div className="relative -top-5">
            <Link 
                href="/shop"
                className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg border-4 border-background transition-transform active:scale-95"
            >
                <ShoppingBag className="w-6 h-6" />
            </Link>
        </div>

        {/* 4. CART */}
        <Link 
            href="/cart" 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${isActive('/cart') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
            <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                        {cartCount}
                    </span>
                )}
            </div>
            <span className="text-[10px] font-medium">Cart</span>
        </Link>

        {/* 5. PROFILE */}
        <Link 
            href={user ? "/dashboard" : "/login"} 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/dashboard') || isActive('/login') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profile</span>
        </Link>

      </div>
    </div>
  );
}