"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  price: number;
  category?: { name: string };
  images: { image_url: string }[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  // Pake useCallback biar fungsi ini stabil di memori
  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data.data.data);
    } catch {
      toast.error("Gagal load produk.");
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 👈 KITA KOSONGIN BIAR GAK LOOPING & MATIIN WARNING

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus produk ini?")) return;

    const toastId = toast.loading("Menghapus...");
    try {
      await api.delete(`/products/${id}`);
      toast.dismiss(toastId);
      toast.success("Produk berhasil dihapus.");
      fetchProducts(); // Refresh list setelah hapus
    } catch {
      toast.dismiss(toastId);
      toast.error("Gagal hapus produk.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Products</h1>
        <Button asChild>
          <Link href="/admin/products/create">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((item) => (
          <div
            key={item.id}
            className="bg-card border border-border rounded-lg overflow-hidden group"
          >
            <div className="relative aspect-square bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.images[0]?.image_url || "/placeholder.png"}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <div className="mb-2">
                <span className="text-[10px] uppercase font-bold bg-muted px-2 py-1 rounded text-muted-foreground">
                  {item.category?.name || "Uncategorized"}
                </span>
              </div>
              <h3 className="font-bold truncate">{item.name}</h3>
              <p className="text-sm text-muted-foreground">
                Rp {item.price.toLocaleString("id-ID")}
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
