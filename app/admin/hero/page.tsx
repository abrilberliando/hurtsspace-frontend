"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, UploadCloud, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManageHeroPage() {
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [subtitle, setSubtitle] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState("");

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
        setPreviewImage(data.background_image);
      } catch (error) {
        toast.error("Gagal mengambil data hero.");
      } finally {
        setLoadingData(false);
      }
    };
    fetchHero();
  }, []);

  // 2. Handle Preview Gambar saat admin pilih file
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Bikin URL preview lokal
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // 3. Submit Form ke Backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append("subtitle", subtitle);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("button_text", buttonText);
    formData.append("button_link", buttonLink);
    if (imageFile) {
      formData.append("background_image", imageFile);
    }

    try {
      // Pake POST karena kita ngirim file, tapi tujuannya update
      await api.post("/admin/hero-section", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Hero section berhasil diupdate! 🔥");
    } catch (error) {
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
          <CardTitle className="text-2xl font-black uppercase">Manage Homepage Hero</CardTitle>
          <p className="text-muted-foreground text-sm">Atur tampilan utama website lo disini.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Bagian Upload Gambar dengan Preview */}
            <div className="space-y-4">
              <Label className="text-lg font-bold">Hero Background Image</Label>
              
              {/* Preview Area - Mirip tampilan asli Hero */}
              <div 
                className="relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden border-2 border-border bg-zinc-900 flex items-center justify-center group"
              >
                {previewImage && (
                   // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
                )}
                <div className="relative z-10 text-center p-6">
                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase drop-shadow-lg mb-4 truncate">{title || "JUDUL HERO"}</h2>
                    <Button variant="secondary" className="pointer-events-none">{buttonText || "BUTTON"}</Button>
                </div>

                {/* Input File Tersembunyi */}
                <Input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    onChange={handleImageChange}
                />
                {!previewImage && (
                     <div className="absolute z-10 flex flex-col items-center text-muted-foreground pointer-events-none">
                        <UploadCloud className="w-10 h-10 mb-2" />
                        <span className="font-bold">Click to Upload New Background</span>
                        <span className="text-xs">Recommended: 1920x1080 (Landscape)</span>
                    </div>
                )}
              </div>
            </div>

            {/* Bagian Input Teks */}
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
              UPDATE HERO SECTION
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}