"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sparkles, ShoppingCart, User, Clock } from "lucide-react";
import { useCart } from "@/lib/useCart";
import { useAuth } from "@/lib/useAuth";

export default function BottomNav() {
  const pathname = usePathname();
  const cart = useCart();
  const { user } = useAuth();

  const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);

  const navItems = [
    { href: "/", icon: Home, label: "Home", active: pathname === "/" },
    { href: "/new-arrivals", icon: Sparkles, label: "New", active: pathname === "/new-arrivals" },
    { href: "/cart", icon: ShoppingCart, label: "Cart", active: pathname === "/cart", badge: cartCount },
    { href: "/dashboard/orders", icon: Clock, label: "History", active: pathname === "/dashboard/orders" },
    { href: user ? "/dashboard" : "/login", icon: User, label: "Profile", active: pathname === "/dashboard" || pathname === "/login" }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                item.active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={item.active ? 2.5 : 2} />
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}