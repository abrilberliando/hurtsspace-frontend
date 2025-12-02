import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative w-full h-[85vh] flex items-center justify-center overflow-hidden">
      {/* 1. Background Image Gelap */}
      <div 
        className="absolute inset-0 z-0"
        style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1523396870179-16a196759575?q=80&w=1920&auto=format&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center",
        }}
      >
        {/* Overlay Hitam biar tulisan kebaca */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* 2. Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">
        <p className="text-zinc-300 tracking-[0.3em] text-sm md:text-base mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            EST. 2025 • INDONESIA
        </p>
        
        <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-6 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000">
          REDEFINE <br className="hidden md:block" />
          <span className="text-zinc-500">YOUR</span> STREETWEAR.
        </h1>
        
        <p className="text-zinc-400 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
            Minimalist cuts. Premium materials. 
            Designed for the urban explorer who values silence in the noise.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="bg-white text-black hover:bg-zinc-200 font-bold px-8 py-6 text-lg rounded-none">
                <Link href="/shop">
                    SHOP COLLECTION
                </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black font-bold px-8 py-6 text-lg rounded-none bg-transparent">
                <Link href="/lookbook">
                    VIEW LOOKBOOK
                </Link>
            </Button>
        </div>
      </div>
    </section>
  );
}