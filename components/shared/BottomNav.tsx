"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, ShoppingCart, User, Clock } from "lucide-react";
import { useCart } from "@/lib/useCart";
import { useAuth } from "@/lib/useAuth";
import { useMemo } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const cart = useCart();
  const { user } = useAuth();

  // 1. MEMOIZE CART COUNT
  // Biar gak ngitung ulang tiap kali pindah halaman
  const cartCount = useMemo(() => {
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }, [cart.items]);

  // 2. MEMOIZE NAV ITEMS
  // This array is only recreated if important state changes
  const navItems = useMemo(() => [
    { 
      href: "/", 
      icon: Home, 
      label: "Home", 
      active: pathname === "/" 
    },
    { 
      href: "/new-arrivals", 
      icon: Sparkles, 
      label: "New", 
      active: pathname === "/new-arrivals" 
    },
    { 
      href: "/cart", 
      icon: ShoppingCart, 
      label: "Cart", 
      active: pathname === "/cart", 
      badge: cartCount 
    },
    { 
      href: "/dashboard/orders", 
      icon: Clock, 
      label: "History", 
      active: pathname === "/dashboard/orders" 
    },
    { 
      href: user ? "/dashboard" : "/login", 
      icon: User, 
      label: "Profile", 
      active: pathname.startsWith("/dashboard") || pathname === "/login" 
    }
  ], [pathname, cartCount, user]);

  if (pathname === '/shop' || pathname.startsWith('/admin')) return null;

  return (
    // Add inline style padding-bottom to support iOS Safe Area 
    // just in case your 'pb-safe' class is not configured correctly
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200
                active:scale-95
                ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"}
              `}
            >
              <div className="relative">
                <Icon 
                  className={`w-5 h-5 transition-all ${isActive ? "scale-110" : "scale-100"}`} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
                
                {/* Badge Logic */}
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full animate-in zoom-in duration-300">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? "opacity-100" : "opacity-80"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}