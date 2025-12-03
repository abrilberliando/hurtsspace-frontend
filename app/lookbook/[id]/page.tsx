"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
// 👇 IMPORT YANG BENAR (Hapus Skeleton, Tambah Loader2)
import { Loader2, Plus, X } from "lucide-react"; 
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface Product { id: number; name: string; price: number; slug: string; images: { image_url: string }[]; }
interface LookbookItem { id: number; x_position: number; y_position: number; product: Product; }
interface LookbookDetail { id: number; title: string; image_url: string; items: LookbookItem[]; }

export default function LookbookDetailPage() {
  const { id } = useParams();
  const [lookbook, setLookbook] = useState<LookbookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePoint, setActivePoint] = useState<number | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/lookbooks/${id}`);
        setLookbook(res.data.data);
      } catch { console.error("Gagal load detail"); } 
      finally { setLoading(false); }
    };
    if(id) fetchDetail();
  }, [id]);

  if (loading) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-white w-10 h-10" /></div>;
  if (!lookbook) return <div className="h-screen bg-black flex items-center justify-center text-white">Not Found</div>;

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col md:flex-row items-center justify-center relative overflow-hidden">
      
      <Link href="/lookbook" className="absolute top-6 right-6 z-50 text-white/50 hover:text-white transition">
        <X className="w-8 h-8" />
      </Link>

      <div className="relative w-full max-w-3xl aspect-[3/4] md:aspect-auto md:h-[90vh] bg-zinc-900 shadow-2xl rounded-lg overflow-hidden group">
        
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
            src={lookbook.image_url} 
            alt={lookbook.title} 
            className="w-full h-full object-contain md:object-cover"
        />

        {lookbook.items.map((item) => (
            <Popover key={item.id} open={activePoint === item.id} onOpenChange={(open) => setActivePoint(open ? item.id : null)}>
                <PopoverTrigger asChild>
                    <button
                        className={`absolute w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 z-20
                            ${activePoint === item.id 
                                ? 'bg-white text-black scale-110 rotate-45' 
                                : 'bg-black/30 backdrop-blur-md border border-white/50 text-white hover:bg-white hover:text-black hover:scale-110'}
                        `}
                        style={{
                            top: `${item.y_position}%`,
                            left: `${item.x_position}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        <Plus className="w-4 h-4 md:w-5 md:h-5" />
                        
                        {activePoint !== item.id && (
                            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-20 animate-ping"></span>
                        )}
                    </button>
                </PopoverTrigger>
                
                <PopoverContent 
                    className="w-72 p-0 bg-background/95 backdrop-blur-xl border-border shadow-2xl rounded-xl overflow-hidden animate-in zoom-in-95 duration-200" 
                    sideOffset={15}
                    side="top"
                >
                    <div className="flex gap-4 p-4 items-center">
                        {/* Fix: ganti flex-shrink-0 jadi shrink-0 biar tailwind seneng */}
                        <div className="w-20 h-24 bg-muted rounded-md overflow-hidden shrink-0 border border-border/50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.product.images[0]?.image_url} className="w-full h-full object-cover" alt={item.product.name} />
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                            <h4 className="font-bold text-sm leading-tight truncate">{item.product.name}</h4>
                            <p className="text-sm font-medium text-muted-foreground">Rp {item.product.price.toLocaleString()}</p>
                            <Button size="sm" className="mt-2 w-full font-bold text-xs h-8" asChild>
                                <Link href={`/products/${item.product.slug}`}>
                                    SHOP NOW
                                </Link>
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        ))}

        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
            <h1 className="text-white font-black uppercase text-2xl md:text-4xl tracking-tighter">
                {lookbook.title}
            </h1>
            <p className="text-white/60 text-sm mt-1">Tap the dots to shop the look.</p>
        </div>

      </div>
    </main>
  );
}