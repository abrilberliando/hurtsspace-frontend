"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AxiosError } from "axios";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import ProductForm from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// --- INTERFACES ---
interface APIImage {
  image_url: string;
}

interface APIVariant {
  size: string;
}

interface ProductData {
  id?: number;
  name: string;
  description: string;
  price: string;
  weight: string;
  category_id: string;
  is_collab: boolean;
  image_urls: string[];
  selected_sizes: string[];
  stock?: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;
  
  const [loadingForm, setLoadingForm] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<ProductData | null>(null);

  // 1. Fetch Data Produk Lama
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/products/${productId}`); 
        const product = res.data.data;

        setInitialData({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          weight: product.weight.toString(),
          stock: product.stock ? product.stock.toString() : "",
          category_id: product.category_id.toString(),
          is_collab: !!product.is_collab, 
          image_urls: product.images.map((img: APIImage) => img.image_url),
          selected_sizes: product.variants.map((v: APIVariant) => v.size),
        });
      } catch {
        toast.error("Gagal memuat data produk lama.");
        router.push("/admin/products"); 
      } finally {
        setLoadingForm(false);
      }
    };

    if (productId) fetchData();
  }, [productId, router]);

  // 2. Submit Logic (Update)
  const handleUpdateSubmit = async (formData: FormData, id?: number) => {
    setSubmitting(true);
    try {
        // Method Spoofing untuk Laravel (Wajib)
        formData.set("_method", "PUT"); 

        await api.post(`admin/products/${id}`, formData);

        toast.success("Produk Berhasil Diupdate!");
        router.push("/admin/products");

    } catch (error) {
        const err = error as AxiosError<{ message: string, errors?: Record<string, string[]> }>;
        
        if (err.response?.status === 422) {
            const errorData = err.response.data.errors;
            if (errorData) {
                const firstErrorKey = Object.keys(errorData)[0];
                const firstErrorMessage = errorData[firstErrorKey][0];
                toast.error(`Gagal: ${firstErrorMessage}`);
            } else {
                toast.error("Data tidak valid, periksa kembali inputan.");
            }
        } else if (err.response?.status === 404) {
             toast.error("Produk tidak ditemukan.");
        } else if (err.response?.status === 413) {
            toast.error("File terlalu besar (Max server limit).");
        } else {
            toast.error("Terjadi kesalahan server. Coba lagi nanti.");
        }
    } finally {
        setSubmitting(false);
    }
  };

  // 3. Loading State
  if (loadingForm || !initialData) {
    return (
        <div className="max-w-3xl mx-auto pb-10 px-4 space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-40" />
                </div>
            </div>
            <Skeleton className="h-[600px] w-full rounded-xl border border-border bg-card" />
        </div>
    );
  }

  // 4. Render UI
  return (
    <div className="max-w-3xl mx-auto pb-10 px-4">
        <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild className="hover:bg-muted">
                <Link href="/admin/products"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
                <p className="text-sm text-muted-foreground">
                    Perbarui informasi produk: <span className="font-semibold text-foreground">{initialData.name}</span>
                </p>
            </div>
        </div>
        
        <ProductForm 
            initialData={initialData} 
            onSubmit={handleUpdateSubmit} 
            isLoading={submitting} 
        />
    </div>
  );
}