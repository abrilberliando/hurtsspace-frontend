"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, X, Tag, Check, ZoomIn, ZoomOut } from "lucide-react";
import { AxiosError } from "axios";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


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

interface CroppedArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Position {
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
    
    const [isSetupMode, setIsSetupMode] = useState(false); 
    const [zoomLevel, setZoomLevel] = useState(1); 
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null); 
    
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 }); 
    const [isDragging, setIsDragging] = useState(false);
    const [startDrag, setStartDrag] = useState<Position>({ x: 0, y: 0 });

    const [tags, setTags] = useState<TagItem[]>([]);
    const [isTagging, setIsTagging] = useState(false);
    const [tempCoords, setTempCoords] = useState({ x: 0, y: 0 });
    const [selectedProduct, setSelectedProduct] = useState("");

    const imageRef = useRef<HTMLImageElement>(null); 

    useEffect(() => {
        api.get("/products").then(res => setProducts(res.data.data.data || res.data.data));
    }, []);
    
    useEffect(() => {
        const handleMouseUp = () => setIsDragging(false);
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);


    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (imagePreview) URL.revokeObjectURL(imagePreview); 

            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setTags([]);
            
            setIsSetupMode(true); 
            setIsTagging(false);
            setZoomLevel(1); 
            setPosition({ x: 0, y: 0 });
        }
    };

    const getCroppedImage = async () => {
        setCroppedAreaPixels({ x: position.x, y: position.y, width: 100, height: 100 }); 
        
        setIsSetupMode(false);
        toast.success("Framing foto selesai! Silahkan mulai tagging.");
    };


    const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageFile || isTagging || isSetupMode) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setTempCoords({ x, y });
        setIsTagging(true);
    };
    
    const handleDragStart = (e: React.MouseEvent) => {
        if (!isSetupMode || e.button !== 0) return;
        e.preventDefault();
        setIsDragging(true);
        setStartDrag({ x: e.clientX, y: e.clientY });
    };

    const handleDragging = (e: React.MouseEvent) => {
        if (!isDragging || !isSetupMode) return;
        e.preventDefault();
        
        const dx = e.clientX - startDrag.x;
        const dy = e.clientY - startDrag.y;
        
        setPosition(prev => ({ 
            x: prev.x + dx, 
            y: prev.y + dy 
        }));
        
        setStartDrag({ x: e.clientX, y: e.clientY });
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
        if (isSetupMode) return toast.error("Selesaikan pengaturan foto terlebih dahulu.");

        if (!title || !imageFile || tags.length === 0) return toast.error("Lengkapi data & tag minimal 1 produk!");
        
        setLoading(true);
        const formData = new FormData();
        formData.append("title", title);
        formData.append("image", imageFile); 
        
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

    // --- RENDER IMAGE CANVAS ---
    const renderImageCanvas = () => {
        if (!imagePreview) {
            return (
                <div className="text-muted-foreground flex flex-col items-center gap-2">
                    <Tag className="w-10 h-10 opacity-20" />
                    <p>Upload image to start tagging</p>
                </div>
            );
        }
        
        const isInteractive = !isSetupMode && !isTagging;
        
        return (
            <div 
                className={`relative w-full h-full group select-none overflow-hidden ${isInteractive ? 'cursor-crosshair' : 'cursor-default'}`} 
                onClick={handleImageClick}
                onMouseDown={handleDragStart} 
                onMouseMove={handleDragging}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                    ref={imageRef}
                    src={imagePreview} 
                    className="w-full h-auto object-contain max-h-[80vh]" 
                    style={{ 
                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
                        transformOrigin: 'center center',
                        cursor: isDragging ? 'grabbing' : (isSetupMode ? 'grab' : 'default'),
                        transition: isSetupMode ? 'transform 0.0s linear' : 'none',
                    }}
                    alt="Preview" 
                />

                {/* --- RENDER SETUP MODE (Cropper Helper UI) --- */}
                {isSetupMode && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 pointer-events-none">
                         {/* Control panel disebelah kanan (pointer-events-auto) */}
                        <div className="absolute top-4 right-4 w-full max-w-sm p-4 bg-background border rounded-lg shadow-2xl pointer-events-auto">
                            <h3 className="font-bold text-lg mb-4 text-center">Zoom & Framing</h3>
                            
                            {/* Zoom Control */}
                            <div className="flex items-center gap-4 mb-6">
                                <ZoomOut className="w-5 h-5 text-muted-foreground" />
                                <Slider 
                                    defaultValue={[1]} 
                                    min={1} 
                                    max={3} 
                                    step={0.1}
                                    value={[zoomLevel]}
                                    onValueChange={(val: number[]) => setZoomLevel(val[0])} 
                                />
                                <ZoomIn className="w-5 h-5 text-muted-foreground" />
                            </div>

                            <Button 
                                size="lg" 
                                className="w-full font-bold" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    getCroppedImage();
                                }}
                            >
                                <Check className="w-4 h-4 mr-2" /> Confirm Framing
                            </Button>
                        </div>
                         {/* Indikator Panning */}
                        <p className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/70 px-3 py-1 rounded">
                            Drag foto untuk mengatur posisi
                        </p>
                    </div>
                )}
                
                {/* Render Tags */}
                {tags.map((tag) => (
                    <div 
                        key={tag.id}
                        className="absolute w-8 h-8 bg-white/90 backdrop-blur rounded-full border-2 border-zinc-900 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-sm font-bold text-zinc-900 shadow-xl z-10"
                        style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                    >
                        <Tag className="w-3 h-3" />
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap hidden group-hover:block z-20">
                            {products.find(p => p.id.toString() === tag.product_id)?.name}
                        </div>
                    </div>
                ))}

                {/* UI TAGGING MENU */}
                {isTagging && (
                    <div 
                        className="absolute z-50 transform -translate-x-1/2 mt-4"
                        style={{ left: `${tempCoords.x}%`, top: `${tempCoords.y}%` }}
                        onClick={(e) => e.stopPropagation()} 
                    >
                        <div className="w-64 bg-background border border-border shadow-2xl rounded-lg p-4 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold text-sm">Select Product</h4>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsTagging(false)}>
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                            
                            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                <SelectTrigger className="w-full mb-3">
                                    <SelectValue placeholder="-- Choose Item --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* FIX: Ganti value="" menjadi value unik yang tidak kosong */}
                                    <SelectItem value="placeholder-disabled" disabled>-- Choose Item --</SelectItem> 
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button size="sm" className="w-full font-bold" onClick={confirmTag}>
                                <Plus className="w-3 h-3 mr-2" /> ADD TAG
                            </Button>
                        </div>
                        
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white animate-ping" />
                    </div>
                )}
            </div>
        );
    }
    
    // --- MAIN RENDER ---
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* KIRI: CANVAS IMAGE TAGGING (FIXED ASPECT RATIO) */}
            <div className="lg:col-span-2">
                <Card className="bg-card border-border overflow-hidden shadow-sm">
                    {/* Container Aspect Ratio 4:3 */}
                    <div className="relative w-full pb-[75%] bg-zinc-950"> 
                       <CardContent className="p-0 absolute inset-0 flex items-center justify-center">
                            {renderImageCanvas()}
                       </CardContent>
                    </div>
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

                        <Button className="w-full font-bold mt-4" disabled={loading || isSetupMode} onClick={handleSubmit}>
                            {loading ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
                            PUBLISH
                        </Button>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}