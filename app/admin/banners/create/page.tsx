"use client";

import { useState, useEffect } from "react";
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
import Image from "next/image"; // Import Image component

// Import Shadcn Select Components
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


export default function CreateBannerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [position, setPosition] = useState("1");
    const [linkUrl, setLinkUrl] = useState("/shop");
    const [imageLeft, setImageLeft] = useState<File | null>(null);
    const [imageRight, setImageRight] = useState<File | null>(null);

    // 👇 STATE BARU UNTUK IMAGE PREVIEW
    const [previewLeft, setPreviewLeft] = useState<string | null>(null);
    const [previewRight, setPreviewRight] = useState<string | null>(null);

    // 👇 CLEANUP MEMORY (PENTING!)
    useEffect(() => {
        return () => {
            if (previewLeft) URL.revokeObjectURL(previewLeft);
            if (previewRight) URL.revokeObjectURL(previewRight);
        };
    }, [previewLeft, previewRight]);

    // Handle File Change (Reusable Logic)
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setterFile: React.Dispatch<React.SetStateAction<File | null>>, setterPreview: React.Dispatch<React.SetStateAction<string | null>>) => {
        const file = e.target.files?.[0] || null;
        setterFile(file);
        setterPreview(file ? URL.createObjectURL(file) : null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageLeft || !imageRight) return toast.error("Wajib upload kedua gambar (Kiri & Kanan)!");

        setLoading(true);
        const formData = new FormData();
        formData.append("title", title);
        formData.append("position", position);
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
                                <Select value={position} onValueChange={setPosition}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih Slot" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Slot 1 (Hero/Atas)</SelectItem>
                                        <SelectItem value="2">Slot 2 (Tengah/Bawah)</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                {/* 👇 PREVIEW LOGIC */}
                                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer relative h-40 flex flex-col items-center justify-center ${previewLeft ? 'border-green-500 bg-green-500/5' : 'border-border hover:bg-muted/50'}`}>
                                    <Input 
                                        type="file" 
                                        accept="image/*" 
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                        onChange={e => handleFileChange(e, setImageLeft, setPreviewLeft)} 
                                        required 
                                    />
                                    
                                    {previewLeft && imageLeft ? (
                                        <>
                                            <Image 
                                                src={previewLeft} 
                                                alt="Preview Left" 
                                                fill 
                                                className="object-cover rounded-md z-0" 
                                            />
                                            <span className="absolute bottom-2 bg-black/70 text-xs font-bold text-green-400 truncate max-w-[90%] px-2 py-0.5 rounded z-20">
                                                {imageLeft.name}
                                            </span>
                                        </>
                                    ) : (
                                        <div className="text-muted-foreground flex flex-col items-center gap-2 z-20">
                                            <UploadCloud className="w-8 h-8 opacity-50" />
                                            <span className="text-xs">Click to Upload Left</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Kanan */}
                            <div className="space-y-2">
                                <Label>Right Image (Portrait)</Label>
                                {/* 👇 PREVIEW LOGIC */}
                                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer relative h-40 flex flex-col items-center justify-center ${previewRight ? 'border-green-500 bg-green-500/5' : 'border-border hover:bg-muted/50'}`}>
                                    <Input 
                                        type="file" 
                                        accept="image/*" 
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                        onChange={e => handleFileChange(e, setImageRight, setPreviewRight)} 
                                        required 
                                    />
                                    
                                    {previewRight && imageRight ? (
                                        <>
                                            <Image 
                                                src={previewRight} 
                                                alt="Preview Right" 
                                                fill 
                                                className="object-cover rounded-md z-0" 
                                            />
                                            <span className="absolute bottom-2 bg-black/70 text-xs font-bold text-green-400 truncate max-w-[90%] px-2 py-0.5 rounded z-20">
                                                {imageRight.name}
                                            </span>
                                        </>
                                    ) : (
                                        <div className="text-muted-foreground flex flex-col items-center gap-2 z-20">
                                            <UploadCloud className="w-8 h-8 opacity-50" />
                                            <span className="text-xs">Click to Upload Right</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                <Button type="submit" disabled={loading} className="w-full font-bold h-12 text-lg bg-primary text-primary-foreground hover:bg-primary/90">
                    {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                    PUBLISH BANNER
                </Button>
            </form>
        </div>
    );
}