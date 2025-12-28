"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, notFound } from "next/navigation"; // 👈 Import notFound
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  LogOut,
  Camera,
  TicketPercent,
  Image,
  PanelLeftClose,
  PanelLeftOpen,
  ChartBar,
  Menu,
  Loader2,
  Video,
  TextWrapIcon,
  Mail, // 👈 Pake Loader
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// 1. MENU DEFINITION
const menus = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: ChartBar },
  { name: "Hero Utama", href: "/admin/hero", icon: Image },
  { name: "Video", href: "/admin/video-banners", icon: Video },
  { name: "Banners", href: "/admin/banners", icon: Image },
  { name: "Lookbook", href: "/admin/lookbooks", icon: Camera },
  { name: "Vouchers", href: "/admin/vouchers", icon: TicketPercent },
  { name: "Broadcast", href: "/admin/broadcast", icon: Mail },
  { name: "Running Text", href: "/admin/running-text", icon: TextWrapIcon },
];

// 2. ADMIN NAV COMPONENT (Smart & Collapsible)
interface AdminNavProps {
  isMobile?: boolean;
  isCollapsed?: boolean;
  onLinkClick?: () => void;
  onToggleCollapse?: () => void;
}

function AdminNav({
  isMobile = false,
  isCollapsed = false,
  onLinkClick,
  onToggleCollapse,
}: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {/* Header Nav & Toggle */}
      <div
        className={`mb-8 mt-2 flex items-center ${
          isCollapsed ? "justify-center" : "justify-between"
        } px-2`}
      >
        {/* Logo Text (Hidden if collapsed) */}
        {!isCollapsed && (
          <div>
            <h2 className="font-black text-xl tracking-tighter text-foreground leading-none">
              ADMIN<span className="text-muted-foreground">PANEL</span>
            </h2>
          </div>
        )}

        {/* Toggle Button (Desktop Only) */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="text-muted-foreground hover:text-foreground hover:bg-accent h-8 w-8"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Menu Items */}
      <nav className="space-y-1 flex-1">
        {menus.map((menu) => {
          const Icon = menu.icon;
          const isActive =
            pathname === menu.href ||
            (menu.href !== "/admin" && pathname.startsWith(menu.href));

          return (
            <Link
              key={menu.href}
              href={menu.href}
              onClick={() => isMobile && onLinkClick?.()}
              title={isCollapsed ? menu.name : undefined} // Tooltip native pas collapsed
              className={`
                        flex items-center gap-3 py-3 rounded-md transition-all duration-200 text-sm font-medium
                        ${isCollapsed ? "justify-center px-2" : "px-4"} 
                        ${
                          isActive
                            ? "bg-primary text-primary-foreground font-bold shadow-md"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }
                    `}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? "text-primary-foreground" : ""
                }`}
              />
              {!isCollapsed && <span className="truncate">{menu.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div
        className={`pt-4 mt-auto border-t border-border ${
          isCollapsed ? "flex justify-center" : ""
        }`}
      >
        <Button
          variant="ghost"
          className={`
                    justify-start text-red-500 hover:text-red-600 hover:bg-red-100/10 gap-3
                    ${isCollapsed ? "w-10 px-0 justify-center" : "w-full"}
                `}
          onClick={() => {
            logout();
            router.push("/login");
          }}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
}

// 3. MAIN LAYOUT
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // 👇 LOGIC SECURITY & LOADING
  useEffect(() => {
    const timer = setTimeout(() => {
        setIsChecking(false);
    }, 800); 

    return () => clearTimeout(timer);
  }, []);

  // 1. Tampilkan Loading Screen kalau masih ngecek
  if (isChecking) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
        </div>
      );
  }

  // 2. Security Check: Kalau bukan admin atau gak login -> 404
  if (!user || user.role !== "admin") {
      notFound(); // Lempar ke halaman 404
      return null;
  }

  // 3. Render Dashboard kalau Lulus
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row relative">
      {/* 👇 FLOATING MOBILE TOGGLE (Sticky on Left Edge) */}
      <div className="lg:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="fixed left-0 top-1/2 z-50 -translate-y-1/2 rounded-l-none rounded-r-xl h-14 w-10 shadow-xl border-y border-r border-border hover:w-12 transition-all group"
            >
              <PanelLeftOpen className="w-5 h-5 text-foreground group-hover:scale-110 transition-transform" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[280px] bg-background border-r border-border p-6"
          >
            {/* Mobile selalu expanded (isCollapsed=false) */}
            <SheetHeader>
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            </SheetHeader>
            <AdminNav
              isMobile={true}
              onLinkClick={() => setIsSheetOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* DESKTOP SIDEBAR (Collapsible & Sticky) */}
      <aside
        className={`
            hidden lg:block shrink-0 transition-all duration-300 ease-in-out
            border-r border-border bg-muted/10 sticky top-0 h-screen overflow-hidden
            ${isCollapsed ? "w-[80px]" : "w-64"}
        `}
      >
        <div className="p-4 h-full flex flex-col">
          <AdminNav
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          />
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 p-4 lg:p-8">{children}</main>
    </div>
  );
}