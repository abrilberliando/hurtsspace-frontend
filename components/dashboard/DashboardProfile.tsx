"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Mail, Phone, Save, Camera, Loader2, ZoomIn, Check, MapPin } from "lucide-react";
import { AxiosError } from "axios";
import Cropper, { Area } from "react-easy-crop";
import AddressForm, { AddressData } from "@/components/shared/AddressForm";
import LogoutButton from "../shared/LogoutButton";

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

export default function DashboardProfile() {
  const { user, login } = useAuth();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Form State Basic Info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  // State Upload & Cropping 📸
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [tempImgSrc, setTempImgSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Load data user awal
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || "");
      setImagePreview(null);
      setImageFile(null);
    }
  }, [user]);

  // --- LOGIC IMAGE CROPPER ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error("File kegedean, G! Max 5MB ya.");
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setTempImgSrc(reader.result?.toString() || "");
        setIsCropping(true);
        setZoom(1);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCrop = async () => {
    if (!tempImgSrc || !croppedAreaPixels) return;
    try {
      const croppedImageBlob = await getCroppedImg(tempImgSrc, croppedAreaPixels);
      const file = new File([croppedImageBlob], "avatar_cropped.jpg", { type: "image/jpeg" });
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setIsCropping(false);
      toast.success("Foto di-crop! Klik Save Changes di bawah ya.");
    } catch (e) {
      console.error(e);
      toast.error("Gagal nge-crop gambar.");
    }
  };

  // --- LOGIC UPDATE PROFILE (Basic Info + Avatar) ---
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("_method", "PUT"); 

      if (imageFile) {
        formData.append("avatar", imageFile);
      }

      const res = await api.post("/user", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (user) {
         const updatedUser = { ...user, ...res.data.user };
         const token = localStorage.getItem("token") || "";
         login(updatedUser, token); 
      }

      toast.success("Profile Updated!", { description: "Data diri lo aman terkendali." });
      setImageFile(null); 

    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      toast.error(err.response?.data?.message || "Gagal Update Profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  // --- LOGIC UPDATE ADDRESS ---
  const handleSaveAddress = async (data: AddressData) => {
    setLoadingAddress(true);
    try {
        const payload = {
            // Kita kirim ulang nama/hp biar gak ketimpa null, tapi fokus utamanya update alamat
            name: user?.name, 
            phone: data.phone,
            address_detail: data.street,
            city_id: data.areaId,
            province_id: data.areaName,
            _method: "PUT"
        };

        const res = await api.post("/user", payload); // Pake endpoint /user yang sama
        
        if (user) {
             const updatedUser = { ...user, ...res.data.user };
             const token = localStorage.getItem("token") || "";
             login(updatedUser, token);
        }

        toast.success("Alamat Berhasil Disimpan!", { description: "Siap buat checkout barang baru." });
    } catch {
        toast.error("Gagal simpen alamat.");
    } finally {
        setLoadingAddress(false);
    }
  };

  if (!user) return null;

  // Data default buat form alamat
  const addressDefaultValues = {
      name: user.name,
      phone: user.phone || "",
      street: user.address_detail || "",
      areaId: user.city_id || "",
      areaName: user.province_id || ""
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-10 px-2">
        
        {/* === HEADER & AVATAR === */}
        {/* Sekarang layoutnya full width & clean */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 pb-6 border-b border-border">
            <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-background shadow-2xl cursor-pointer ring-2 ring-border/50">
                    <AvatarImage 
                        src={imagePreview || user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=000&color=fff`} 
                        className="object-cover"
                    />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                
                <label 
                    htmlFor="avatar-upload" 
                    className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all rounded-full cursor-pointer backdrop-blur-sm"
                >
                    <Camera className="w-8 h-8" />
                </label>
                <input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageChange}
                    onClick={(e) => (e.currentTarget.value = "")} 
                />
                
                {/* Badge Status Upload */}
                {imageFile && (
                   <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce">
                     New Photo Ready!
                   </div>
                )}
            </div>

            <div className="text-center sm:text-left flex-1 space-y-2 mb-2">
                <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">{user.name}</h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <span className="text-muted-foreground text-sm font-medium">{user.email}</span>
                    <span className="hidden sm:inline text-border">|</span>
                    <span className="text-muted-foreground text-sm font-medium">{user.role === 'admin' ? 'Administrator' : 'Society Member'}</span>
                </div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20 mt-1">
                    💎 {user.points} Points
                </div>
            </div>
            <LogoutButton />
        </div>

        {/* === MODAL CROPPER === */}
        <Dialog open={isCropping} onOpenChange={setIsCropping}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Atur Posisi Foto</DialogTitle>
                </DialogHeader>
                <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden mt-4">
                    {tempImgSrc && (
                        <Cropper
                            image={tempImgSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    )}
                </div>
                <div className="flex items-center gap-4 mt-4">
                    <ZoomIn className="w-4 h-4 text-muted-foreground" />
                    <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                </div>
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setIsCropping(false)}>Batal</Button>
                    <Button onClick={handleSaveCrop}><Check className="w-4 h-4 mr-2" /> Pakai Foto Ini</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* === MAIN CONTENT: UNIFIED CARD === */}
        <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 md:p-10 space-y-12">
                
                {/* SECTION: PERSONAL INFO */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Personal Information</h3>
                            <p className="text-sm text-muted-foreground">Atur data diri utama lo disini.</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone Number</Label>
                                <Input placeholder="08xxxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Email Address</Label>
                                <Input value={email} disabled readOnly className="bg-muted/50 cursor-not-allowed h-11" />
                                <p className="text-[10px] text-muted-foreground pt-1">Email dikunci untuk keamanan akun.</p>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={loadingProfile} size="lg" className="w-full sm:w-auto font-bold min-w-[160px]">
                                {loadingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> SAVING...</> : <><Save className="mr-2 h-4 w-4" /> SAVE CHANGES</>}
                            </Button>
                        </div>
                    </form>
                </section>

                <Separator />

                {/* SECTION: ADDRESS BOOK */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Shipping Address</h3>
                            <p className="text-sm text-muted-foreground">Alamat ini bakal otomatis kepake pas checkout.</p>
                        </div>
                    </div>

                    {/* Reuse Component AddressForm */}
                    <div className="bg-muted/30 p-6 rounded-xl border border-border/50">
                        <AddressForm 
                            defaultValues={addressDefaultValues}
                            onSave={handleSaveAddress}
                            isLoading={loadingAddress}
                            buttonText="UPDATE SHIPPING ADDRESS"
                        />
                    </div>
                </section>
            </CardContent>
        </Card>
    </div>
  );
}