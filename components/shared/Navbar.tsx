"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, Menu, LayoutDashboard, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ModeToggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { useCart } from "@/lib/useCart";

export default function Navbar() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user, logout } = useAuth();
  const cart = useCart();
  
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
        router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-border py-3 shadow-sm"
          : "bg-transparent border-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        
        {/* 1. Mobile Menu (Hamburger) */}
        <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-foreground hover:bg-accent">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-background border-l border-border">
                    <div className="flex flex-col gap-6 mt-10 ml-5 text-lg font-bold text-foreground">
                        {/* 👇 Tambahkan onClick={() => setIsSheetOpen(false)} di setiap Link */}
                        <Link 
                            href="/" 
                            className="hover:text-primary transition"
                            onClick={() => setIsSheetOpen(false)}
                        >
                            HOME
                        </Link>
                        <Link 
                            href="/shop?sort=new" 
                            className="hover:text-primary transition"
                            onClick={() => setIsSheetOpen(false)}
                        >
                            NEW ARRIVALS
                        </Link> 
                        <Link 
                            href="/shop" 
                            className="hover:text-primary transition"
                            onClick={() => setIsSheetOpen(false)}
                        >
                            SHOP
                        </Link>
                        {user?.role === 'admin' && (
                            <Link 
                                href="/admin/orders" 
                                className="text-red-500 hover:text-red-600 transition"
                                onClick={() => setIsSheetOpen(false)}
                            >
                                ADMIN PANEL
                            </Link>
                        )}
                        <Link 
                            href="/collab" 
                            className="hover:text-primary transition"
                            onClick={() => setIsSheetOpen(false)}
                        >
                            COLLAB
                        </Link>
                        <Link 
                            href="/lookbook" 
                            className="hover:text-primary transition"
                            onClick={() => setIsSheetOpen(false)}
                        >
                            LOOKBOOK
                        </Link>
                    </div>
                </SheetContent>
            </Sheet>
        </div>

        {/* 2. LOGO */}
        <Link href="/" className="text-2xl font-black tracking-tighter text-foreground hover:opacity-80 transition">
          HURTSSPACE
        </Link>

        {/* 3. Desktop Menu */}
        <div className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition">HOME</Link>
          <Link href="/shop?sort=new" className="hover:text-foreground transition text-foreground font-bold">
            NEW ARRIVALS
          </Link>
          <Link href="/shop" className="hover:text-foreground transition">SHOP</Link>
          <Link href="/collab" className="hover:text-red-500 transition text-red-500">COLLAB</Link>
          <Link href="/lookbook" className="hover:text-foreground transition">LOOKBOOK</Link>
        </div>

        {/* 4. Right Icons */}
        <div className="flex items-center gap-2">
            <ModeToggle />

            {/* Search (Desktop Only) */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center bg-muted/50 rounded-full px-3 py-1 border border-border focus-within:border-primary transition">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    className="bg-transparent border-none focus:outline-none text-sm text-foreground px-2 w-24 focus:w-40 transition-all placeholder:text-muted-foreground"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </form>

            {/* 👇 WRAPPER KHUSUS DESKTOP: Cart & Profile ILANG pas di Mobile (hidden md:flex) */}
            <div className="hidden md:flex items-center gap-2">
                
                {/* Cart Icon */}
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-accent relative" asChild>
                    <Link href="/cart" id="cart-icon-target">
                        <ShoppingBag className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span key={cartCount} className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-in zoom-in duration-300">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                </Button>

                {/* User Profile / Login */}
                {user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Avatar className="h-8 w-8 cursor-pointer border border-border hover:opacity-80 transition">
                                <AvatarImage src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=000&color=fff`} />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border w-56">
                            <DropdownMenuLabel>
                                <p className="font-bold truncate">{user.name}</p>
                                <p className="text-xs text-muted-foreground font-normal truncate">{user.email}</p>
                                {user.role === 'member' && (
                                    <p className="text-xs text-green-500 font-bold mt-1">💎 {user.points} Points</p>
                                )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            {user.role === 'admin' && (
                                <>
                                    <DropdownMenuItem asChild className="bg-red-500/10 focus:bg-red-500/20 cursor-pointer">
                                        <Link href="/admin/orders" className="flex items-center font-bold text-red-500">
                                            <LayoutDashboard className="w-4 h-4 mr-2" />
                                            Admin Panel
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}

                            <DropdownMenuItem asChild>
                                <Link href="/dashboard" className="cursor-pointer w-full">Profile Settings</Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem asChild>
                                <Link href="/wishlist" className="cursor-pointer w-full flex justify-between">
                                    Wishlist <Heart className="w-3 h-3 text-red-500 fill-current" />
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/orders" className="cursor-pointer w-full">Order History</Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem 
                                className="text-red-500 cursor-pointer focus:text-red-500 focus:bg-red-100 dark:focus:bg-red-900/20"
                                onClick={logout}
                            >
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button asChild variant="default" size="sm" className="font-bold">
                        <Link href="/login">LOGIN</Link>
                    </Button>
                )}

            </div>
            {/* 👆 Akhir Wrapper Desktop Only */}

        </div>
      </div>
    </nav>
  );
}