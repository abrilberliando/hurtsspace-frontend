"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, CreditCard, RefreshCw, XCircle, Truck, Copy, ExternalLink, Calendar, Receipt } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MidtransWindow extends Window {
  snap: {
    pay: (token: string, options: object) => void;
  };
}

interface Order {
  id: number;
  invoice_number: string;
  // 👇 UPDATE: Allow string biar aman
  total_price: number | string;
  status: string;
  shipping_resi: string | null;
  shipping_courier: string | null;
  snap_token: string | null;
  created_at: string;
  items: {
    product: { name: string; images: { image_url: string }[] };
    quantity: number;
    variant: { size: string };
  }[];
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders");
      setOrders(res.data.data);
    } catch { 
      toast.error("Gagal mengambil riwayat pesanan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 🔥 HELPER BARU: Logic Penyelamat Harga
  const displayPrice = (val: string | number): number => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 0;
    return Math.floor(num); 
  };

  const handlePayNow = (snapToken: string | null) => {
    if (!snapToken) return toast.error("Token pembayaran hilang.");
    const snap = (window as unknown as MidtransWindow).snap;
    snap.pay(snapToken, {
        onSuccess: () => { toast.success("Pembayaran Berhasil!"); fetchOrders(); },
        onPending: () => { toast.warning("Menunggu pembayaran..."); fetchOrders(); },
        onError: () => toast.error("Pembayaran Gagal!"),
        onClose: () => toast.info("Pop-up ditutup."),
    });
  };

  const executeCancelOrder = async (orderId: number) => {
    const toastId = toast.loading("Membatalkan pesanan...");
    try {
        await api.post(`/orders/${orderId}/cancel`);
        toast.dismiss(toastId);
        toast.success("Pesanan dibatalkan.");
        fetchOrders(); 
    } catch {
        toast.dismiss(toastId);
        toast.error("Gagal membatalkan pesanan.");
    }
  };

  const copyResi = (resi: string) => {
    navigator.clipboard.writeText(resi);
    toast.success("Nomor Resi disalin!");
  };

  const trackPackage = (courier: string, resi: string) => {
    const url = `https://cekresi.com/?noresi=${resi}`; 
    window.open(url, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20";
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-200 hover:bg-yellow-500/20";
      case "shipped": return "bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20";
      case "cancelled": return "bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20";
      default: return "bg-zinc-500/10 text-zinc-600 border-zinc-200";
    }
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-10 max-w-5xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );

  return (
    <main className="min-h-screen bg-background pb-20 pt-10">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-5xl space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tight">Order History</h1>
                <p className="text-muted-foreground text-sm mt-1">Lacak status pesanan dan riwayat belanja lo di sini.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchOrders(); }} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh Data
            </Button>
        </div>

        {/* CONTENT LIST */}
        {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
                <div className="bg-muted p-4 rounded-full mb-4">
                    <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold">Belum ada pesanan</h3>
                <p className="text-muted-foreground text-sm mb-6">Lo belum checkout barang apapun, G.</p>
                <Button asChild>
                    <a href="/shop">Mulai Belanja</a>
                </Button>
            </div>
        ) : (
            <div className="space-y-6">
                {orders.map((order) => (
                <Card 
                    key={order.id} 
                    className={`overflow-hidden transition-all duration-200 hover:shadow-md ${order.status === 'pending' ? 'border-yellow-500/50 ring-1 ring-yellow-500/20' : 'border-border'}`}
                >
                    {/* CARD HEADER */}
                    <div className="bg-muted/40 p-4 md:p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-border">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm font-bold">
                                <Receipt className="w-4 h-4 text-muted-foreground" />
                                {order.invoice_number}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {new Date(order.created_at).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                        <Badge variant="outline" className={`${getStatusColor(order.status)} px-3 py-1 text-xs font-bold uppercase tracking-wider`}>
                            {order.status}
                        </Badge>
                    </div>

                    {/* CARD CONTENT */}
                    <CardContent className="p-4 md:p-6">
                        <div className="space-y-6">
                            {/* List Item */}
                            <div className="space-y-4">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-start">
                                        <div className="w-16 h-16 bg-muted rounded-md overflow-hidden border border-border shrink-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img 
                                                src={item.product?.images?.[0]?.image_url || "https://ui-avatars.com/api/?name=Product&background=random"} 
                                                className="w-full h-full object-cover" 
                                                alt="Product"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate pr-4">
                                                {item.product?.name || <span className="text-red-500 italic">Produk dihapus</span>}
                                            </p>
                                            <p className="text-muted-foreground text-xs mt-1">
                                                Size: <span className="font-medium text-foreground">{item.variant?.size || "-"}</span> &bull; Qty: {item.quantity}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>

                    {/* CARD FOOTER (ACTIONS & TOTAL) */}
                    <div className="bg-muted/20 p-4 md:p-6 border-t border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Total Tagihan</span>
                            {/* 👇 UPDATE: Pake displayPrice disini */}
                            <span className="text-xl font-black">
                                Rp {displayPrice(order.total_price).toLocaleString("id-ID")}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            {/* ACTION: PENDING */}
                            {order.status === 'pending' && (
                                <>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-500/10 font-bold">
                                                <XCircle className="w-4 h-4 mr-2" /> Batalkan
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Batalkan Pesanan?</AlertDialogTitle>
                                                <AlertDialogDescription>Pesanan akan dihapus dan stok dikembalikan ke toko.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Gak Jadi</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => executeCancelOrder(order.id)} className="bg-red-600 hover:bg-red-700 text-white">Ya, Batalin</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

                                    <Button size="sm" className="font-bold bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg shadow-yellow-500/20" onClick={() => handlePayNow(order.snap_token)}>
                                        <CreditCard className="w-4 h-4 mr-2" /> BAYAR SEKARANG
                                    </Button>
                                </>
                            )}

                            {/* ACTION: SHIPPED */}
                            {order.status === 'shipped' && order.shipping_resi && (
                                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-end md:items-center">
                                    <div className="flex items-center gap-2 bg-background p-1.5 px-3 rounded-md border border-border text-xs font-mono">
                                        <Truck className="w-3 h-3 text-blue-500" />
                                        <span className="font-bold">{order.shipping_resi}</span>
                                        <button onClick={() => copyResi(order.shipping_resi!)} className="ml-2 text-muted-foreground hover:text-foreground">
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <Button variant="outline" size="sm" className="text-xs font-bold" onClick={() => trackPackage(order.shipping_courier || 'jne', order.shipping_resi!)}>
                                        <ExternalLink className="w-3 h-3 mr-2" /> LACAK
                                    </Button>
                                </div>
                            )}

                             {/* ACTION: PAID */}
                             {order.status === 'paid' && (
                                <span className="text-xs font-medium text-green-600 flex items-center gap-1 bg-green-100 px-3 py-1.5 rounded-full">
                                    <Package className="w-3 h-3" /> Menunggu Pengiriman
                                </span>
                            )}
                        </div>
                    </div>
                </Card>
                ))}
            </div>
        )}
      </div>
    </main>
  );
}