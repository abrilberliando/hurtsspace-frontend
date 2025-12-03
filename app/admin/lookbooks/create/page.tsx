"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, X, Tag } from "lucide-react";
import { AxiosError } from "axios";

interface Product {
    id: number;
    name: string;
}

interface TagItem {
    id: number;
    product_id: string;
    x: number;
    y: number;
}

export default function CreateLookbookPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  
  const [tags, setTags] = useState<TagItem[]>([]);
  const [isTagging, setIsTagging] = useState(false);
  const [tempCoords, setTempCoords] = useState({ x: 0, y: 0 });
  const [selectedProduct, setSelectedProduct] = useState("");

  useEffect(() => {
    api.get("/products").then(res => setProducts(res.data.data.data));
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setTags([]);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageFile || isTagging) return; // Cegah klik double pas lagi milih
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setTempCoords({ x, y });
    setIsTagging(true);
  };

  const confirmTag = () => {
    if (!selectedProduct) return toast.error("Pilih produknya dulu bos!");
    
    setTags([...tags, { 
        id: Date.now(), 
        product_id: selectedProduct, 
        x: tempCoords.x, 
        y: tempCoords.y 
    }]);
    
    setIsTagging(false);
    setSelectedProduct("");
  };

  const handleSubmit = async () => {
    if (!title || !imageFile || tags.length === 0) return toast.error("Lengkapi data & tag minimal 1 produk!");
    
    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("image", imageFile);
    
    // Convert array tags ke JSON string yang valid
    const itemsData = tags.map(t => ({ product_id: t.product_id, x: t.x, y: t.y }));
    formData.append("items", JSON.stringify(itemsData));

    try {
        await api.post("/admin/lookbooks", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Lookbook Created!");
        router.push("/admin/lookbooks");
    } catch (error) {
        const err = error as AxiosError;
        toast.error("Gagal create lookbook. Cek console.");
        console.error(err.response?.data);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KIRI: CANVAS IMAGE TAGGING */}
        <div className="lg:col-span-2">
            <Card className="bg-card border-border overflow-hidden shadow-sm">
                <CardContent className="p-0 relative bg-zinc-950 flex items-center justify-center min-h-[500px]">
                    {imagePreview ? (
                        <div className="relative w-full h-full cursor-crosshair group select-none" onClick={handleImageClick}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imagePreview} className="w-full h-auto object-contain max-h-[80vh]" alt="Preview" />
                            
                            {/* Render Tags */}
                            {tags.map((tag) => (
                                <div 
                                    key={tag.id}
                                    className="absolute w-8 h-8 bg-white/90 backdrop-blur rounded-full border-2 border-zinc-900 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-sm font-bold text-zinc-900 shadow-xl z-10"
                                    style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                                >
                                    <Tag className="w-3 h-3" />
                                    {/* Tooltip Hover */}
                                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap hidden group-hover:block z-20">
                                        {products.find(p => p.id.toString() === tag.product_id)?.name}
                                    </div>
                                </div>
                            ))}

                            {/* UI TAGGING MENU (POPUP LEBIH RAPI) */}
                            {isTagging && (
                                <div 
                                    className="absolute z-50 transform -translate-x-1/2 mt-4"
                                    style={{ left: `${tempCoords.x}%`, top: `${tempCoords.y}%` }}
                                    onClick={(e) => e.stopPropagation()} // Biar gak close pas klik form
                                >
                                    <div className="w-64 bg-background border border-border shadow-2xl rounded-lg p-4 animate-in zoom-in-95 duration-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-bold text-sm">Select Product</h4>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsTagging(false)}>
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        
                                        <select 
                                            className="w-full bg-muted border border-input rounded-md px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-ring outline-none"
                                            value={selectedProduct}
                                            onChange={e => setSelectedProduct(e.target.value)}
                                            autoFocus
                                        >
                                            <option value="">-- Choose Item --</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>

                                        <Button size="sm" className="w-full font-bold" onClick={confirmTag}>
                                            <Plus className="w-3 h-3 mr-2" /> ADD TAG
                                        </Button>
                                    </div>
                                    
                                    {/* Titik indikator posisi */}
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white animate-ping" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-muted-foreground flex flex-col items-center gap-2">
                            <Tag className="w-10 h-10 opacity-20" />
                            <p>Upload image to start tagging</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground mt-3 text-center">
                Click anywhere on the product in the image to add a shopping tag.
            </p>
        </div>

        {/* KANAN: FORM INPUT */}
        <div className="space-y-6">
            <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-4">
                    <h2 className="font-bold text-xl mb-4">Lookbook Info</h2>
                    
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input placeholder="Ex: Summer Vibe 2025" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label>Image</Label>
                        <Input type="file" accept="image/*" onChange={handleImageChange} className="cursor-pointer" />
                    </div>

                    {/* List Tags */}
                    <div className="space-y-3 pt-4 border-t border-border">
                        <Label>Tagged Items ({tags.length})</Label>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {tags.length === 0 && <p className="text-xs text-muted-foreground italic">No items tagged yet.</p>}
                            
                            {tags.map(tag => {
                                const prodName = products.find(p => p.id.toString() === tag.product_id)?.name || "Unknown";
                                return (
                                    <div key={tag.id} className="flex justify-between items-center text-sm p-3 border border-border rounded-md bg-muted/30">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <Tag className="w-3 h-3 text-muted-foreground shrink-0" />
                                            <span className="truncate font-medium">{prodName}</span>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 text-muted-foreground hover:text-red-500"
                                            onClick={() => setTags(tags.filter(t => t.id !== tag.id))}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <Button className="w-full font-bold mt-4" disabled={loading} onClick={handleSubmit}>
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
                        PUBLISH
                    </Button>

                </CardContent>
            </Card>
        </div>
    </div>
  );
}