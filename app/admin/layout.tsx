"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
// 👇 Tambah icon TicketPercent
import { LayoutDashboard, ShoppingCart, Package, LogOut, Camera, TicketPercent, Image } from "lucide-react"; 
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user && user.role !== 'admin') {
        router.push("/");
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') return null;

  const menus = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Manage Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Manage Products", href: "/admin/products", icon: Package },
    { name: "Manage Lookbook", href: "/admin/lookbooks", icon: Camera },
    // 👇 MENU BARU
    { name: "Manage Vouchers", href: "/admin/vouchers", icon: TicketPercent }, 
    { name: "Manage Banners", href: "/admin/banners", icon: Image },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          <div className="md:col-span-1">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sticky top-24">
              <div className="mb-6 px-4">
                <h2 className="font-black text-xl tracking-tighter">ADMIN PANEL</h2>
                <p className="text-xs text-zinc-500">Hurtsspace HQ</p>
              </div>
              <nav className="space-y-1">
                {menus.map((menu) => {
                  const Icon = menu.icon;
                  const isActive = pathname.startsWith(menu.href) && (menu.href !== '/admin' || pathname === '/admin');
                  return (
                    <Link 
                      key={menu.href} 
                      href={menu.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm font-medium
                        ${isActive 
                            ? "bg-white text-black font-bold" 
                            : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {menu.name}
                    </Link>
                  );
                })}
                
                <div className="pt-4 mt-4 border-t border-zinc-800">
                    <Button 
                        variant="ghost" 
                        className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-950/30"
                        onClick={() => { logout(); router.push("/login"); }}
                    >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                    </Button>
                </div>
              </nav>
            </div>
          </div>

          <div className="md:col-span-4">
            {children}
          </div>

        </div>
      </div>
    </div>
  );
}