"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Loader2, UploadCloud, Save, X, ZoomIn, Check, Image as ImageIcon, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Cropper, { Area } from "react-easy-crop"; 
import { UploadOverlay } from "@/components/ui/UploadOverlay";
import { AxiosError } from "axios";

// --- UTILS: CANVAS CROPPER HELPER ---
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

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

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
    }, "image/jpeg", 0.95);
  });
}

// Interface for image structure in the form
interface HeroImage {
  file: File | null;
  previewUrl: string;
  isNew: boolean;
}

export default function ManageHeroPage() {
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Form States
  const [subtitle, setSubtitle] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  
  const [heroImages, setHeroImages] = useState<HeroImage[]>(
    Array(5).fill({ file: null, previewUrl: "", isNew: false })
  );

  // State Cropper
  const [isCropping, setIsCropping] = useState(false);
  const [activeCropIndex, setActiveCropIndex] = useState<number | null>(null);
  const [tempImgSrc, setTempImgSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // 1. Fetch Data Hero
  useEffect(() => {
    const fetchHero = async () => {
      try {
        const res = await api.get("/hero-section");
        const data = res.data.data;

        // 👇 FIX: Handle Nullable Values dari DB. Default ke "" string kosong biar input controlled.
        setSubtitle(data.subtitle || ""); 
        setTitle(data.title || ""); 
        setDescription(data.description || ""); 
        setButtonText(data.button_text || ""); 
        setButtonLink(data.button_link || "");
        
        const fetchedImages: HeroImage[] = [];
        const imagesFromDb = Array.isArray(data.background_images) ? data.background_images : [];
        
        for (let i = 0; i < 5; i++) {
          if (imagesFromDb[i]) {
            fetchedImages.push({ file: null, previewUrl: imagesFromDb[i], isNew: false });
          } else {
            fetchedImages.push({ file: null, previewUrl: "", isNew: false });
          }
        }
        setHeroImages(fetchedImages);
        
      } catch {
        toast.error("Failed to load hero data.");
      } finally {
        setLoadingData(false);
      }
    };
    fetchHero();
  }, []);

  // 2. Handle File Selection -> Enter Crop Mode
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 10 * 1024 * 1024) return toast.error("Max file size 10MB");

        const reader = new FileReader();
        reader.addEventListener("load", () => {
            setTempImgSrc(reader.result?.toString() || "");
            setActiveCropIndex(index);
            setIsCropping(true);
            setZoom(1);
        });
        reader.readAsDataURL(file);
    }
  };

  // 3. Callback Cropper
  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // 4. Execute Crop & Save to Main State
  const handleSaveCrop = async () => {
    if (!tempImgSrc || !croppedAreaPixels || activeCropIndex === null) return;

    try {
        const croppedBlob = await getCroppedImg(tempImgSrc, croppedAreaPixels);
        const file = new File([croppedBlob], "hero_crop.jpg", { type: "image/jpeg" });
        const previewUrl = URL.createObjectURL(croppedBlob);

        // Update state array images
        const newImages = [...heroImages];
        newImages[activeCropIndex] = {
            file: file,
            previewUrl: previewUrl,
            isNew: true
        };
        setHeroImages(newImages);
        
        // Reset & Close Modal
        setIsCropping(false);
        setActiveCropIndex(null);
        setTempImgSrc(null);
        toast.success("Image successfully cropped!");

    } catch (e) {
        console.error(e);
        toast.error("Failed to crop image.");
    }
  };

  // 5. Delete Image
  const handleRemoveImage = (index: number) => {
    const newImages = [...heroImages];
    newImages[index] = { file: null, previewUrl: "", isNew: false };
    setHeroImages(newImages);
  };

  // 6. Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setUploadError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append("subtitle", subtitle);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("button_text", buttonText);
    formData.append("button_link", buttonLink);

    heroImages.forEach((image, index) => {
      if (image.file) {
        formData.append(`background_image_${index}`, image.file);
      } 
      else if (image.previewUrl && !image.isNew) {
        formData.append(`existing_image_${index}`, image.previewUrl);
      }
    });

    try {
      await api.post("/admin/hero-section", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Hero section updated successfully! 🔥");
      setUploadSuccess(true); setSubmitting(false);
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      if (err.response?.status === 422) {
          setSubmitting(false);
          toast.error("Invalid data, please check your inputs.");
      } else {
          setUploadError(err.response?.data?.message || "Server error occurred while uploading.");
      }
    }
  };

  if (loadingData) return <div className="p-8"><Skeleton className="h-[600px] w-full rounded-xl" /></div>;

  return (
    <div className="max-w-5xl mx-auto pb-10 px-4">
      <UploadOverlay 
          isOpen={submitting || uploadSuccess} 
          isError={!!uploadError} 
          isSuccess={uploadSuccess}
          errorMessage={uploadError || undefined}
          onRetry={() => {
              setUploadError(null);
              setSubmitting(false);
          }} 
          onCloseSuccess={() => {
              setUploadSuccess(false);
          }}
      />
      
      {/* MODAL CROPPER (16:9) */}
      <Dialog open={isCropping} onOpenChange={setIsCropping}>
            <DialogContent className="sm:max-w-2xl bg-zinc-950 border-zinc-800 text-white p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b border-zinc-800">
                    <DialogTitle>Adjust Image Position (16:9)</DialogTitle>
                </DialogHeader>
                
                {/* Area Crop */}
                <div className="relative w-full h-[400px] bg-black">
                    {tempImgSrc && (
                        <Cropper
                            image={tempImgSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={16 / 9} // 👈 RASIO CINEMATIC
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            objectFit="contain"
                        />
                    )}
                </div>

                {/* Controls */}
                <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex flex-col gap-4">
                    <div className="flex items-center gap-4 px-2">
                        <ZoomIn className="w-4 h-4 text-zinc-400" />
                        <Slider 
                            defaultValue={[1]} min={1} max={3} step={0.1} 
                            value={[zoom]} onValueChange={(val) => setZoom(val[0])} 
                            className="flex-1 cursor-pointer"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsCropping(false)}>Cancel</Button>
                        <Button onClick={handleSaveCrop} className="bg-white text-black hover:bg-zinc-200">
                            <Check className="w-4 h-4 mr-2" /> Crop & Use
                        </Button>
                    </div>
                </div>
            </DialogContent>
      </Dialog>

      <Card className="border-border bg-card shadow-lg">
        <CardHeader className="border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <ImageIcon className="w-6 h-6" />
             </div>
             <div>
                <CardTitle className="text-2xl font-black uppercase tracking-tight">Hero Slider</CardTitle>
                <CardDescription>Set the main images (Slider) on the front page.</CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* Bagian Upload Gambar SLIDER */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <Label className="text-base font-bold flex items-center gap-2">
                    Background Images <span className="text-xs font-normal text-muted-foreground">(Max 5 Slide, 16:9 Preferred)</span>
                 </Label>
              </div>
              
              {/* Container 5 Slot Gambar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {heroImages.map((image, index) => (
                  <div key={index} className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-dashed border-border bg-muted/30 flex items-center justify-center group hover:border-primary/50 transition-colors">
                    
                    {image.previewUrl ? (
                      <>
                         {/* eslint-disable-next-line @next/next/no-img-element */}
                         <img 
                            src={image.previewUrl} 
                            alt={`Preview ${index + 1}`} 
                            className="absolute inset-0 w-full h-full object-cover" 
                         />
                         
                         {/* Overlay Action */}
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {/* Tombol Re-Upload (Ganti) */}
                            <label htmlFor={`upload-${index}`} className="cursor-pointer p-2 bg-white text-black rounded-full hover:scale-110 transition-transform">
                                <RotateCcw className="w-4 h-4" />
                            </label>
                            
                            {/* Delete Button */}
                            <Button 
                                type="button" 
                                variant="destructive" 
                                size="icon" 
                                className="rounded-full h-8 w-8"
                                onClick={() => handleRemoveImage(index)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                         </div>
                      </>
                    ) : (
                      // State Kosong
                      <div className="flex flex-col items-center text-muted-foreground pointer-events-none">
                        <UploadCloud className="w-8 h-8 mb-2 opacity-50" />
                        <span className="font-bold text-xs">Slide {index + 1}</span>
                        <span className="text-[10px]">Tap to upload</span>
                      </div>
                    )}

                    {/* Input File Hidden */}
                    <Input 
                      id={`upload-${index}`}
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => handleImageSelect(e, index)}
                      onClick={(e) => (e.currentTarget.value = "")}
                      disabled={!!image.previewUrl} // Disable click if there is already an image (must use overlay button)
                    />
                    
                    {/* Hack biar input tetep bisa diklik walau ada gambar (lewat label overlay) */}
                    {!image.previewUrl && <label htmlFor={`upload-${index}`} className="absolute inset-0 cursor-pointer z-20"></label>}
                    
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Bagian Input Teks - SEMUA NULLABLE / OPTIONAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Subtitle (Small Text)</Label>
                    <Input 
                        placeholder="e.g. New Collection" 
                        value={subtitle} 
                        onChange={e => setSubtitle(e.target.value)} 
                        // Optional
                    />
                </div>

                <div className="space-y-2">
                    <Label>Title (Main Headline)</Label>
                    <Input 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        className="font-black text-lg" 
                        placeholder="e.g. SUMMER VIBES"
                        // Optional
                    />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                    <Label>Description</Label>
                    <Textarea 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        rows={3} 
                        placeholder="Short campaign description..."
                        // Optional
                    />
                </div>

                <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input 
                        value={buttonText} 
                        onChange={e => setButtonText(e.target.value)} 
                        className="font-bold" 
                        placeholder="e.g. SHOP NOW"
                        // Optional
                    />
                </div>
                <div className="space-y-2">
                    <Label>Button Link URL</Label>
                    <Input 
                        value={buttonLink} 
                        onChange={e => setButtonLink(e.target.value)} 
                        placeholder="/shopall?category=new"
                        // Optional
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={submitting} size="lg" className="w-full md:w-auto font-bold px-8">
                    {submitting ? <><Loader2 className="animate-spin mr-2" /> SAVING...</> : <><Save className="w-4 h-4 mr-2" /> UPDATE HERO SECTION</>}
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}