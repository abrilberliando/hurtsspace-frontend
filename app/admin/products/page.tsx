"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, PackageOpen } from "lucide-react"; // Tambah icon PackageOpen buat empty state
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge"; // Import Badge biar rapi

interface Product {
  id: number;
  name: string;
  price: number;
  category?: { name: string };
  images: { image_url: string }[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const fetchProducts = useCallback(async () => {
    try {
        const res = await api.get("/products");
        
        // 👇 PERBAIKAN UTAMA DISINI:
        // Cek struktur response. Kalau paginate pake .data.data, kalau get biasa pake .data
        const dataProduk = res.data.data.data || res.data.data || [];
        
        setProducts(dataProduk);
    } catch {
        toast.error("Gagal load produk.");
        setProducts([]); // Set array kosong biar gak error map
    }
  }, []);

  useEffect(() => { 
      fetchProducts(); 
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: number) => {
    // eslint-disable-next-line no-restricted-globals
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
            {/* 👇 SAFETY CHECK: Pastikan products ada isinya sebelum di-map */}
            {products && products.length > 0 ? (
                products.map((item) => (
                    <div 
                        key={item.id} 
                        className="bg-card border border-border rounded-xl overflow-hidden group hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col"
                    >
                        {/* Image Container */}
                        <div className="relative aspect-square bg-muted overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src={item.images?.[0]?.image_url || "/placeholder.png"} 
                                alt={item.name} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>

                        {/* Content */}
                        <div className="p-5 flex-1 flex flex-col gap-4">
                            <div className="space-y-1">
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className="font-bold truncate text-base leading-tight" title={item.name}>
                                        {item.name}
                                    </h3>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Rp {item.price.toLocaleString("id-ID")}
                                    </p>
                                    <Badge variant="secondary" className="text-[10px] font-bold uppercase px-2 h-5">
                                        {item.category?.name || "No Category"}
                                    </Badge>
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
                    <p className="text-sm mb-6">Mulai isi rak toko lo sekarang, G!</p>
                    <Button asChild variant="secondary">
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