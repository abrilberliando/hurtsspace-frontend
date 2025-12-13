"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2, ListFilter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AxiosError } from "axios";

interface Category {
  id: number;
  name: string;
  slug: string;
  products_count?: number; // Opsional kalau mau nampilin jumlah produk
}

export default function ManageCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [targetDeleteId, setTargetDeleteId] = useState<number | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data.data);
    } catch {
      toast.error("Gagal load kategori.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormName("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingId(cat.id);
    setFormName(cat.name);
    setIsModalOpen(true);
  };

  const openDeleteDialog = (id: number) => {
    setTargetDeleteId(id);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        if (editingId) {
            // Update
            await api.put(`/admin/categories/${editingId}`, { name: formName });
            toast.success("Kategori berhasil diupdate!");
        } else {
            // Create
            await api.post("/admin/categories", { name: formName });
            toast.success("Kategori baru dibuat!");
        }
        setIsModalOpen(false);
        fetchCategories(); // Refresh list
    } catch (error) {
        const err = error as AxiosError<{ message: string }>;
        toast.error(err.response?.data?.message || "Gagal menyimpan kategori.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!targetDeleteId) return;
    setIsSubmitting(true);
    try {
        await api.delete(`/admin/categories/${targetDeleteId}`);
        toast.success("Kategori dihapus.");
        fetchCategories();
    } catch (error) {
        const err = error as AxiosError<{ message: string }>;
        // Handle error validasi (misal masih ada produk)
        toast.error(err.response?.data?.message || "Gagal menghapus kategori.");
    } finally {
        setIsSubmitting(false);
        setIsDeleteOpen(false);
    }
  };

  if (loading) return <div className="p-8"><Skeleton className="h-[400px] w-full rounded-xl" /></div>;

  return (
    <div className="max-w-4xl mx-auto pb-10 space-y-6">
      
        <div className="flex justify-between items-center border-b border-border pb-6">
            <div>
                <h1 className="text-3xl font-black tracking-tight">Manage Categories</h1>
                <p className="text-muted-foreground text-sm mt-1">Atur kategori produk untuk memudahkan pencarian.</p>
            </div>
            <Button onClick={openCreateModal} size="lg" className="font-bold">
                <Plus className="w-5 h-5 mr-2" /> New Category
            </Button>
        </div>

        <Card className="border-border bg-card">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
                            <tr>
                                <th className="px-6 py-4 w-[100px]">#</th>
                                <th className="px-6 py-4">Nama Kategori</th>
                                <th className="px-6 py-4">Slug</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {categories.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Belum ada kategori.</td></tr>
                            ) : (
                                categories.map((cat, idx) => (
                                    <tr key={cat.id} className="hover:bg-muted/50 transition">
                                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{idx + 1}</td>
                                        <td className="px-6 py-4 font-bold text-base">{cat.name}</td>
                                        <td className="px-6 py-4 text-muted-foreground font-mono bg-muted/30 w-fit rounded px-2 py-1 text-xs">{cat.slug}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="outline" size="sm" onClick={() => openEditModal(cat)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(cat.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>

        {/* --- MODAL CREATE / EDIT --- */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingId ? "Edit Kategori" : "Buat Kategori Baru"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Nama Kategori</Label>
                        <Input 
                            placeholder="Contoh: T-Shirts, Hoodies..." 
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : "Simpan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        {/* --- ALERT DELETE --- */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini permanen. Pastikan tidak ada produk yang menggunakan kategori ini, atau penghapusan akan ditolak.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleDelete} 
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Menghapus..." : "Ya, Hapus"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}