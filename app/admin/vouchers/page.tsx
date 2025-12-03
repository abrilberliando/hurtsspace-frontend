"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Ticket } from "lucide-react";
import { toast } from "sonner";

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

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus voucher ini? User gak bisa pake lagi lho.")) return;
    try {
        await api.delete(`/admin/vouchers/${id}`);
        toast.success("Voucher dihapus!");
        fetchVouchers();
    } catch {
        toast.error("Gagal hapus.");
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Manage Vouchers</h1>
            <Button asChild>
                <Link href="/admin/vouchers/create">
                    <Plus className="w-4 h-4 mr-2" /> Create Voucher
                </Link>
            </Button>
        </div>

        <div className="bg-card border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-zinc-900 text-zinc-400 font-medium border-b border-zinc-800">
                    <tr>
                        <th className="px-6 py-4">Code</th>
                        <th className="px-6 py-4">Discount</th>
                        <th className="px-6 py-4">Stock</th>
                        <th className="px-6 py-4">Validity</th>
                        <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                    {vouchers.map((voucher) => (
                        <tr key={voucher.id} className="hover:bg-zinc-900/50 transition">
                            <td className="px-6 py-4 font-mono font-bold text-white flex items-center gap-2">
                                <Ticket className="w-4 h-4 text-green-500" />
                                {voucher.code}
                            </td>
                            <td className="px-6 py-4">
                                {voucher.discount_type === 'percent' 
                                    ? <Badge className="bg-blue-900 text-blue-200 hover:bg-blue-900">{voucher.discount_amount}% OFF</Badge>
                                    : <Badge className="bg-green-900 text-green-200 hover:bg-green-900">- Rp {voucher.discount_amount.toLocaleString("id-ID")}</Badge>
                                }
                            </td>
                            <td className="px-6 py-4 font-bold">{voucher.stock} pcs</td>
                            <td className="px-6 py-4 text-xs text-zinc-500">
                                {voucher.end_date 
                                    ? `Until ${new Date(voucher.end_date).toLocaleDateString()}` 
                                    : 'Forever'}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-950/30 hover:text-red-400" onClick={() => handleDelete(voucher.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {vouchers.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-zinc-500">
                                Belum ada voucher promo. Bikin baru gih!
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
}