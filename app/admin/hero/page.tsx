"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, UploadCloud, Save, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Interface buat struktur gambar di form
interface HeroImage {
  file: File | null;
  previewUrl: string;
  isNew: boolean; // Buat nandain apakah gambar baru diupload
}

export default function ManageHeroPage() {
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [subtitle, setSubtitle] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  
  // UBAH INI: Dari 1 gambar jadi array 5 gambar
  const [heroImages, setHeroImages] = useState<HeroImage[]>(
    Array(5).fill({ file: null, previewUrl: "", isNew: false })
  );

  // 1. Fetch Data Hero saat ini pas loading halaman
  useEffect(() => {
    const fetchHero = async () => {
      try {
        const res = await api.get("/hero-section");
        const data = res.data.data;

        setSubtitle(data.subtitle);
        setTitle(data.title);
        setDescription(data.description || "");
        setButtonText(data.button_text);
        setButtonLink(data.button_link);
        
        // 👇 PERBAIKAN 1: 'let' diubah jadi 'const' karena tidak di-reassign
        const fetchedImages: HeroImage[] = [];
        // Pastikan background_images adalah array dan punya isinya
        const imagesFromDb = Array.isArray(data.background_images) ? data.background_images : [];
        
        for (let i = 0; i < 5; i++) {
          if (imagesFromDb[i]) {
            // Gambar dari DB (URL string)
            fetchedImages.push({ 
              file: null, 
              previewUrl: imagesFromDb[i], 
              isNew: false 
            });
          } else {
            // Slot kosong
            fetchedImages.push({ 
              file: null, 
              previewUrl: "", 
              isNew: false 
            });
          }
        }
        setHeroImages(fetchedImages);
        
      // 👇 PERBAIKAN 2: Variabel 'error' dihapus karena tidak digunakan di block catch
      } catch {
        toast.error("Gagal mengambil data hero.");
      } finally {
        setLoadingData(false);
      }
    };
    fetchHero();
  }, []);

  // 2. Handle Preview Gambar saat admin pilih file (Diubah buat indeks tertentu)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const newImages = [...heroImages];
      // Bikin URL preview lokal
      const previewUrl = URL.createObjectURL(file);
      
      newImages[index] = { 
        file: file, 
        previewUrl: previewUrl, 
        isNew: true // Tandain kalau ini file baru
      };
      
      setHeroImages(newImages);
    }
  };

  // 3. Handle hapus gambar dari slot
  const handleRemoveImage = (index: number) => {
    const newImages = [...heroImages];
    // Kosongin slot di index tertentu
    newImages[index] = { file: null, previewUrl: "", isNew: false };
    setHeroImages(newImages);
  };

  // 4. Submit Form ke Backend (Diubah buat kirim 5 gambar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append("subtitle", subtitle);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("button_text", buttonText);
    formData.append("button_link", buttonLink);

    // LOGIC BARU: Kirim 5 gambar ke backend
    heroImages.forEach((image, index) => {
      // Kirim file baru kalau ada
      if (image.file) {
        formData.append(`background_image_${index}`, image.file);
      } 
      // Kirim URL gambar lama kalau masih ada (tidak dihapus/diganti)
      else if (image.previewUrl && !image.isNew) {
        formData.append(`existing_image_${index}`, image.previewUrl);
      }
      // Kalau slot kosong, kita gak kirim apa-apa, backend akan tahu dari index yang tidak terkirim
    });


    try {
      // Pake POST karena kita ngirim file, tapi tujuannya update
      await api.post("/admin/hero-section", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Hero section berhasil diupdate! 🔥");
      
    // 👇 PERBAIKAN 3: Variabel 'error' dihapus karena tidak digunakan di block catch
    } catch {
      toast.error("Gagal update hero section.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) return <div className="p-8"><Skeleton className="h-[600px] w-full rounded-xl" /></div>;

  return (
    <div className="max-w-4xl mx-auto pb-10 px-4">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-2xl font-black uppercase">Manage Homepage Hero SLIDER</CardTitle>
          <p className="text-muted-foreground text-sm">Atur tampilan utama website lo disini (max 5 Slide).</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Bagian Upload Gambar SLIDER dengan Preview */}
            <div className="space-y-4">
              <Label className="text-lg font-bold">Hero Background Images (Max 5)</Label>
              
              {/* Container 5 Slot Gambar */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {heroImages.map((image, index) => (
                  // 👇 PERBAIKAN 4: Ganti aspect-[4/3] jadi aspect-4/3
                  <div key={index} className="relative w-full aspect-4/3 rounded-lg overflow-hidden border border-border bg-zinc-900 flex items-center justify-center group">
                    {image.previewUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={image.previewUrl} 
                        alt={`Preview ${index + 1}`} 
                        className="absolute inset-0 w-full h-full object-cover transition-opacity" 
                      />
                    )}

                    {/* Input File Tersembunyi per Slot */}
                    <Input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      onChange={(e) => handleImageChange(e, index)}
                    />
                    
                    {/* Tombol Hapus */}
                    {image.previewUrl && (
                       <Button 
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveImage(index)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}

                    {!image.previewUrl && (
                      <div className="absolute z-10 flex flex-col items-center text-muted-foreground pointer-events-none p-2">
                        <UploadCloud className="w-6 h-6 mb-1" />
                        <span className="font-bold text-xs text-center">Slide {index + 1}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bagian Input Teks (Sisanya tetap sama) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                    <Label>Title (Judul Besar)</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} className="font-black text-lg" required />
                </div>
                <div className="space-y-2">
                    <Label>Subtitle (Teks Kecil Atas)</Label>
                    <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label>Description (Teks Paragraf)</Label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                    <Label>Button Text</Label>
                    <Input value={buttonText} onChange={e => setButtonText(e.target.value)} className="font-bold" required />
                </div>
                <div className="space-y-2">
                    <Label>Button Link URL</Label>
                    <Input value={buttonLink} onChange={e => setButtonLink(e.target.value)} required />
                </div>
            </div>

            <Button type="submit" disabled={submitting} className="w-full h-12 text-lg font-bold">
              {submitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              UPDATE HERO SLIDER
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}