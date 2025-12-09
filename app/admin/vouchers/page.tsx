"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Ticket, CalendarDays, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components

// 👇 Import AlertDialog components for better UX (as previously discussed)
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


interface Voucher {
    id: number;
    code: string;
    discount_type: 'percent' | 'fixed';
    discount_amount: number;
    stock: number;
    start_date: string | null;
    end_date: string | null;
}

export default function AdminVouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);

    // State untuk AlertDialog
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [targetVoucherId, setTargetVoucherId] = useState<number | null>(null);

    const fetchVouchers = async () => {
        try {
            const res = await api.get("/admin/vouchers");
            setVouchers(res.data.data);
        } catch {
            toast.error("Gagal load voucher.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, []);

    // Helper untuk format diskon
    const formatDiscount = (voucher: Voucher) => {
        if (voucher.discount_type === 'percent') {
            return (
                <Badge className="bg-blue-600 text-white hover:bg-blue-600 font-bold">
                    {voucher.discount_amount}% OFF
                </Badge>
            );
        }
        return (
            <Badge className="bg-green-600 text-white hover:bg-green-600 font-bold">
                - Rp {voucher.discount_amount.toLocaleString("id-ID")}
            </Badge>
        );
    };
    
    // Helper untuk format tanggal
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Forever';
        return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // Fungsi untuk membuka Dialog (Ganti alert() yang lama)
    const openDeleteDialog = (id: number) => {
        setTargetVoucherId(id);
        setIsDialogOpen(true);
    };

    // Fungsi execute delete (dipanggil dari AlertDialog)
    const executeDelete = async () => {
        if (!targetVoucherId) return;

        const toastId = toast.loading("Menghapus voucher...");
        try {
            await api.delete(`/admin/vouchers/${targetVoucherId}`);
            toast.dismiss(toastId);
            toast.success("Voucher dihapus!");
            // Update UI
            setVouchers(prev => prev.filter(v => v.id !== targetVoucherId));
        } catch {
            toast.dismiss(toastId);
            toast.error("Gagal hapus.");
        } finally {
            setIsDialogOpen(false);
            setTargetVoucherId(null);
        }
    };


    if (loading) {
        return (
            <div className="space-y-6">
                 <div className="flex justify-between items-center"><Skeleton className="h-8 w-64" /><Skeleton className="h-10 w-32" /></div>
                 <div className="space-y-3">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                 </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Manage Vouchers</h1>
                <Button asChild>
                    <Link href="/admin/vouchers/create">
                        <Plus className="w-4 h-4 mr-2" /> Create Voucher
                    </Link>
                </Button>
            </div>

            {/* ---------------------------------------------------- */}
            {/* 1. DESKTOP VIEW (TABLE) - Visible on screens >= md */}
            {/* ---------------------------------------------------- */}
            <div className="bg-card border border-border rounded-lg overflow-x-auto hidden md:block">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
                        <tr>
                            <th className="px-6 py-4">Code</th>
                            <th className="px-6 py-4">Discount</th>
                            <th className="px-6 py-4">Stock</th>
                            <th className="px-6 py-4">Validity</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-foreground/80">
                        {vouchers.map((voucher) => (
                            <tr key={voucher.id} className="hover:bg-muted/50 transition">
                                <td className="px-6 py-4 font-mono font-bold text-foreground flex items-center gap-2">
                                    <Ticket className="w-4 h-4 text-primary" />
                                    {voucher.code}
                                </td>
                                <td className="px-6 py-4">
                                    {formatDiscount(voucher)}
                                </td>
                                <td className="px-6 py-4 font-bold">{voucher.stock} pcs</td>
                                <td className="px-6 py-4 text-xs text-muted-foreground">
                                    {formatDate(voucher.end_date)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" 
                                        onClick={() => openDeleteDialog(voucher.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {vouchers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                                    Belum ada voucher promo. Bikin baru gih!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ---------------------------------------------------- */}
            {/* 2. MOBILE VIEW (CARD) - Visible only on screens < md */}
            {/* ---------------------------------------------------- */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {vouchers.map((voucher) => (
                    <Card key={voucher.id} className="bg-card border border-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                            <CardTitle className="flex items-center gap-2 text-lg font-mono font-bold text-foreground">
                                <Ticket className="w-5 h-5 text-primary" />
                                {voucher.code}
                            </CardTitle>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => openDeleteDialog(voucher.id)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3 px-4 pb-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="w-4 h-4" /> Discount</span>
                                <div>{formatDiscount(voucher)}</div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Stock</span>
                                <span className="font-bold">{voucher.stock} pcs</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground flex items-center gap-1"><CalendarDays className="w-4 h-4" /> Valid Until</span>
                                <span className="text-xs font-medium">{formatDate(voucher.end_date)}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {vouchers.length === 0 && (
                    <div className="py-10 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                        Belum ada voucher promo. Bikin baru gih!
                    </div>
                )}
            </div>

            {/* 👇 ALERT DIALOG (KONFIRMASI DELETE) */}
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogContent className="w-[90%] max-w-sm rounded-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Voucher {vouchers.find(v => v.id === targetVoucherId)?.code || "ini"}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan menghapus voucher secara permanen. User tidak bisa lagi menggunakan kode ini. Apakah kamu yakin?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-2">
                        <AlertDialogCancel className="sm:w-auto w-full">Batal</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={executeDelete} 
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground w-full sm:w-auto"
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}