"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

interface Lookbook {
  id: number;
  title: string;
  image_url: string;
}

export default function LookbookListPage() {
  const [lookbooks, setLookbooks] = useState<Lookbook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLookbooks = async () => {
      try {
        const res = await api.get("/lookbooks");
        setLookbooks(res.data.data);
      } catch {
        console.error("Gagal load lookbook");
      } finally {
        setLoading(false);
      }
    };
    fetchLookbooks();
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground pt-10 pb-20">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-12 text-center">
          The Lookbook
        </h1>

        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Skeleton className="aspect-3/4 w-full" />
              <Skeleton className="aspect-3/4 w-full" />
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {lookbooks.map((item) => (
              <Link key={item.id} href={`/lookbook/${item.id}`} className="group relative block overflow-hidden">
                <div className="relative aspect-3/4 bg-muted">
                   <img 
                      src={item.image_url} 
                      alt={item.title} 
                      className="object-cover w-full h-full group-hover:scale-105 transition duration-700 ease-in-out filter brightness-75 group-hover:brightness-100" 
                   />
                   
                   {/* Title Overlay */}
                   <div className="absolute bottom-0 left-0 p-8">
                      <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2 translate-y-4 group-hover:translate-y-0 transition duration-500">
                        {item.title}
                      </h2>
                      <div className="flex items-center gap-2 text-white opacity-0 group-hover:opacity-100 transition duration-500 delay-100">
                        <span className="font-bold text-sm">VIEW STYLE</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                   </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}