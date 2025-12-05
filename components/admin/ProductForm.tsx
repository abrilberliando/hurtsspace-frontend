"use client";

import { useState, useEffect } from "react"; // Tambah useEffect
import api from "@/lib/axios"; // Pastikan import api ada buat fetch kategori
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Loader2, UploadCloud, X, Save } from "lucide-react"; 

// Interface Produk
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

// 👇 Interface Kategori Baru
interface Category {
    id: number;
    name: string;
}

interface ProductFormProps {
    initialData?: ProductData;
    onSubmit: (formData: FormData, productId?: number) => void;
    isLoading: boolean;
}

export default function ProductForm({ initialData, onSubmit, isLoading }: ProductFormProps) {
  // State
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [price, setPrice] = useState(initialData?.price || "");
  const [weight, setWeight] = useState(initialData?.weight || "");
  
  // 👇 State Category (Default string kosong biar user milih)
  const [category, setCategory] = useState(initialData?.category_id || ""); 
  const [categories, setCategories] = useState<Category[]>([]); // List Kategori
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [newImageFiles, setNewImageFiles] = useState<File[]>([]); 
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(initialData?.image_urls || []);
  const [isCollab, setIsCollab] = useState(initialData?.is_collab || false);
  
  const availableSizes = ["S", "M", "L", "XL", "XXL", "ALL SIZE"];
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initialData?.selected_sizes || []);

  const totalImages = existingImageUrls.length + newImageFiles.length;

  // 👇 FETCH KATEGORI DARI DATABASE PAS COMPONENT MOUNT
  useEffect(() => {
    const fetchCategories = async () => {
        try {
            const res = await api.get("/categories");
            setCategories(res.data.data);
            
            // Kalau Create Baru (bukan Edit) dan belum ada kategori dipilih, set default ke yg pertama
            if (!initialData && res.data.data.length > 0 && !category) {
                setCategory(res.data.data[0].id.toString());
            }
        } catch {
            toast.error("Gagal load list kategori.");
        } finally {
            setLoadingCategories(false);
        }
    };
    fetchCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Jalan sekali aja

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewImageFiles(prev => [...prev, ...files]);
    e.target.value = ''; 
  };
  
  const handleRemoveExistingImage = (url: string) => {
    setExistingImageUrls(prev => prev.filter(u => u !== url));
  };
  
  const handleRemoveNewImage = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSizeChange = (size: string) => {
    setSelectedSizes(prev => 
        prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (totalImages === 0) return toast.error("Wajib upload minimal 1 foto!");
    if (selectedSizes.length === 0) return toast.error("Pilih minimal 1 size!");
    if (!category) return toast.error("Pilih kategori dulu!");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("weight", weight);
    formData.append("category_id", category);
    formData.append("is_collab", isCollab ? "1" : "0");
    
    newImageFiles.forEach(file => {
        formData.append("images[]", file);
    });

    existingImageUrls.forEach(url => {
        formData.append("existing_images[]", url);
    });
    
    selectedSizes.forEach((size) => {
        formData.append("sizes[]", size); 
    });

    onSubmit(formData, initialData?.id); 
  };

  return (
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

                {/* 👇 BAGIAN KATEGORI YANG DI-UPGRADE */}
                <div className="space-y-2">
                    <Label>Category</Label>
                    {loadingCategories ? (
                        <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
                    ) : (
                        <select 
                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            required
                        >
                            <option value="" disabled>-- Select Category --</option>
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

                {/* MULTI FILE UPLOAD UI */}
                <div className="space-y-2">
                    <Label>Product Gallery (Max 2MB per file)</Label>
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer relative ${totalImages > 0 ? 'border-green-500/50 bg-green-500/5' : 'border-border hover:bg-muted/50'}`}>
                        <Input 
                            type="file" 
                            accept="image/*" 
                            multiple
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleImageChange}
                        />
                        <div className="text-muted-foreground flex flex-col items-center gap-2">
                            <UploadCloud className="w-8 h-8 opacity-50" />
                            <span className="font-bold text-sm">Click / Drag to Upload Photos ({totalImages} files total)</span>
                            <span className="text-xs">Wajib minimal 1 foto | Max 2MB per file</span>
                        </div>
                    </div>

                    {/* Image Previews */}
                    {totalImages > 0 && (
                        <div className="flex flex-wrap gap-3 pt-3">
                            {existingImageUrls.map((url, index) => (
                                <div key={url} className="relative w-20 h-20 rounded-md overflow-hidden border border-border">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={url} alt={`Existing ${index}`} className="w-full h-full object-cover" />
                                    <Button 
                                        variant="destructive" 
                                        size="icon" 
                                        className="h-4 w-4 absolute top-0 right-0 z-10 p-0 rounded-none" 
                                        onClick={() => handleRemoveExistingImage(url)} 
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                    {index === 0 && <Badge className="absolute bottom-0 left-0 bg-primary/80 text-[8px]">PRIMARY</Badge>}
                                </div>
                            ))}

                            {newImageFiles.map((file, index) => (
                                <div key={`new-${index}`} className="relative w-20 h-20 rounded-md overflow-hidden border border-border">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={URL.createObjectURL(file)} alt={`New ${index}`} className="w-full h-full object-cover opacity-70" />
                                    <Button 
                                        variant="destructive" 
                                        size="icon" 
                                        className="h-4 w-4 absolute top-0 right-0 z-10 p-0 rounded-none" 
                                        onClick={() => handleRemoveNewImage(index)}
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Available Sizes (Wajib Pilih!)</Label>
                    <div className="flex flex-wrap gap-4 mt-2 border p-4 rounded-md border-border">
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

        <Button type="submit" disabled={isLoading} className="w-full font-bold h-12">
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            {initialData ? 'UPDATE PRODUCT' : 'PUBLISH PRODUCT'}
        </Button>
    </form>
  );
}