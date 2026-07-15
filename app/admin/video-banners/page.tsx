"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Video, Trash2, Power, UploadCloud, Film, PlayCircle, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AxiosError } from "axios";
import { UploadOverlay } from "@/components/ui/UploadOverlay";

interface VideoBanner {
  id: number;
  title: string;
  description: string;
  video_url: string;
  link_url: string;
  is_active: boolean;
}

export default function ManageVideoPage() {
  const [videos, setVideos] = useState<VideoBanner[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [link, setLink] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const fetchVideos = async () => {
    setLoading(true);
    try {
        const res = await api.get("/admin/video-banners");
        const data = res.data.data || res.data || [];
        setVideos(data);
    } catch {
        toast.error("Gagal load video, coba refresh G!");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchVideos(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) return toast.error("Mana videonya G? Pilih dulu dong!");
    
    // Validasi Ukuran (2MB sesuai request lo, tapi biasanya video butuh gedean dikit sih)
    if (videoFile.size > 7 * 1024 * 1024) {
        return toast.error("Size kegedean! Maksimal 7MB ya (coba compress dulu).");
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", desc);
    formData.append("link_url", link);
    formData.append("video", videoFile);

    try {
        await api.post("/admin/video-banners", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Boom! Video berhasil mendarat! 🎥");
        
        // Reset Form
        setVideoFile(null);
        setTitle("");
        setDesc("");
        setLink("");
        
        const fileInput = document.getElementById('video-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = "";

        fetchVideos();
        setUploadSuccess(true); setUploading(false);
    } catch (error: unknown) {
        const err = error as AxiosError<{ message: string }>;
        if (err.response?.status === 422) {
            setUploading(false);
            toast.error("Data tidak valid, periksa inputan.");
        } else {
            setUploadError(err.response?.data?.message || "Server lagi cranky kayaknya.");
        }
    }
  };

  const handleDelete = async (id: number) => {
      if(!confirm('Real talk, mau dihapus nih? Gak bisa undo lho.')) return;
      try {
          await api.delete(`/admin/video-banners/${id}`);
          toast.success("Video lenyap dari muka bumi.");
          fetchVideos();
      } catch { toast.error("Gagal hapus, coba lagi nanti."); }
  };

  const handleToggle = async (id: number) => {
      try {
          await api.put(`/admin/video-banners/${id}/toggle`);
          toast.success("Status updated! Website lo makin fresh.");
          fetchVideos();
      } catch { toast.error("Gagal ganti status."); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 pt-6 px-4 sm:px-6">
        <UploadOverlay 
            isOpen={uploading || uploadSuccess} 
            isError={!!uploadError} 
            isSuccess={uploadSuccess}
            errorMessage={uploadError || undefined}
            onRetry={() => {
                setUploadError(null);
                setUploading(false);
            }} 
            onCloseSuccess={() => {
                setUploadSuccess(false);
            }}
        />
        {/* SECTION 2: UPLOAD FORM (MENU DI BAWAH) */}
        <section className="pt-8 border-t border-border">
            <div className="flex items-center gap-2 mb-6">
                <PlusCircle className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight">Upload New Content</h2>
            </div>

            <Card className="bg-card border-border shadow-lg overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                    
                    {/* Left Side: Info & Decorative */}
                    <div className="lg:w-1/3 bg-muted/30 p-8 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-border">
                        <div className="mb-6 p-4 bg-background rounded-2xl shadow-sm border border-border inline-block w-fit">
                            <UploadCloud className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Upload Zone</h3>
                        <p className="text-muted-foreground mb-6">
                            Format yang disupport MP4 atau MOV. Pastikan size di bawah 7MB ya bosss.
                        </p>
                        <div className="text-sm text-muted-foreground space-y-2">
                            <div className="flex items-center gap-2">✓ Aspect Ratio 16:9 Recommended</div>
                            <div className="flex items-center gap-2">✓ Max Duration 15-30s</div>
                            <div className="flex items-center gap-2">✓ High Bitrate</div>
                        </div>
                    </div>

                    {/* Right Side: The Form */}
                    <div className="lg:w-2/3 p-8">
                        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Input Group 1 */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Judul Video (Opsional)</Label>
                                    <Input 
                                        id="title" 
                                        value={title} 
                                        onChange={e => setTitle(e.target.value)} 
                                        placeholder="Misal: SUMMER SALE 2025" 
                                        className="bg-background"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="link">Link Redirect (Opsional)</Label>
                                    <Input 
                                        id="link" 
                                        value={link} 
                                        onChange={e => setLink(e.target.value)} 
                                        placeholder="/products/new-arrival" 
                                        className="bg-background"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="desc">Deskripsi (Opsional)</Label>
                                    <Textarea 
                                        id="desc" 
                                        value={desc} 
                                        onChange={e => setDesc(e.target.value)} 
                                        placeholder="Kasih caption dikit biar user paham..." 
                                        rows={4}
                                        className="resize-none bg-background"
                                    />
                                </div>
                            </div>

                            {/* Input Group 2 (File Upload) */}
                            <div className="flex flex-col gap-4">
                                <Label>File Video</Label>
                                <div className="flex-1 border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl bg-muted/10 relative group">
                                    <Input 
                                        id="video-upload"
                                        type="file" 
                                        accept="video/mp4,video/quicktime" 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                        onChange={e => setVideoFile(e.target.files?.[0] || null)} 
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                                        {videoFile ? (
                                            <>
                                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                                                    <Video className="w-6 h-6" />
                                                </div>
                                                <p className="font-bold text-green-700 truncate w-full px-4">{videoFile.name}</p>
                                                <p className="text-xs text-muted-foreground">{(videoFile.size / (1024*1024)).toFixed(2)} MB</p>
                                                <p className="text-xs text-primary mt-2 font-medium">Click to change</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                    <UploadCloud className="w-6 h-6" />
                                                </div>
                                                <p className="font-medium text-foreground">Drag & Drop or Click</p>
                                                <p className="text-xs text-muted-foreground mt-1">MP4/MOV Only</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <Button disabled={uploading} size="lg" className="w-full font-bold shadow-lg shadow-primary/20">
                                    {uploading ? (
                                        <>
                                            <Loader2 className="animate-spin mr-2 h-5 w-5" />
                                            UPLOADING {Math.floor(Math.random() * 99)}%...
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="mr-2 h-5 w-5" />
                                            LAUNCH VIDEO
                                        </>
                                    )}
                                </Button>
                            </div>

                        </form>
                    </div>
                </div>
            </Card>
        </section>
         {/* SECTION 1: GALLERY (VIDEO DI ATAS) */}
        <section className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <PlayCircle className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight">Live Gallery</h2>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />)}
                </div>
            ) : videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-3xl bg-muted/5 text-muted-foreground">
                    <Video className="w-16 h-16 mb-4 opacity-20" />
                    <h3 className="text-xl font-bold">Sepi banget G!</h3>
                    <p>Belum ada video nih, scroll ke bawah buat upload ya.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map(video => (
                        <Card key={video.id} className={`group overflow-hidden transition-all duration-300 hover:shadow-xl border-2 ${video.is_active ? 'border-primary/50 shadow-primary/10' : 'border-transparent'}`}>
                            {/* Video Preview Area */}
                            <div className="relative aspect-video bg-black">
                                <video 
                                    src={video.video_url} 
                                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                                    muted 
                                    loop 
                                    playsInline
                                    onMouseOver={e => e.currentTarget.play()}
                                    onMouseOut={e => e.currentTarget.pause()}
                                />
                                <div className="absolute top-3 left-3">
                                    <Badge variant={video.is_active ? "default" : "secondary"} className={video.is_active ? "bg-green-600 hover:bg-green-700" : "bg-black/50 text-white backdrop-blur"}>
                                        {video.is_active ? "● LIVE" : "OFFLINE"}
                                    </Badge>
                                </div>
                            </div>

                            <CardContent className="p-5 space-y-3">
                                <div>
                                    <h3 className="font-bold text-lg leading-tight truncate">{video.title || "Untitled Masterpiece"}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1 h-10">
                                        {video.description || "No description provided."}
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <p className="text-xs font-mono text-muted-foreground bg-muted p-2 rounded truncate">
                                        🔗 {video.link_url || "No Link"}
                                    </p>
                                </div>
                            </CardContent>

                            <CardFooter className="p-4 pt-0 flex gap-2">
                                <Button 
                                    className={`flex-1 font-bold ${video.is_active ? 'hover:bg-red-50 hover:text-red-600 hover:border-red-200' : 'hover:bg-green-50 hover:text-green-600 hover:border-green-200'}`}
                                    variant="outline"
                                    onClick={() => handleToggle(video.id)}
                                >
                                    <Power className="w-4 h-4 mr-2" />
                                    {video.is_active ? "Deactivate" : "Activate"}
                                </Button>
                                <Button 
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => handleDelete(video.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </section>

    </div>
  );
}