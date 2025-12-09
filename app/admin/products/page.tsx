"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, PackageOpen, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AxiosError } from "axios"; 

// 👇 IMPORT KOMPONEN ALERT DIALOG DARI SHADCN
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface Product {
    id: number;
    name: string;
    price: number | string;
    category?: { name: string };
    images: { image_url: string }[];
    is_featured: boolean | number; 
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [targetProductId, setTargetProductId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);


    const fetchProducts = useCallback(async () => {
        try {
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
    }, [fetchProducts]); 

    const formatPrice = (price: number | string) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Number(price));
    };

    const handleSetFeatured = async (id: number) => {
        const originalProducts = [...products];

        const optimisProducts = products.map((item) => {
            if (item.id === id) {
                return { ...item, is_featured: !item.is_featured };
            }
            return item;
        });
        setProducts(optimisProducts);

        const isNowFeatured = optimisProducts.find(p => p.id === id)?.is_featured;

        try {
            await api.put(`admin/products/${id}/featured`);
            
            if (isNowFeatured) {
                toast.success("Produk jadi Featured! 🌟");
            } else {
                toast.success("Featured dihapus.");
            }
        } catch (error) { 
            const err = error as AxiosError<{ message: string }>;

            if (err.response && err.response.status === 422) {
                const errorMessage = err.response.data.message || "Gagal karena slot penuh.";
                toast.error(errorMessage);
            } else {
                toast.error("Gagal update status.");
            }
            setProducts(originalProducts);
        }
    };

    const openDeleteDialog = (id: number) => {
        setTargetProductId(id);
        setIsDialogOpen(true);
    };

    const executeDelete = async () => {
        if (!targetProductId) return;

        setIsDeleting(true);
        const toastId = toast.loading(`Menghapus produk ID: ${targetProductId}...`);

        try {
            await api.delete(`admin/products/${targetProductId}`);
            
            setProducts(prev => prev.filter(p => p.id !== targetProductId));
            
            toast.success("Produk berhasil dihapus.");
        } catch {
            toast.error("Gagal hapus produk.");
        } finally {
            toast.dismiss(toastId);
            setIsDeleting(false);
            setIsDialogOpen(false);
            setTargetProductId(null);
        }
    };

    const targetProductName = products.find(p => p.id === targetProductId)?.name || "produk ini";


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

            {/* PRODUCT GRID */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
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
                                
                                {/* TOMBOL BINTANG */}
                                <button 
                                    onClick={() => handleSetFeatured(item.id)}
                                    className={`absolute top-2 right-2 p-1.5 md:p-2 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg z-10
                                        ${item.is_featured 
                                            ? 'bg-yellow-400 text-black scale-110 ring-2 md:ring-4 ring-yellow-400/30' 
                                            : 'bg-black/50 text-white/50 hover:bg-white hover:text-yellow-500 hover:scale-110'}
                                    `}
                                >
                                    <Star className={`w-3.5 h-3.5 md:w-4 md:h-4 ${item.is_featured ? 'fill-current' : ''}`} />
                                </button>

                                {/* Badge Kategori */}
                                <Badge variant="secondary" className="absolute bottom-2 left-2 text-[8px] md:text-[10px] font-bold uppercase px-1.5 md:px-2 h-4 md:h-5 backdrop-blur-md bg-background/80">
                                    {item.category?.name || "Uncategorized"}
                                </Badge>
                            </div>

                            {/* Content */}
                            <div className="p-3 sm:p-5 flex-1 flex flex-col gap-3 md:gap-4">
                                <div className="space-y-1">
                                    <h3 className="font-bold truncate text-sm md:text-base leading-tight" title={item.name}>
                                        {item.name}
                                    </h3>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                        <p className="text-xs md:text-sm font-bold text-foreground">
                                            {formatPrice(item.price)}
                                        </p>
                                        
                                        {!!item.is_featured && (
                                            <span className="w-fit text-[8px] md:text-[10px] font-black text-yellow-500 border border-yellow-500/30 px-1.5 md:px-2 py-0.5 rounded uppercase tracking-wider">
                                                Featured
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Buttons Grid */}
                                <div className="grid grid-cols-2 gap-2 md:gap-3 mt-auto pt-2">
                                    <Button asChild variant="outline" size="sm" className="w-full h-8 md:h-9 text-xs md:text-sm font-bold hover:bg-secondary px-0 md:px-3">
                                        <Link href={`/admin/products/${item.id}/edit`}>
                                            <Edit className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-2" /> 
                                            <span className="hidden sm:inline">Edit</span>
                                            <span className="sm:hidden">Edit</span>
                                        </Link>
                                    </Button>
                                    <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        className="w-full h-8 md:h-9 text-xs md:text-sm font-bold px-0 md:px-3"
                                        onClick={() => openDeleteDialog(item.id)}
                                    >
                                        <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-2" /> 
                                        <span className="hidden sm:inline">Delete</span>
                                        <span className="sm:hidden">Del</span>
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

            {/* 👇 KOMPONEN ALERT DIALOG KONFIRMASI (FINAL MOBILE FIX) */}
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogContent className="w-[90%] max-w-sm rounded-xl"> {/* 👈 FIX: Lebar responsif di mobile */}
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus {targetProductName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan menghapus produk <strong>{targetProductName}</strong> secara permanen dari database. Apakah kamu yakin ingin melanjutkan?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-2"> {/* 👈 FIX: Tombol ditumpuk di mobile */}
                        <AlertDialogCancel 
                            onClick={() => setIsDialogOpen(false)} 
                            disabled={isDeleting}
                            className="sm:w-auto w-full"
                        >
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={executeDelete} 
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90  w-full sm:w-auto" 
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Hapus
                                </>
                            ) : (
                                "Hapus"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}