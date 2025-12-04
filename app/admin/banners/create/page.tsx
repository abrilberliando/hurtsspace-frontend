"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeft, UploadCloud } from "lucide-react";
import { AxiosError } from "axios";
import Link from "next/link";

export default function CreateBannerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [position, setPosition] = useState("1"); // Default Posisi 1 (Utama)
  const [linkUrl, setLinkUrl] = useState("/shop");
  const [imageLeft, setImageLeft] = useState<File | null>(null);
  const [imageRight, setImageRight] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageLeft || !imageRight) return toast.error("Wajib upload kedua gambar (Kiri & Kanan)!");

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("position", position); // Kirim data posisi
    formData.append("link_url", linkUrl);
    formData.append("image_left", imageLeft);
    formData.append("image_right", imageRight);

    try {
        await api.post("/admin/banners", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Banner berhasil dipublish!");
        router.push("/admin/banners");
    } catch (error) {
        const err = error as AxiosError<{ message: string }>;
        toast.error(err.response?.data?.message || "Gagal upload banner.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-10 px-4">
        <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/banners">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
            </Button>
            <h1 className="text-2xl font-bold">Create Split Banner</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-4">
                    
                    {/* Grid Responsif: Judul & Posisi */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-2">
                            <Label>Campaign Title</Label>
                            <Input 
                                placeholder="Ex: CORE NEW SEASON" 
                                className="uppercase font-black text-lg"
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Position</Label>
                            <select 
                                className="w-full h-10 bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                value={position}
                                onChange={e => setPosition(e.target.value)}
                            >
                                <option value="1">Slot 1 (Hero/Atas)</option>
                                <option value="2">Slot 2 (Tengah/Bawah)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Target Link URL</Label>
                        <Input 
                            placeholder="/shop?collection=new" 
                            value={linkUrl} 
                            onChange={e => setLinkUrl(e.target.value)} 
                            required 
                        />
                        <p className="text-[10px] text-muted-foreground">Contoh: /shop, /lookbook, atau /products/nama-slug</p>
                    </div>

                    {/* Area Upload Gambar */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        {/* Kiri */}
                        <div className="space-y-2">
                            <Label>Left Image (Portrait)</Label>
                            <div className={`border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer relative h-40 flex flex-col items-center justify-center ${imageLeft ? 'border-green-500 bg-green-500/5' : 'border-border hover:bg-muted/50'}`}>
                                <Input 
                                    type="file" 
                                    accept="image/*" 
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    onChange={e => setImageLeft(e.target.files?.[0] || null)} 
                                    required 
                                />
                                {imageLeft ? (
                                    <div className="text-xs font-bold text-green-600 truncate max-w-full px-2">
                                        {imageLeft.name}
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground flex flex-col items-center gap-2">
                                        <UploadCloud className="w-8 h-8 opacity-50" />
                                        <span className="text-xs">Click to Upload Left</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Kanan */}
                        <div className="space-y-2">
                            <Label>Right Image (Portrait)</Label>
                            <div className={`border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer relative h-40 flex flex-col items-center justify-center ${imageRight ? 'border-green-500 bg-green-500/5' : 'border-border hover:bg-muted/50'}`}>
                                <Input 
                                    type="file" 
                                    accept="image/*" 
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    onChange={e => setImageRight(e.target.files?.[0] || null)} 
                                    required 
                                />
                                {imageRight ? (
                                    <div className="text-xs font-bold text-green-600 truncate max-w-full px-2">
                                        {imageRight.name}
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground flex flex-col items-center gap-2">
                                        <UploadCloud className="w-8 h-8 opacity-50" />
                                        <span className="text-xs">Click to Upload Right</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </CardContent>
            </Card>

            <Button type="submit" disabled={loading} className="w-full font-bold h-12 text-lg">
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                PUBLISH BANNER
            </Button>
        </form>
    </div>
  );
}