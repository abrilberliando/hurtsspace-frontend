"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Power } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface Banner {
  id: number;
  title: string;
  image_left: string;
  image_right: string;
  link_url: string;
  is_active: boolean;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBanners = async () => {
    try {
      const res = await api.get("/admin/banners");
      setBanners(res.data.data);
    } catch {
      toast.error("Gagal load banner.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus banner ini?")) return;
    try {
        await api.delete(`/admin/banners/${id}`);
        toast.success("Banner dihapus!");
        fetchBanners();
    } catch { toast.error("Gagal hapus."); }
  };

  const handleToggle = async (id: number) => {
    try {
        await api.put(`/admin/banners/${id}/toggle`);
        toast.success("Status banner diupdate!");
        fetchBanners();
    } catch { toast.error("Gagal update status."); }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /></div>;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Manage Split Banners</h1>
            <Button asChild>
                <Link href="/admin/banners/create">
                    <Plus className="w-4 h-4 mr-2" /> New Banner
                </Link>
            </Button>
        </div>

        <div className="grid gap-6">
            {banners.map((banner) => (
                <div key={banner.id} className="bg-card border border-border rounded-lg overflow-hidden flex flex-col md:flex-row">
                    {/* Preview Gambar Split */}
                    <div className="h-32 md:w-64 w-full flex bg-muted">
                        <div className="w-1/2 h-full relative">
                            <Image 
                                src={banner.image_left} 
                                alt={`Left - ${banner.title}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, 160px" 
                            />
                        </div>
                        <div className="w-1/2 h-full relative border-l border-white/10">
                            <Image 
                                src={banner.image_right} 
                                alt={`Right - ${banner.title}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, 160px"
                            />
                        </div>
                    </div>
                    
                    <div className="p-4 flex-1 flex justify-between items-center">
                        <div>
                            <h3 className="font-black text-lg uppercase">{banner.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">Link: {banner.link_url}</p>
                            <Badge variant={banner.is_active ? "default" : "secondary"} className={banner.is_active ? "bg-green-600" : ""}>
                                {banner.is_active ? "ACTIVE" : "INACTIVE"}
                            </Badge>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleToggle(banner.id)} title="Toggle Active">
                                <Power className={`w-4 h-4 ${banner.is_active ? "text-green-500" : "text-muted-foreground"}`} />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDelete(banner.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
            {banners.length === 0 && <p className="text-center text-muted-foreground py-10">Belum ada banner. Buat baru gih!</p>}
        </div>
    </div>
  );
}