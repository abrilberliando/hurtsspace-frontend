"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Menu,
  LayoutDashboard,
  Heart,
  ChevronDown,
  Home,
  User,
  Grid,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ModeToggle";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetTitle 
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/useAuth";
import { useCart } from "@/lib/useCart";
import api from "@/lib/axios";
import AnnouncementBar from "./AnnouncementBar";
import NotificationDropdown from "./NotificationDropdown";
import Image from "next/image";

// --- TYPES ---
interface Category {
  id: number | string;
  name: string;
  slug?: string;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number | string;
  images: { image_url: string }[];
  category?: { name: string };
}

// --- HELPER FUNCTION ---
const displayPrice = (val: string | number): number => {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return 0;
  return Math.floor(num);
};

export default function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const cart = useCart();

  // State
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 1. OPTIMIZED SCROLL HANDLER
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 0;
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. Fetch Categories (Once on mount)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        const cats = Array.isArray(res.data) ? res.data : res.data.data || [];
        setCategories(cats);
      } catch (err) {
        console.error("Failed to load navbar categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // 3. LIVE SEARCH LOGIC (Memoized)
  const performLiveSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await api.get(
        `/products?search=${encodeURIComponent(query)}&limit=10`
      );
      const items = Array.isArray(res.data) ? res.data : res.data.data || [];
      const realItems = Array.isArray(items) ? items : items.data || [];

      const strictFiltered = realItems.filter((item: Product) =>
        item.name.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(strictFiltered.slice(0, 5));
    } catch (error) {
      console.error("Live search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 4. DEBOUNCE EFFECT
  useEffect(() => {
    if (isSearchOpen) {
      const queryFromUrl = searchParams.get("search") || "";
      setSearchQuery((prev) => (prev !== queryFromUrl ? queryFromUrl : prev));
    }
  }, [isSearchOpen, searchParams]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      performLiveSearch(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, performLiveSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  // 5. MEMOIZED CART COUNT
  const cartCount = useMemo(() => {
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }, [cart.items]);

  if (pathname === '/links' || pathname.startsWith('/admin')) return null;

  return (
    <>
      {/* --- HEADER WRAPPER (Fixed Top) --- */}
      {/* This main container sticks to the top (Fixed), wrapping Announcement + Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col w-full">
        
        {/* A. Announcement Bar (Paling Atas) */}
        <div className="relative z-50">
          <AnnouncementBar />
        </div>

        {/* B. Main Navigation (Di bawah Announcement) */}
        <nav
          className={`w-full transition-all duration-300 border-b ${
            isScrolled
              ? "bg-background/80 backdrop-blur-md border-border py-3 shadow-sm"
              : "bg-background border-transparent py-5"
          }`}
        >
          <div className="container mx-auto px-4 lg:px-16 flex items-center justify-between relative">
            
            {/* 1. Mobile/Tablet Menu (Left: Hamburger) */}
            <div className="lg:hidden flex items-center gap-2">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-foreground hover:bg-accent"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>

                <SheetContent
                  side="left"
                  className="w-[270px] sm:w-[300px] bg-background/98 backdrop-blur-xl border-r border-border rounded-r-3xl overflow-y-auto p-5 flex flex-col justify-between"
                >
                  <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>

                  <div className="flex flex-col h-full">
                    {/* Logo Kecil */}
                    <div className="mb-8 pt-2">
                      <span className="text-xl font-black tracking-tighter">
                        HURTSSPACE
                      </span>
                    </div>

                    {/* Menu Links */}
                    <div className="flex flex-col gap-5 text-sm font-bold text-foreground tracking-widest uppercase flex-1">
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
                        <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-2">
                          Categories
                        </span>
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

                      {user?.role === "admin" && (
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
                      <Link
                        href="/wishlist"
                        className="hover:text-primary transition flex items-center gap-3"
                        onClick={() => setIsSheetOpen(false)}
                      >
                        Wishlist
                      </Link>
                    </div>

                    {/* MOBILE DARK MODE */}
                    <div className="pt-6 border-t border-border mt-4">
                      <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Theme</span>
                          <ModeToggle />
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* 2. LOGO (Centered on Mobile, Left on Desktop) */}
            <Link
              href="/"
              className="text-2xl font-black tracking-tighter text-foreground hover:opacity-80 transition z-10 absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0"
            >
              <Image
                        src="/images/logoNav.webp" 
                        alt="Logo Brand"
                        width={80} 
                        height={80} 
                        priority 
                        className="object-contain" 
                      />
            </Link>

            {/* 3. Desktop Menu (CENTERED) */}
            <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-muted-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <Link
                href="/new-arrivals"
                className="hover:text-foreground transition text-foreground font-bold"
              >
                NEW ARRIVALS
              </Link>
              <Link href="/shop" className="hover:text-foreground transition">
                SHOP
              </Link>

              {/* CATEGORIES DROPDOWN */}
              <DropdownMenu>
                <DropdownMenuTrigger className="hover:text-foreground transition outline-none flex items-center gap-1 group">
                  CATEGORIES
                  <ChevronDown className="w-3 h-3 transition-transform group-data-[state=open]:rotate-180" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  className="w-48 bg-background border-border"
                >
                  {categories.map((cat) => (
                    <DropdownMenuItem key={cat.id} asChild>
                      <Link
                        href={`/shop?category_id=${cat.id}`}
                        className="cursor-pointer w-full"
                      >
                        {cat.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/lookbook" className="hover:text-foreground transition">
                LOOKBOOK
              </Link>
            </div>

            {/* 4. Right Icons */}
            <div className="flex items-center gap-2 lg:gap-2 z-10">
              <NotificationDropdown />
              
              {/* SEARCH TRIGGER */}
              <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:bg-accent"
                  onClick={() => setIsSearchOpen(true)}
              >
                  <Search className="w-5 h-5" />
              </Button>

              {/* SEARCH SHEET CONTENT */}
              <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <SheetContent
                  side="top"
                  className="h-auto min-h-[40vh] max-h-[80vh] overflow-y-auto flex flex-col items-center bg-background/95 backdrop-blur-xl border-b border-border pt-16 pb-10"
                >
                  <SheetTitle className="sr-only">Search Products</SheetTitle>

                  <div className="container mx-auto max-w-2xl w-full">
                    <form
                      onSubmit={handleSearchSubmit}
                      className="relative w-full"
                    >
                      <Search className="absolute ml-2 left-0 top-1/2 -translate-y-1/2 w-8 h-8 text-muted-foreground" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search products..."
                        className="w-full bg-transparent border-b-2 border-border focus:border-foreground text-3xl font-bold py-4 pl-12 pr-12 outline-none placeholder:text-muted-foreground/50 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground animate-spin" />
                      )}
                    </form>

                    <div className="mt-8 w-full space-y-2">
                      {searchResults.length > 0 ? (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-3 mb-4">
                            Top Results
                          </p>
                          {searchResults.map((item) => (
                            <Link
                              key={item.id}
                              href={`/products/${item.slug}`}
                              onClick={() => setIsSearchOpen(false)}
                              className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                            >
                              <div className="w-12 h-16 bg-muted rounded overflow-hidden relative shrink-0">
                                {item.images[0] && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.images[0].image_url}
                                    alt={item.name}
                                    loading="lazy"
                                    className="object-cover w-full h-full"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold truncate text-foreground group-hover:text-primary transition">
                                  {item.name}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {item.category?.name || "Product"}
                                </p>
                              </div>
                              <div className="text-sm font-bold whitespace-nowrap">
                                Rp {displayPrice(item.price).toLocaleString("id-ID")}
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
                        <div className="mt-4"></div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop Cart & Profile */}
              <div className="hidden lg:flex items-center gap-2">
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:bg-accent relative"
                  asChild
                >
                  <Link href="/cart">
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span
                        key={cartCount}
                        className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-in zoom-in duration-300"
                      >
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </Button>

                {/* MODE TOGGLE */}
                <div className="hidden lg:block">
                    <ModeToggle />
                </div>

                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="h-9 w-9 flex items-center justify-center rounded-full bg-muted border-2 border-transparent hover:border-border transition-all duration-200 cursor-pointer">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-64 p-2 bg-background/95 backdrop-blur-xl border-border shadow-2xl rounded-xl"
                    >
                      <DropdownMenuLabel className="font-normal p-3">
                        <div className="flex flex-col space-y-2">
                          <div className="space-y-1">
                            <p className="text-sm font-black leading-none tracking-tight">
                              {user.name}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                          {user.role === "member" && (
                            <div className="flex items-center pt-1">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                                <span className="text-[10px] font-bold tracking-wider">
                                  💎 {user.points} POINTS
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="my-1 opacity-50" />
                      <div className="space-y-1">
                        {user.role === "admin" && (
                          <DropdownMenuItem
                            asChild
                            className="mb-2 bg-red-50 dark:bg-red-950/20 focus:bg-red-100 dark:focus:bg-red-950/40 cursor-pointer rounded-lg"
                          >
                            <Link
                              href="/admin/orders"
                              className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold"
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              <span>Admin Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          asChild
                          className="cursor-pointer rounded-lg focus:bg-accent h-9"
                        >
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-2 w-full font-medium"
                          >
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>Account Settings</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          asChild
                          className="cursor-pointer rounded-lg focus:bg-accent h-9"
                        >
                          <Link
                            href="/wishlist"
                            className="flex items-center justify-between w-full font-medium"
                          >
                            <div className="flex items-center gap-2">
                              <Heart className="w-4 h-4 text-muted-foreground" />
                              <span>Wishlist</span>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          asChild
                          className="cursor-pointer rounded-lg focus:bg-accent h-9"
                        >
                          <Link
                            href="/dashboard/orders"
                            className="flex items-center gap-2 w-full font-medium"
                          >
                            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                            <span>Order History</span>
                          </Link>
                        </DropdownMenuItem>
                      </div>

                      <DropdownMenuSeparator className="my-1 opacity-50" />
                      
                      <DropdownMenuItem
                        className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer rounded-lg h-9 font-bold mt-1"
                        onClick={logout}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span>Logout</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Button
                      asChild
                      variant="default"
                      size="sm"
                      className="font-bold rounded-full px-6"
                    >
                      <Link href="/login">LOGIN</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* --- BOTTOM NAVIGATION BAR (Mobile Only) --- */}
      {/* This part does not need to be wrapped in fixed top header because it is fixed bottom */}
      <div className="fixed bottom-0 left-0 z-50 w-full h-[60px] bg-background/90 backdrop-blur-lg border-t border-border flex items-center justify-around lg:hidden pb-[env(safe-area-inset-bottom)]">
        <Link
          href="/"
          className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground active:scale-95 transition-all"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1">Home</span>
        </Link>
        <Link
          href="/shop"
          className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground active:scale-95 transition-all"
        >
          <Grid className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1">Shop</span>
        </Link>
        <Link
          href="/cart"
          className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground active:scale-95 transition-all relative"
        >
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
        <Link
          href={user ? "/dashboard" : "/login"}
          className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground active:scale-95 transition-all"
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted border border-border">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-[10px] font-bold mt-1">Profile</span>
        </Link>
      </div>
    </>
  );
}