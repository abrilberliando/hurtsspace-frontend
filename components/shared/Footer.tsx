"use client";

import Link from "next/link";
import { Instagram, HelpCircle } from "lucide-react";
import { memo } from "react";
import { usePathname } from "next/navigation";

// --- Custom Icons Fixed ---

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);


// --- Main Component ---

const Footer = memo(function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  if (pathname === '/links' || pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-black text-white pt-20 pb-10 border-t border-zinc-900">
      {/* Container gw persempit jadi max-w-6xl biar lebih center & compact */}
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* GRID LAYOUT: Kiri (Brand) & Kanan (Links) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 mb-20">
          
          {/* KOLOM 1: BRAND & SOCIALS (Lebih compact) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Link href="/" className="text-3xl font-black tracking-tighter uppercase">
              HURTSSPACE.
            </Link>
            
            {/* Social Media Icons */}
            <div className="flex items-center gap-5">
              <Link href="#" aria-label="Instagram" className="hover:text-zinc-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="#" aria-label="Tiktok" className="hover:text-zinc-400 transition-colors">
                <TiktokIcon className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* KOLOM 2-4: LINKS GROUP */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
            
            {/* GROUP 1: ACCOUNT & SHOP */}
            <div>
              <h3 className="font-bold uppercase mb-6 tracking-wide text-sm">Account & Shop</h3>
              <ul className="space-y-3 text-zinc-400 text-sm font-medium">
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">Login / Create Account</Link>
                </li>
                <li>
                  <Link href="/shop" className="hover:text-white transition-colors">Shop All</Link>
                </li>
                <li>
                  <Link href="/lookbook" className="hover:text-white transition-colors">Lookbook</Link>
                </li>
              </ul>
            </div>

            {/* GROUP 2: SUPPORT */}
            <div>
              <h3 className="font-bold uppercase mb-6 tracking-wide text-sm">Support</h3>
              <ul className="space-y-3 text-zinc-400 text-sm font-medium">
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
                </li>
                <li>
                  <Link href="/product-care" className="hover:text-white transition-colors">Product Care</Link>
                </li>
                <li>
                  <Link href="/shipping" className="hover:text-white transition-colors">Shipping & Returns</Link>
                </li>
              </ul>
            </div>

            {/* GROUP 3: LEGAL */}
            <div>
              <h3 className="font-bold uppercase mb-6 tracking-wide text-sm">Legal</h3>
              <ul className="space-y-3 text-zinc-400 text-sm font-medium">
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500 font-medium tracking-wide">
          <p>&copy; {currentYear} HURTSSPACE. CLOTHING.</p>
        </div>
        
      </div>
    </footer>
  );
});

export default Footer;