"use client";

import Link from "next/link";
import { Search, ShoppingBag, Menu } from "lucide-react";
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

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Nanti ganti pake Auth Zustand

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-foreground hover:bg-accent">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-background border-r border-border">
                    <div className="flex flex-col gap-6 mt-10 text-lg font-bold text-foreground">
                        <Link href="/" className="hover:text-primary transition">HOME</Link>
                        <Link href="/shop" className="hover:text-primary transition">SHOP</Link>
                        <Link href="/collab" className="hover:text-primary transition">COLLAB</Link>
                        <Link href="/lookbook" className="hover:text-primary transition">LOOKBOOK</Link>
                    </div>
                </SheetContent>
            </Sheet>
        </div>

        {/* 2. LOGO TENGAH (Adaptive Color) */}
        <Link href="/" className="text-2xl font-black tracking-tighter text-foreground hover:opacity-80 transition">
          HURTSSPACE
        </Link>

        {/* 3. Desktop Menu */}
        <div className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition">HOME</Link>
          <Link href="/shop" className="hover:text-foreground transition">SHOP</Link>
          <Link href="/collab" className="hover:text-red-500 transition text-red-500">COLLAB</Link>
          <Link href="/lookbook" className="hover:text-foreground transition">LOOKBOOK</Link>
        </div>

        {/* 4. Right Icons */}
        <div className="flex items-center gap-2">
            
            {/* Toggle Dark/Light Mode */}
            <ModeToggle />

            {/* Search (Desktop Only) */}
            <div className="hidden md:flex items-center bg-muted/50 rounded-full px-3 py-1 border border-border focus-within:border-primary transition">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    className="bg-transparent border-none focus:outline-none text-sm text-foreground px-2 w-24 focus:w-40 transition-all placeholder:text-muted-foreground"
                />
            </div>

            {/* Cart Icon */}
            <Button variant="ghost" size="icon" className="text-foreground hover:bg-accent relative">
                <ShoppingBag className="w-5 h-5" />
                {/* Badge Cart Count */}
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* User Profile / Login */}
            {isLoggedIn ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="h-8 w-8 cursor-pointer border border-border">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border-border w-48">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">Orders</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500 cursor-pointer focus:text-red-500 focus:bg-red-100 dark:focus:bg-red-900/20">
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
    </nav>
  );
}