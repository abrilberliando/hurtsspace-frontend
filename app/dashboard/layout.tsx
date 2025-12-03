"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, ShoppingBag, MapPin, LogOut } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const menus = [
    { name: "My Profile", href: "/dashboard", icon: User },
    { name: "Order History", href: "/dashboard/orders", icon: ShoppingBag },
    { name: "Address Book", href: "/dashboard/address", icon: MapPin }, // Menu Alamat Terpisah
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* SIDEBAR */}
          <div className="md:col-span-1">
            <div className="bg-card border border-border rounded-lg p-4 sticky top-24">
              <nav className="space-y-2">
                {menus.map((menu) => {
                  const Icon = menu.icon;
                  const isActive = pathname === menu.href;
                  return (
                    <Link 
                      key={menu.href} 
                      href={menu.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm font-medium
                        ${isActive 
                            ? "bg-foreground text-background font-bold" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"}
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {menu.name}
                    </Link>
                  );
                })}
                
                <div className="pt-4 mt-4 border-t border-border">
                    <Button 
                        variant="ghost" 
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100/10"
                        onClick={logout}
                    >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                    </Button>
                </div>
              </nav>
            </div>
          </div>

          {/* CONTENT KANAN */}
          <div className="md:col-span-3">
            {children}
          </div>

        </div>
      </div>
    </div>
  );
}