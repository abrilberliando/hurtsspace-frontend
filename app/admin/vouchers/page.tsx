"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Trash2,
  Ticket,
  CalendarDays,
  DollarSign,
  Truck,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  discount_type: "percent" | "fixed";
  discount_amount: number;
  max_discount_amount: number | null; // 👈 Kolom baru
  target: "products" | "shipping"; // 👈 Kolom baru
  is_all_products: boolean; // 👈 Kolom baru
  stock: number;
  start_date: string | null;
  end_date: string | null;
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
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

  const formatDiscount = (voucher: Voucher) => {
    const amount = voucher.discount_amount.toLocaleString("id-ID");
    if (voucher.discount_type === "percent") {
      return (
        <div className="flex flex-col gap-1">
          <Badge className="bg-blue-600 text-white w-fit font-bold">
            {voucher.discount_amount}% OFF
          </Badge>
          {voucher.max_discount_amount && (
            <span className="text-[10px] text-muted-foreground italic">
              Maks: Rp {voucher.max_discount_amount.toLocaleString("id-ID")}
            </span>
          )}
        </div>
      );
    }
    return (
      <Badge className="bg-green-600 text-white w-fit font-bold">
        Rp {amount}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Forever";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const executeDelete = async () => {
    if (!targetVoucherId) return;
    const toastId = toast.loading("Menghapus voucher...");
    try {
      await api.delete(`/admin/vouchers/${targetVoucherId}`);
      toast.dismiss(toastId);
      toast.success("Voucher dihapus!");
      setVouchers((prev) => prev.filter((v) => v.id !== targetVoucherId));
    } catch {
      toast.dismiss(toastId);
      toast.error("Gagal hapus.");
    } finally {
      setIsDialogOpen(false);
      setTargetVoucherId(null);
    }
  };

  if (loading)
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black uppercase tracking-tighter">
          Voucher Lab
        </h1>
        <Button asChild className="font-bold">
          <Link href="/admin/vouchers/create">
            <Plus className="w-4 h-4 mr-2" /> NEW PROMO
          </Link>
        </Button>
      </div>

      {/* DESKTOP VIEW */}
      <div className="bg-card border-2 border-border rounded-none hidden md:block">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-xs uppercase font-black border-b-2 border-border">
            <tr>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Target</th> {/* 👈 Kolom Baru */}
              <th className="px-6 py-4">Value</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-medium">
            {vouchers.map((voucher) => (
              <tr
                key={voucher.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-6 py-4 font-mono font-bold flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-primary" /> {voucher.code}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs uppercase font-bold">
                    {voucher.target === "shipping" ? (
                      <>
                        <Truck className="w-3 h-3 text-orange-500" /> Shipping
                      </>
                    ) : (
                      <>
                        <Package className="w-3 h-3 text-blue-500" />{" "}
                        {voucher.is_all_products ? "All Products" : "Selected"}
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">{formatDiscount(voucher)}</td>
                <td className="px-6 py-4 font-bold">{voucher.stock}</td>
                <td className="px-6 py-4 text-right">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="font-bold border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                  >
                    <Link href={`/admin/vouchers/${voucher.id}`}>
                      MANAGE PRODUCTS
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => {
                      setTargetVoucherId(voucher.id);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE VIEW */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {vouchers.map((voucher) => (
          <Card key={voucher.id} className="border-2 rounded-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle className="text-lg font-mono font-black">
                {voucher.code}
              </CardTitle>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="font-bold border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
              >
                <Link href={`/admin/vouchers/${voucher.id}`}>
                  MANAGE PRODUCTS
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => {
                  setTargetVoucherId(voucher.id);
                  setIsDialogOpen(true);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 uppercase font-bold text-[10px]">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Target</span>
                <span>
                  {voucher.target} ({voucher.is_all_products ? "All" : "Custom"}
                  )
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Value</span>
                <div>{formatDiscount(voucher)}</div>
              </div>
              <div className="flex justify-between italic">
                <span className="text-muted-foreground">Valid Until</span>
                <span>{formatDate(voucher.end_date)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="rounded-none border-2">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Voucher?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">
              BATAL
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-destructive text-white rounded-none"
            >
              HAPUS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
