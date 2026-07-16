"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, X, Tag, Check, ZoomIn, RotateCcw, ImagePlus } from "lucide-react";
import { AxiosError } from "axios";
import { Slider } from "@/components/ui/slider";
import Cropper, { Area } from "react-easy-crop"; // 👈 Library Sakti
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UploadOverlay } from "@/components/ui/UploadOverlay";

// --- TYPES ---
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

// --- UTILS: CANVAS CROPPER ---
// This function actually crops the image into a new file
const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        image.setAttribute("crossOrigin", "anonymous");
        image.src = url;
    });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("No 2d context");

    // Set canvas size sesuai hasil crop
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image to canvas
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas is empty"));
        }, "image/jpeg", 0.95); // High quality JPG
    });
}

export default function CreateLookbookPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    
    // Data Form
    const [title, setTitle] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    
    // State Gambar
    const [rawImageSrc, setRawImageSrc] = useState<string | null>(null); // Gambar mentah dari upload
    const [croppedImagePreview, setCroppedImagePreview] = useState<string | null>(null); // Gambar hasil crop (preview)
    const [finalImageFile, setFinalImageFile] = useState<File | null>(null); // Final file to send to API
    
    // State Cropper
    const [isCropping, setIsCropping] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    // State Tagging
    const [tags, setTags] = useState<TagItem[]>([]);
    const [isTaggingMode, setIsTaggingMode] = useState(false);
    const [tempCoords, setTempCoords] = useState({ x: 0, y: 0 });
    const [selectedProduct, setSelectedProduct] = useState("");

    // Load Products
    useEffect(() => {
        api.get("/products").then(res => setProducts(res.data.data.data || res.data.data || []));
    }, []);

    // 1. Handle Upload File
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setRawImageSrc(reader.result?.toString() || "");
                setIsCropping(true); // Enter crop mode directly
                setCroppedImagePreview(null); // Reset preview lama
                setTags([]); // Reset tags
            });
            reader.readAsDataURL(file);
        }
    };

    // 2. Save Crop Coordinates
    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    // 3. Eksekusi Crop (Potong Gambar)
    const showCroppedImage = async () => {
        if (!rawImageSrc || !croppedAreaPixels) return;
        try {
            const croppedBlob = await getCroppedImg(rawImageSrc, croppedAreaPixels);
            const file = new File([croppedBlob], "lookbook_crop.jpg", { type: "image/jpeg" });
            
            setFinalImageFile(file);
            setCroppedImagePreview(URL.createObjectURL(croppedBlob));
            
            setIsCropping(false); // Exit crop mode
            toast.success("Photo successfully set! Now time for tagging.");
        } catch (e) {
            console.error(e);
            toast.error("Failed to crop image.");
        }
    };

    // 4. Handle Klik Gambar untuk Tagging
    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!croppedImagePreview || isCropping || isTaggingMode) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        // Hitung persentase posisi (Responsif)
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setTempCoords({ x, y });
        setIsTaggingMode(true); // Show product selection popover
    };

    // 5. Save Tag
    const confirmTag = () => {
        if (!selectedProduct) return toast.error("Please select a product first!");
        
        setTags([...tags, { 
            id: Date.now(), 
            product_id: selectedProduct, 
            x: tempCoords.x, 
            y: tempCoords.y 
        }]);
        
        setIsTaggingMode(false);
        setSelectedProduct("");
    };

    // 6. Submit ke API
    const handleSubmit = async () => {
        if (!finalImageFile || tags.length === 0) return toast.error("Upload photo & tag at least 1 product!");
        
        setLoading(true);
        setUploadError(null);
        setUploadSuccess(false);
        const formData = new FormData();
        formData.append("title", title);
        formData.append("image", finalImageFile); 
        
        const itemsData = tags.map(t => ({ product_id: t.product_id, x: t.x, y: t.y }));
        formData.append("items", JSON.stringify(itemsData));

        try {
            await api.post("/admin/lookbooks", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            toast.success("Lookbook Created!");
            setUploadSuccess(true); setLoading(false);
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            if (err.response?.status === 422) {
                setLoading(false);
                toast.error("Invalid data, please check your input.");
            } else {
                setUploadError(err.response?.data?.message || "Terjadi kesalahan server saat mengunggah.");
            }
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
            <UploadOverlay 
                isOpen={loading || uploadSuccess} 
                isError={!!uploadError} 
                isSuccess={uploadSuccess}
                errorMessage={uploadError || undefined}
                onRetry={() => {
                    setUploadError(null);
                    setLoading(false);
                }} 
                onCloseSuccess={() => {
                    setUploadSuccess(false);
                    router.push("/admin/lookbooks");
                }}
            />
            
            {/* --- KOLOM KIRI: CANVAS UTAMA --- */}
            <div className="lg:col-span-2">
                <Card className="bg-card border-border overflow-hidden shadow-lg">
                    <CardContent className="p-0 bg-zinc-950 relative flex items-center justify-center min-h-[500px]">
                        
                        {/* CASE 1: NOT UPLOADED YET */}
                        {!rawImageSrc && (
                            <div className="flex flex-col items-center justify-center text-muted-foreground gap-4 p-10">
                                <div className="p-4 bg-muted rounded-full">
                                    <ImagePlus className="w-8 h-8 opacity-50" />
                                </div>
                                <p className="text-sm">Upload photo to start Lookbook</p>
                                <Input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    id="upload-trigger"
                                    onChange={handleFileChange}
                                />
                                <Button asChild variant="outline">
                                    <label htmlFor="upload-trigger" className="cursor-pointer">Select Photo</label>
                                </Button>
                            </div>
                        )}

                        {/* CASE 2: MODE CROPPING (3:4) */}
                        {rawImageSrc && isCropping && (
                            <div className="absolute inset-0 w-full h-full bg-black z-20 flex flex-col">
                                {/* AREA CROP (FLEX GROW) */}
                                <div className="relative flex-1 w-full bg-black/50 overflow-hidden">
                                    <Cropper
                                        image={rawImageSrc}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={3 / 4} // 👈 KUNCI: RASIO POTRAIT 3:4
                                        onCropChange={setCrop}
                                        onCropComplete={onCropComplete}
                                        onZoomChange={setZoom}
                                        objectFit="contain" // Biar gambar muat di layar
                                    />
                                </div>

                                {/* CONTROLS BAR (DI BAWAH, GAK OVERLAY) */}
                                <div className="w-full bg-zinc-900 border-t border-white/10 p-4 flex flex-col gap-4 shrink-0 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                                    <div className="flex items-center gap-4 px-2">
                                        <ZoomIn className="w-4 h-4 text-white shrink-0" />
                                        <Slider 
                                            defaultValue={[1]} min={1} max={3} step={0.1} 
                                            value={[zoom]} onValueChange={(val) => setZoom(val[0])} 
                                            className="cursor-pointer flex-1"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="secondary" className="flex-1 font-semibold" onClick={() => setIsCropping(false)}>
                                            Cancel
                                        </Button>
                                        <Button className="flex-1 font-bold" onClick={showCroppedImage}>
                                            <Check className="w-4 h-4 mr-2" /> Done Crop
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CASE 3: MODE TAGGING (Hasil Crop) */}
                        {croppedImagePreview && !isCropping && (
                            <div 
                                className="relative w-full h-full cursor-crosshair group"
                                onClick={handleImageClick}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={croppedImagePreview} 
                                    className="w-full h-auto object-contain mx-auto shadow-2xl" 
                                    alt="Lookbook" 
                                />

                                {/* Render Created Tags */}
                                {tags.map((tag) => (
                                    <div 
                                        key={tag.id}
                                        className="absolute w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-lg border-2 border-white transform -translate-x-1/2 -translate-y-1/2 z-10 hover:scale-110 transition-transform cursor-pointer"
                                        style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                                        onClick={(e) => {
                                            e.stopPropagation(); // Biar gak ngetrigger add tag baru
                                            setTags(tags.filter(t => t.id !== tag.id)); // Delete tag on click
                                        }}
                                    >
                                        <Plus className="w-4 h-4 rotate-45" /> {/* Icon X */}
                                        <div className="absolute bottom-full mb-2 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap hidden group-hover:block">
                                            {products.find(p => p.id.toString() === tag.product_id)?.name}
                                        </div>
                                    </div>
                                ))}

                                {/* Product Selection Popover (Appears on click) */}
                                {isTaggingMode && (
                                    <div 
                                        className="absolute z-50 transform -translate-x-1/2 mt-2 w-64 bg-background border border-border shadow-2xl rounded-lg p-3 animate-in zoom-in-95"
                                        style={{ left: `${tempCoords.x}%`, top: `${tempCoords.y}%` }}
                                        onClick={(e) => e.stopPropagation()} 
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold uppercase text-muted-foreground">Tag Product</span>
                                            <button onClick={() => setIsTaggingMode(false)}><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
                                        </div>
                                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                            <SelectTrigger className="h-8 text-xs mb-2">
                                                <SelectValue placeholder="Select Product..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={p.id.toString()} className="text-xs">{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button size="sm" className="w-full h-7 text-xs font-bold" onClick={confirmTag}>Add Tag</Button>
                                    </div>
                                )}
                            </div>
                        )}
                        
                    </CardContent>
                </Card>
                <div className="flex justify-between items-center mt-2 px-2">
                    <p className="text-xs text-muted-foreground">
                        * Click on the photo area to tag a product.
                    </p>
                    {croppedImagePreview && (
                        <Button variant="ghost" size="sm" onClick={() => setIsCropping(true)} className="text-xs h-7 text-muted-foreground hover:text-foreground">
                            <RotateCcw className="w-3 h-3 mr-1" /> Re-Crop Image
                        </Button>
                    )}
                </div>
            </div>

            {/* --- KOLOM KANAN: FORM DATA --- */}
            <div className="space-y-6">
                <Card className="bg-card border-border">
                    <CardContent className="p-6 space-y-4">
                        <h2 className="font-bold text-xl mb-4">Lookbook Details</h2>
                        
                        <div className="space-y-2">
                            <Label>Title / Theme</Label>
                            <Input placeholder="e.g. Summer Drop Vol. 1" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>

                        {/* List of Tagged Items */}
                        <div className="space-y-3 pt-4 border-t border-border">
                            <Label>Tagged Items ({tags.length})</Label>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {tags.length === 0 && <p className="text-xs text-muted-foreground italic">No products tagged yet.</p>}
                                
                                {tags.map(tag => {
                                    const prodName = products.find(p => p.id.toString() === tag.product_id)?.name || "Unknown";
                                    return (
                                        <div key={tag.id} className="flex justify-between items-center text-sm p-3 border border-border rounded-md bg-muted/30">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <Tag className="w-3 h-3 text-muted-foreground shrink-0" />
                                                <span className="truncate font-medium">{prodName}</span>
                                            </div>
                                            <Button 
                                                variant="ghost" size="icon" 
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

                        <Button className="w-full font-bold h-11 mt-4" disabled={loading || !finalImageFile} onClick={handleSubmit}>
                            {loading ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
                            PUBLISH LOOKBOOK
                        </Button>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}