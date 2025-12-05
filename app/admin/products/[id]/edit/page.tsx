"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react"; // 👈 Hapus Loader2
import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm"; 
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Skeleton } from "@/components/ui/skeleton";

// Interface Lokal buat Mapping Data
interface APIImage {
    image_url: string;
}

interface APIVariant {
    size: string;
}

// Sesuaikan dengan interface di ProductForm
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
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;
  
  const [loadingForm, setLoadingForm] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // 👇 Ganti 'any' jadi ProductData | null
  const [initialData, setInitialData] = useState<ProductData | null>(null);

  // 1. Fetch Data Produk Lama
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/products/${productId}`); 
        const product = res.data.data;

        // Map data dari API ke format yang dibutuhkan Form
        setInitialData({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          weight: product.weight.toString(),
          category_id: product.category_id.toString(),
          is_collab: !!product.is_collab, // Force boolean
          // 👇 FIX ANY: Kasih tipe data eksplisit di map
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


  // 2. Submit Logic buat UPDATE
  const handleUpdateSubmit = async (formData: FormData, id?: number) => {
    setSubmitting(true);
    try {
        await api.post(`/products/${id}`, formData, { 
            headers: { 
                "Content-Type": "multipart/form-data" 
            }
        });
        
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
                toast.error("Data tidak valid.");
            }
        } else {
            toast.error("Terjadi kesalahan server.");
        }
    } finally {
        setSubmitting(false);
    }
  };

  if (loadingForm || !initialData) {
    return <div className="p-8 max-w-2xl mx-auto"><Skeleton className="h-[600px] w-full" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto pb-10 px-4">
        <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/products"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <h1 className="text-2xl font-bold">Edit Product: {initialData.name}</h1>
        </div>
        
        {/* Panggil komponen form dengan data lama */}
        <ProductForm initialData={initialData} onSubmit={handleUpdateSubmit} isLoading={submitting} />
        
    </div>
  );
}