"use client";

import { useState, useEffect } from "react"; // Tambah useEffect
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AxiosError } from "axios"; 

// Interface buat Kategori
interface Category {
    id: number;
    name: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // State Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [weight, setWeight] = useState("");
  const [category, setCategory] = useState(""); // Default kosong dulu
  const [image, setImage] = useState<File | null>(null);
  const [isCollab, setIsCollab] = useState(false);
  
  const availableSizes = ["S", "M", "L", "XL", "XXL", "ALL SIZE"];
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  // 👇 FETCH KATEGORI DARI DATABASE
  useEffect(() => {
    const fetchCategories = async () => {
        try {
            const res = await api.get("/categories");
            setCategories(res.data.data);
            // Set default select ke kategori pertama kalo ada
            if (res.data.data.length > 0) {
                setCategory(res.data.data[0].id.toString());
            }
        } catch {
            toast.error("Gagal load kategori.");
        } finally {
            setLoadingCategories(false);
        }
    };
    fetchCategories();
  }, []);

  const handleSizeChange = (size: string) => {
    setSelectedSizes(prev => 
        prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!image) return toast.error("Gambar wajib diupload, G!");
    if (selectedSizes.length === 0) return toast.error("Pilih minimal 1 size dong!");
    if (!category) return toast.error("Pilih kategori dulu!");

    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("weight", weight);
    formData.append("category_id", category);
    formData.append("is_collab", isCollab ? "1" : "0");
    formData.append("image", image);
    
    selectedSizes.forEach((size) => {
        formData.append("sizes[]", size); 
    });

    try {
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
    <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-4">
                    
                    <div className="space-y-2">
                        <Label>Product Name</Label>
                        <Input placeholder="Ex: Hurts Oversized Tee" value={name} onChange={e => setName(e.target.value)} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Price (IDR)</Label>
                            <Input type="number" placeholder="150000" value={price} onChange={e => setPrice(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Weight (Gram)</Label>
                            <Input type="number" placeholder="200" value={weight} onChange={e => setWeight(e.target.value)} required />
                        </div>
                    </div>

                    {/* 👇 GANTI INPUT ID JADI DROPDOWN NAMA */}
                    <div className="space-y-2">
                        <Label>Category</Label>
                        {loadingCategories ? (
                            <div className="text-xs text-muted-foreground">Loading categories...</div>
                        ) : (
                            <select 
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                required
                            >
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea placeholder="Detail produk..." value={description} onChange={e => setDescription(e.target.value)} required />
                    </div>

                    <div className="space-y-2">
                        <Label>Main Image</Label>
                        <Input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)} required />
                    </div>

                    <div className="space-y-2">
                        <Label>Available Sizes (Wajib Pilih!)</Label>
                        <div className="flex flex-wrap gap-4 mt-2 border p-4 rounded-md">
                            {availableSizes.map(size => (
                                <div key={size} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`size-${size}`} 
                                        checked={selectedSizes.includes(size)}
                                        onCheckedChange={() => handleSizeChange(size)}
                                    />
                                    <label htmlFor={`size-${size}`} className="text-sm font-medium leading-none cursor-pointer">
                                        {size}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox id="collab" checked={isCollab} onCheckedChange={(c) => setIsCollab(c as boolean)} />
                        <label htmlFor="collab" className="text-sm font-medium leading-none">
                            Is Collaboration Item?
                        </label>
                    </div>

                </CardContent>
            </Card>

            <Button type="submit" disabled={loading} className="w-full font-bold">
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                PUBLISH PRODUCT
            </Button>
        </form>
    </div>
  );
}