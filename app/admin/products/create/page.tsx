"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm"; 
import { toast } from "sonner";
import { AxiosError } from "axios";

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Submit Logic
  const handleCreateSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
        // Tembak API
        await api.post("/products", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        
        toast.success("Produk Berhasil Ditambahkan!");
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
        setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-10 px-4">
        <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/products"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Add New Product</h1>
                <p className="text-sm text-muted-foreground">Upload foto terbaik lo biar cepet laku.</p>
            </div>
        </div>
        
        <ProductForm onSubmit={handleCreateSubmit} isLoading={loading} />
        
    </div>
  );
}