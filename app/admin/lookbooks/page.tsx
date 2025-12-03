"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface LookbookItem {
    id: number;
    // ... properti lain
}

interface Lookbook {
    id: number;
    title: string;
    image_url: string;
    items: LookbookItem[];
}

export default function AdminLookbooksPage() {
  const [lookbooks, setLookbooks] = useState<Lookbook[]>([]);

  const fetchLookbooks = useCallback(async () => {
    try {
      const res = await api.get("/admin/lookbooks");
      setLookbooks(res.data.data);
    } catch { toast.error("Gagal load lookbooks"); }
  }, []);

  // 👇 PERBAIKAN DISINI:
  // 1. Kosongin array dependency jadi []
  // 2. Tambah komentar eslint-disable
  useEffect(() => { 
      fetchLookbooks(); 
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus lookbook ini?")) return;
    try {
        await api.delete(`/admin/lookbooks/${id}`);
        toast.success("Terhapus!");
        fetchLookbooks();
    } catch { toast.error("Gagal hapus."); }
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Manage Lookbook</h1>
            <Button asChild>
                <Link href="/admin/lookbooks/create">
                    <Plus className="w-4 h-4 mr-2" /> Add Lookbook
                </Link>
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {lookbooks.map((item) => (
                <div key={item.id} className="bg-card border border-border rounded-lg overflow-hidden group relative">
                    <div className="relative aspect-[3/4] bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image_url} className="w-full h-full object-cover" alt={item.title} />
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {item.items.length} Items
                        </div>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                        <h3 className="font-bold">{item.title}</h3>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}