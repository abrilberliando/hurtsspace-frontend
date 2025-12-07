"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ShoppingBag, Menu, LayoutDashboard, Heart, ChevronDown, Home, User, Grid, Loader2 } from "lucide-react";
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
import api from "@/lib/axios";

// Interface Kategori
interface Category {
  id: number | string;
  name: string;
  slug?: string;
}

// Interface Product untuk Live Search
interface Product {
    id: number;
    name: string;
    slug: string;
    price: number;
    images: { image_url: string }[];
    category?: { name: string };
}

export default function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); 
  const { user, logout } = useAuth();
  const cart = useCart();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]); 

  // State buat Live Search
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 1. Handle Scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        const cats = Array.isArray(res.data) ? res.data : res.data.data || [];
        setCategories(cats);
      } catch (err) {
        console.error("Gagal load navbar categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // 3. Sync Input dengan URL Param & Reset saat tutup
  useEffect(() => {
    if (isSearchOpen) {
        const queryFromUrl = searchParams.get('search') || "";
        setSearchQuery(queryFromUrl);
        if (queryFromUrl) {
            performLiveSearch(queryFromUrl);
        } else {
            setSearchResults([]);
        }
    }
  }, [isSearchOpen, searchParams]);

  // 4. Logic Live Search
  const performLiveSearch = async (query: string) => {
    if (!query.trim()) {
        setSearchResults([]);
        return;
    }
    setIsSearching(true);
    try {
        const res = await api.get(`/products?search=${encodeURIComponent(query)}&limit=20`);
        const items = Array.isArray(res.data) ? res.data : res.data.data || [];
        const realItems = Array.isArray(items) ? items : (items.data || []);
        
        const strictFiltered = realItems.filter((item: Product) => 
            item.name.toLowerCase().includes(query.toLowerCase())
        );

        setSearchResults(strictFiltered.slice(0, 5)); 
    } catch (error) {
        console.error("Live search error:", error);
    } finally {
        setIsSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        performLiveSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
        router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
        setIsSearchOpen(false);
    }
  };

  const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
        {/* --- TOP NAVBAR --- */}
        <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
            isScrolled
            ? "bg-background/80 backdrop-blur-md border-border py-3 shadow-sm"
            : "bg-transparent border-transparent py-5"
        }`}
        >
        <div className="container mx-auto px-4 lg:px-16 flex items-center justify-between relative">
            
            {/* 1. Mobile/Tablet Menu (Hamburger) */}
            <div className="lg:hidden">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-foreground hover:bg-accent">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    
                    <SheetContent 
                        side="left" 
                        className="w-[270px] sm:w-[300px] bg-background/98 backdrop-blur-xl border-r border-border rounded-r-3xl overflow-y-auto p-5"
                    >
                        <div className="flex flex-col h-full">
                            {/* Logo Kecil */}
                            <div className="mb-8 pt-2">
                                <span className="text-xl font-black tracking-tighter">HURTSSPACE</span>
                            </div>

                            {/* Menu Links */}
                            <div className="flex flex-col gap-5 text-sm font-bold text-foreground tracking-widest uppercase">
                                
                                {/* 👇 SEARCH ITEM (PINDAH KESINI) */}
                                <button 
                                    className="hover:text-primary transition flex items-center gap-3 text-left w-full group"
                                    onClick={() => {
                                        setIsSheetOpen(false);
                                        // Kasih jeda dikit biar menu tutup dulu baru search buka
                                        setTimeout(() => setIsSearchOpen(true), 200);
                                    }}
                                >
                                    <Search className="w-4 h-4 group-hover:text-primary transition" />
                                    Search
                                </button>

                                <Link 
                                    href="/new-arrivals" 
                                    className="hover:text-primary transition flex items-center gap-3"
                                    onClick={() => setIsSheetOpen(false)}
                                >
                                    New Arrivals
                                </Link> 
                                <Link 
                                    href="/shop" 
                                    className="hover:text-primary transition flex items-center gap-3"
                                    onClick={() => setIsSheetOpen(false)}
                                >
                                    Shop
                                </Link>

                                {/* CATEGORIES SECTION */}
                                <div className="flex flex-col gap-3">
                                    <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-2">Categories</span>
                                    <div className="pl-3 flex flex-col gap-3 border-l border-border/50">
                                        <Link 
                                            href="/shop" 
                                            className="hover:text-primary transition text-xs font-medium normal-case"
                                            onClick={() => setIsSheetOpen(false)}
                                        >
                                            All Collection
                                        </Link>
                                        {categories.map((cat) => (
                                            <Link
                                                key={cat.id}
                                                href={`/shop?category_id=${cat.id}`}
                                                className="hover:text-primary transition text-xs font-medium normal-case"
                                                onClick={() => setIsSheetOpen(false)}
                                            >
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {user?.role === 'admin' && (
                                    <Link 
                                        href="/admin/orders" 
                                        className="text-red-500 hover:text-red-600 transition flex items-center gap-2 mt-2"
                                        onClick={() => setIsSheetOpen(false)}
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        Admin Panel
                                    </Link>
                                )}
                                <Link 
                                    href="/lookbook" 
                                    className="hover:text-primary transition flex items-center gap-3"
                                    onClick={() => setIsSheetOpen(false)}
                                >
                                    Lookbook
                                </Link>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* 2. LOGO */}
            <Link href="/" className="text-2xl font-black tracking-tighter text-foreground hover:opacity-80 transition z-10">
            HURTSSPACE
            </Link>

            {/* 3. Desktop Menu (CENTERED) */}
            <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-muted-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            
            <Link href="/new-arrivals" className="hover:text-foreground transition text-foreground font-bold">
                NEW ARRIVALS
            </Link>
            <Link href="/shop" className="hover:text-foreground transition">SHOP</Link>
            
            {/* CATEGORIES DROPDOWN */}
            <DropdownMenu>
                <DropdownMenuTrigger className="hover:text-foreground transition outline-none flex items-center gap-1 group">
                    CATEGORIES
                    <ChevronDown className="w-3 h-3 transition-transform group-data-[state=open]:rotate-180" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48 bg-background border-border">
                    {categories.map((cat) => (
                        <DropdownMenuItem key={cat.id} asChild>
                            <Link href={`/shop?category_id=${cat.id}`} className="cursor-pointer w-full">
                                {cat.name}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/lookbook" className="hover:text-foreground transition">LOOKBOOK</Link>
            </div>

            {/* 4. Right Icons */}
            <div className="flex items-center gap-4 z-10">
                <ModeToggle />

                {/* SEARCH ICON & OFF-CANVAS SHEET */}
                {/* 👇 Control via isSearchOpen state, Trigger Button cuma muncul di Desktop (hidden lg:flex) */}
                <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                    <SheetTrigger asChild>
                        {/* Hidden on Mobile/Tablet (< lg), Visible on Desktop (lg) */}
                        <Button variant="ghost" size="icon" className="text-foreground hover:bg-accent hidden lg:flex">
                            <Search className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>
                    {/* Top Sheet dengan Live Results */}
                    <SheetContent side="top" className="h-auto min-h-[40vh] max-h-[80vh] overflow-y-auto flex flex-col items-center bg-background/95 backdrop-blur-xl border-b border-border pt-16 pb-10">
                        <div className="container mx-auto max-w-2xl w-full">
                            
                            {/* Input Form */}
                            <form onSubmit={handleSearchSubmit} className="relative w-full">
                                <Search className="absolute ml-2 left-0 top-1/2 -translate-y-1/2 w-8 h-8 text-muted-foreground" />
                                <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="Search products..." 
                                    className="w-full bg-transparent border-b-2 border-border focus:border-foreground text-3xl font-bold py-4 pl-12 pr-12 outline-none placeholder:text-muted-foreground/50 transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {/* Spinner Loading */}
                                {isSearching && (
                                    <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground animate-spin" />
                                )}
                            </form>

                            {/* ITEMS YANG DITERIMA DARI HASIL SEARCH (Live Results) */}
                            <div className="mt-8 w-full space-y-2">
                                {searchResults.length > 0 ? (
                                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-3 mb-4">Top Results</p>
                                        {searchResults.map((item) => (
                                            <Link 
                                                key={item.id} 
                                                href={`/products/${item.slug}`}
                                                onClick={() => setIsSearchOpen(false)}
                                                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                                            >
                                                {/* Image Thumbnail */}
                                                <div className="w-12 h-16 bg-muted rounded overflow-hidden relative shrink-0">
                                                    {item.images[0] && (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={item.images[0].image_url} alt={item.name} className="object-cover w-full h-full" />
                                                    )}
                                                </div>
                                                
                                                {/* Text Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold truncate text-foreground group-hover:text-primary transition">{item.name}</h4>
                                                    <p className="text-xs text-muted-foreground">{item.category?.name || "Product"}</p>
                                                </div>
                                                
                                                {/* Price */}
                                                <div className="text-sm font-bold whitespace-nowrap">
                                                    Rp {item.price.toLocaleString("id-ID")}
                                                </div>
                                            </Link>
                                        ))}
                                        <Button 
                                            variant="link" 
                                            className="w-full mt-2 text-muted-foreground hover:text-foreground"
                                            onClick={handleSearchSubmit}
                                        >
                                            View all results for &quot;{searchQuery}&quot;
                                        </Button>
                                    </div>
                                ) : searchQuery && !isSearching ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p>No items found for &quot;{searchQuery}&quot;</p>
                                    </div>
                                ) : (
                                    <div className="mt-4">
                                    </div>
                                )}
                            </div>

                        </div>
                    </SheetContent>
                </Sheet>

                {/* Wrapper Cart & Profile (Desktop Only -> hidden lg:flex) */}
                <div className="hidden lg:flex items-center gap-4">
                    
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
            </div>
        </div>
        </nav>

        {/* --- BOTTOM NAVIGATION BAR (Mobile/Tablet Only < 1024px) --- */}
        <div className="fixed bottom-0 left-0 z-50 w-full h-[60px] bg-background/90 backdrop-blur-lg border-t border-border flex items-center justify-around lg:hidden pb-[env(safe-area-inset-bottom)]">
            {/* 1. Home */}
            <Link href="/" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground active:scale-95 transition-all">
                <Home className="w-5 h-5" />
                <span className="text-[10px] font-bold mt-1">Home</span>
            </Link>

            {/* 2. Shop */}
            <Link href="/shop" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground active:scale-95 transition-all">
                <Grid className="w-5 h-5" />
                <span className="text-[10px] font-bold mt-1">Shop</span>
            </Link>

            {/* 3. Cart */}
            <Link href="/cart" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground active:scale-95 transition-all relative">
                <div className="relative">
                    <ShoppingBag className="w-5 h-5" />
                    {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                            {cartCount}
                        </span>
                    )}
                </div>
                <span className="text-[10px] font-bold mt-1">Cart</span>
            </Link>

            {/* 4. Profile */}
            <Link href={user ? "/dashboard" : "/login"} className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground active:scale-95 transition-all">
                {user?.avatar ? (
                    <Avatar className="w-6 h-6 border border-border">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-[10px]">MY</AvatarFallback>
                    </Avatar>
                ) : (
                    <User className="w-5 h-5" />
                )}
                <span className="text-[10px] font-bold mt-1">Profile</span>
            </Link>
        </div>
    </>
  );
}