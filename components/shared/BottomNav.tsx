"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, ShoppingCart, User, ClipboardList } from "lucide-react";
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
            href="/new-arrivals" 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/new-arrivals') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium">New</span>
        </Link>

        {/* 3. CART (MIDDLE - FLOATING) 🛒 */}
        <div className="relative -top-5">
            <Link 
                href="/cart"
                className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg border-4 border-background transition-transform active:scale-95 relative"
            >
                <ShoppingCart className="w-6 h-6" />
                {/* Badge Cart Count */}
                {cartCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-background">
                        {cartCount}
                    </span>
                )}
            </Link>
        </div>

        {/* 4. ORDER HISTORY (Gantiin posisi Cart lama) */}
        <Link 
            href="/dashboard/orders" 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/dashboard/orders') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
            <ClipboardList className="w-5 h-5" />
            <span className="text-[10px] font-medium">History</span>
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