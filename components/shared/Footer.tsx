import Link from "next/link";
import { Instagram, Twitter, Facebook } from "lucide-react"; // Pastikan install lucide-react

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-800 py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* BRAND */}
          <div className="md:col-span-1">
            <Link href="/" className="text-2xl font-black text-white tracking-tighter uppercase mb-4 block">
              HURTSSPACE
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              Redefining streetwear with minimalist cuts and premium materials. 
              Designed in Indonesia, built for the world.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="hover:text-white transition"><Instagram className="w-5 h-5" /></Link>
              <Link href="#" className="hover:text-white transition"><Twitter className="w-5 h-5" /></Link>
              <Link href="#" className="hover:text-white transition"><Facebook className="w-5 h-5" /></Link>
            </div>
          </div>

          {/* LINKS 1 */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Shop</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="/shop" className="hover:text-white transition">All Products</Link></li>
              <li><Link href="/shop?category_id=1" className="hover:text-white transition">T-Shirts</Link></li>
              <li><Link href="/shop?category_id=2" className="hover:text-white transition">Outerwear</Link></li>
              <li><Link href="/lookbook" className="hover:text-white transition">Lookbook</Link></li>
            </ul>
          </div>

          {/* LINKS 2 */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Support</h3>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-white transition">Order Status</Link></li>
              <li><Link href="#" className="hover:text-white transition">Shipping & Returns</Link></li>
              <li><Link href="#" className="hover:text-white transition">Size Guide</Link></li>
              <li><Link href="#" className="hover:text-white transition">FAQ</Link></li>
            </ul>
          </div>

          {/* NEWSLETTER */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Stay in the Loop</h3>
            <p className="text-sm mb-4">Subscribe for exclusive drops and early access.</p>
            <form className="flex gap-2">
                <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="bg-zinc-900 border border-zinc-800 text-white px-4 py-2 text-sm w-full focus:outline-none focus:border-white transition"
                />
                <button className="bg-white text-black px-4 py-2 text-sm font-bold hover:bg-zinc-200 transition">
                    JOIN
                </button>
            </form>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <p>&copy; {new Date().getFullYear()} HURTSSPACE. All rights reserved.</p>
            <div className="flex gap-6">
                <Link href="#" className="hover:text-white transition">Privacy Policy</Link>
                <Link href="#" className="hover:text-white transition">Terms of Service</Link>
            </div>
        </div>
      </div>
    </footer>
  );
}