"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, PackageOpen, Star } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: number;
  name: string;
  price: number;
  category?: { name: string };
  images: { image_url: string }[];
  is_featured: boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const fetchProducts = useCallback(async () => {
    try {
        // 👇 FIX: Tambah timestamp '?t=' biar browser gak nge-cache data lama
        const res = await api.get(`/products?t=${Date.now()}`);
        const dataProduk = res.data.data.data || res.data.data || [];
        setProducts(dataProduk);
    } catch {
        toast.error("Gagal load produk.");
        setProducts([]); 
    }
  }, []);

  useEffect(() => { 
      fetchProducts();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // 👇 FIX: LOGIC OPTIMISTIC UPDATE
  const handleSetFeatured = async (id: number) => {
    // 1. Simpan state lama buat jaga-jaga kalau error (Rollback)
    const originalProducts = [...products];

    // 2. Update UI duluan biar user liatnya instan (Sat-set!)
    const optimisProducts = products.map((item) => ({
        ...item,
        // Yang diklik jadi true, yang lain jadi false (karena cuma boleh 1 featured)
        is_featured: item.id === id
    }));
    setProducts(optimisProducts);

    const toastId = toast.loading("Updating featured drop...");

    try {
        // 3. Tembak API di background
        await api.put(`/products/${id}/featured`);
        toast.dismiss(toastId);
        toast.success("Featured Drop Updated! 🔥");
        
        // Opsional: Fetch ulang buat sinkronisasi data server (silent refresh)
        fetchProducts();
    } catch {
        // 4. Kalau gagal, balikin ke tampilan semula
        toast.dismiss(toastId);
        toast.error("Gagal update status.");
        setProducts(originalProducts);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus produk ini?")) return;
    
    const toastId = toast.loading("Menghapus...");
    try {
        await api.delete(`/products/${id}`);
        toast.dismiss(toastId);
        toast.success("Produk berhasil dihapus.");
        fetchProducts(); 
    } catch {
        toast.dismiss(toastId);
        toast.error("Gagal hapus produk.");
    }
  };

  return (
    <div className="space-y-8 pb-10">
        <div className="flex justify-between items-center border-b border-border pb-6">
            <div>
                <h1 className="text-3xl font-black tracking-tight">Manage Products</h1>
                <p className="text-muted-foreground text-sm mt-1">Atur katalog produk toko lo disini.</p>
            </div>
            <Button asChild size="lg" className="font-bold">
                <Link href="/admin/products/create">
                    <Plus className="w-5 h-5 mr-2" /> Add Product
                </Link>
            </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products && products.length > 0 ? (
                products.map((item) => (
                    <div 
                        key={item.id} 
                        className={`bg-card border rounded-xl overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col
                            ${item.is_featured ? 'border-yellow-500/50 shadow-yellow-500/10' : 'border-border'}
                        `}
                    >
                        {/* Image Container */}
                        <div className="relative aspect-square bg-muted overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src={item.images?.[0]?.image_url || "/placeholder.png"} 
                                alt={item.name} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            />
                            
                            {/* TOMBOL BINTANG (SET FEATURED) */}
                            <button 
                                onClick={() => handleSetFeatured(item.id)}
                                className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg z-10
                                    ${item.is_featured 
                                        ? 'bg-yellow-400 text-black scale-110 ring-4 ring-yellow-400/30' 
                                        : 'bg-black/50 text-white/50 hover:bg-white hover:text-yellow-500 hover:scale-110'}
                                `}
                                title={item.is_featured ? "Currently Featured" : "Set as Featured Drop"}
                            >
                                <Star className={`w-4 h-4 ${item.is_featured ? 'fill-current' : ''}`} />
                            </button>

                            {/* Badge Kategori */}
                            <Badge variant="secondary" className="absolute bottom-2 left-2 text-[10px] font-bold uppercase px-2 h-5 backdrop-blur-md bg-background/80">
                                {item.category?.name || "Uncategorized"}
                            </Badge>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 flex flex-col gap-4">
                            <div className="space-y-1">
                                <h3 className="font-bold truncate text-base leading-tight" title={item.name}>
                                    {item.name}
                                </h3>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Rp {item.price.toLocaleString("id-ID")}
                                    </p>
                                    {item.is_featured && (
                                        <span className="text-[10px] font-black text-yellow-500 border border-yellow-500/30 px-2 py-0.5 rounded uppercase tracking-wider">
                                            Featured
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Buttons Grid */}
                            <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
                                <Button asChild variant="outline" size="sm" className="w-full font-bold hover:bg-secondary">
                                    <Link href={`/admin/products/${item.id}/edit`}>
                                        <Edit className="w-3.5 h-3.5 mr-2" /> Edit
                                    </Link>
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    className="w-full font-bold"
                                    onClick={() => handleDelete(item.id)}
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-24 text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/10">
                    <PackageOpen className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Belum ada produk nih.</p>
                    <Button asChild variant="secondary" className="mt-4">
                        <Link href="/admin/products/create">
                            Buat Produk Pertama
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    </div>
  );
}