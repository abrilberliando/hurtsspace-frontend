"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Save, MoveLeft, MoveRight, Star, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";

// --- INTERFACES ---
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

interface Category {
  id: number;
  name: string;
}

interface GalleryItem {
  id: string;
  type: "EXISTING" | "NEW";
  file?: File;
  url?: string;
  preview: string;
}

interface ProductFormProps {
  initialData?: ProductData | null;
  onSubmit: (formData: FormData, productId?: number) => void;
  isLoading: boolean;
}

export default function ProductForm({ initialData, onSubmit, isLoading }: ProductFormProps) {
  // --- STATE ---
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [price, setPrice] = useState(initialData?.price || "");
  const [weight, setWeight] = useState(initialData?.weight || "");
  const [stock, setStock] = useState(initialData?.stock || "");
  const [category, setCategory] = useState(initialData?.category_id?.toString() || "");
  const [isCollab, setIsCollab] = useState(initialData?.is_collab || false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initialData?.selected_sizes || []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const availableSizes = ["S", "M", "L", "XL", "XXL", "ALL SIZE"];

  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    if (initialData?.image_urls) {
      return initialData.image_urls.map((url, idx) => {
        let previewUrl = url;
        if (!url.startsWith("http")) {
          previewUrl = `http://localhost:8000${url.startsWith("/") ? "" : "/"}${url}`;
        }
        return {
          id: `existing-${idx}`,
          type: "EXISTING",
          url: url,
          preview: previewUrl,
        };
      });
    }
    return [];
  });

  useEffect(() => {
    return () => {
      gallery.forEach((item) => {
        if (item.type === "NEW" && item.preview) URL.revokeObjectURL(item.preview);
      });
    };
  }, [gallery]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        setCategories(res.data.data);
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
  }, []);

  // --- HANDLERS ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles: GalleryItem[] = [];
      for (const file of filesArray) {
        if (file.size > 3 * 1024 * 1024) {
          toast.error(`Ukuran gambar ${file.name} melebihi 3MB.`);
          continue;
        }
        if (!file.type.startsWith('image/')) {
          toast.error(`File ${file.name} bukan gambar.`);
          continue;
        }
        validFiles.push({
          id: `new-${Date.now()}-${Math.random()}`,
          type: "NEW",
          file: file,
          preview: URL.createObjectURL(file),
        });
      }
      if (validFiles.length > 0) {
        setGallery((prev) => [...prev, ...validFiles]);
      }
      e.target.value = "";
    }
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    const newIndex = direction === "left" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= gallery.length) return;
    const newGallery = [...gallery];
    [newGallery[index], newGallery[newIndex]] = [newGallery[newIndex], newGallery[index]];
    setGallery(newGallery);
  };

  const removeImage = (index: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSizeChange = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // --- SUBMIT LOGIC (MAJOR UPDATE) ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (gallery.length === 0) return toast.error("Wajib upload minimal 1 foto!");
    if (selectedSizes.length === 0) return toast.error("Pilih minimal 1 size!");
    if (!category) return toast.error("Pilih kategori dulu!");

    const formData = new FormData();
    if (initialData) formData.append("_method", "PUT");

    // Only send fields that actually changed
    if (!initialData || name !== initialData.name) formData.append("name", name);
    if (!initialData || description !== initialData.description) formData.append("description", description);
    if (!initialData || price !== initialData.price) formData.append("price", price);
    if (!initialData || weight !== initialData.weight) formData.append("weight", weight);
    
    // stock can be optional
    const currentStock = stock || "";
    const initialStock = initialData?.stock || "";
    if (!initialData || currentStock !== initialStock) formData.append("stock", currentStock);
    
    if (!initialData || category !== initialData.category_id?.toString()) formData.append("category_id", category);
    if (!initialData || isCollab !== initialData.is_collab) formData.append("is_collab", isCollab ? "1" : "0");

    // For sizes
    const initialSizes = initialData?.selected_sizes || [];
    const sizesChanged = !initialData || selectedSizes.length !== initialSizes.length || !selectedSizes.every(s => initialSizes.includes(s));
    if (sizesChanged) {
      selectedSizes.forEach((size) => formData.append("sizes[]", size));
    }

    // For images
    const initialUrls = initialData?.image_urls || [];
    const hasNewImages = gallery.some(g => g.type === "NEW");
    const imagesChanged = !initialData || hasNewImages || initialUrls.length !== gallery.length || !initialUrls.every((url, i) => url === gallery[i].url);

    if (imagesChanged) {
      let newImageIndexCounter = 0;
      gallery.forEach((item) => {
          if (item.type === "EXISTING" && item.url) {
              formData.append("image_order[]", `existing|${item.url}`);
              formData.append("existing_images[]", item.url);
          } 
          else if (item.type === "NEW" && item.file) {
              formData.append("images[]", item.file);
              formData.append("image_order[]", `new|${newImageIndexCounter}`);
              newImageIndexCounter++;
          }
      });
    }

    // Jika update dan tidak ada yang berubah, langsung sukses
    if (initialData && Array.from(formData.keys()).length === 1 && formData.get("_method") === "PUT") {
      toast.success("Tidak ada perubahan data.");
      onSubmit(formData, initialData.id); // Trigger close/redirect aja
      return;
    }

    onSubmit(formData, initialData?.id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-36 md:pb-0">
      
      {/* SECTION 1: GALLERY */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <Label className="text-base font-bold">Product Gallery</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Urutkan foto sesuai keinginan. <strong>Foto pertama = Cover Utama.</strong>
            </p>
          </div>
          <Badge variant="secondary" className="h-6">{gallery.length} Items</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gallery.map((item, index) => (
            <div key={item.id} className={`group relative aspect-square rounded-xl overflow-hidden border bg-muted transition-all ${index === 0 ? "ring-2 ring-primary ring-offset-2" : "border-border"}`}>
              <Image src={item.preview} alt="preview" fill className="object-cover" unoptimized={true} />

              {index === 0 && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> UTAMA
                </div>
              )}
              {item.type === "NEW" && (
                <div className="absolute bottom-0 left-0 right-0 bg-green-500/90 text-white text-[10px] font-bold text-center py-1">BARU</div>
              )}

              {/* OVERLAY CONTROLS */}
              <div className="absolute inset-0 bg-black/40 transition-opacity flex flex-col items-center justify-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                <div className="flex items-center gap-2">
                  {index > 0 && (
                    <Button type="button" size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-sm bg-white/90 text-black hover:bg-white dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700" onClick={() => moveImage(index, "left")}>
                      <MoveLeft className="w-4 h-4" />
                    </Button>
                  )}
                  <Button type="button" size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-md border border-white/20" onClick={() => removeImage(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                  {index < gallery.length - 1 && (
                    <Button type="button" size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-sm bg-white/90 text-black hover:bg-white dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700" onClick={() => moveImage(index, "right")}>
                      <MoveRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all active:scale-95 bg-muted/30">
            <div className="bg-background p-3 rounded-full shadow-sm border mb-2"><Plus className="w-5 h-5 text-primary" /></div>
            <span className="text-xs font-semibold text-muted-foreground">Tambah Foto</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        </div>
      </div>

      <div className="h-px bg-border my-6" />

      {/* SECTION 2: INFO & SECTION 3: ATTRIBUTES (Sama persis kayak sebelumnya, dipersingkat biar gak kepanjangan) */}
      <div className="grid gap-6">
        <div className="space-y-2"><Label>Nama Produk</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Kategori</Label>
                {loadingCategories ? <div className="h-10 bg-muted animate-pulse rounded" /> : 
                <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent></Select>}
             </div>
             <div className="space-y-2"><Label>Stok</Label><Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Harga</Label><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Berat</Label><Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} required /></div>
        </div>
        <div className="space-y-2"><Label>Deskripsi</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} required className="min-h-[120px]" /></div>
      </div>

      <div className="h-px bg-border my-6" />

      <div className="space-y-4">
        <div className="space-y-3"><Label>Pilih Ukuran</Label><div className="flex flex-wrap gap-3">{availableSizes.map(s => <div key={s} className="flex items-center space-x-2 border rounded-md px-3 py-2 bg-muted/20"><Checkbox id={`s-${s}`} checked={selectedSizes.includes(s)} onCheckedChange={() => handleSizeChange(s)} /><label htmlFor={`s-${s}`} className="text-sm font-medium cursor-pointer">{s}</label></div>)}</div></div>
        <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/10"><div className="space-y-0.5"><Label className="text-base">Kolaborasi?</Label></div><Switch checked={isCollab} onCheckedChange={setIsCollab} /></div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t static md:border-0 md:p-0 md:bg-transparent z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] md:shadow-none">
        <div className="max-w-3xl mx-auto"><Button type="submit" disabled={isLoading} className="w-full font-bold h-12 text-base shadow-lg">{isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}{initialData ? "SIMPAN PERUBAHAN" : "PUBLISH PRODUK"}</Button></div>
      </div>
    </form>
  );
}