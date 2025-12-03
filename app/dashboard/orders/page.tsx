"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, CreditCard, RefreshCw, XCircle, Truck, Copy, ExternalLink } from "lucide-react";
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
  total_price: number;
  status: string;
  shipping_resi: string | null;
  shipping_courier: string | null; // Tambahin ini biar tau kurirnya apa
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
    // setLoading(true); // Opsional
    try {
      const res = await api.get("/orders");
      setOrders(res.data.data);
    } catch { 
      // 👇 HAPUS '(error)' DI SINI BIAR BERSIH
      // Dan ganti console.error jadi toast biar user tau kalau error
      toast.error("Gagal mengambil riwayat pesanan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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

  // 👇 FUNGSI COPY RESI
  const copyResi = (resi: string) => {
    navigator.clipboard.writeText(resi);
    toast.success("Nomor Resi disalin!");
  };

  // 👇 FUNGSI LACAK PAKET (Buka CekResi.com)
  const trackPackage = (courier: string, resi: string) => {
    // Redirect ke web tracking pihak ketiga
    const url = `https://cekresi.com/?noresi=${resi}`; 
    window.open(url, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500 hover:bg-green-600";
      case "pending": return "bg-yellow-500 hover:bg-yellow-600";
      case "shipped": return "bg-blue-500 hover:bg-blue-600";
      case "cancelled": return "bg-red-500 hover:bg-red-600";
      default: return "bg-zinc-500";
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black uppercase tracking-tight">Order History</h1>
          <Button variant="ghost" size="sm" onClick={() => { setLoading(true); fetchOrders(); }}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-lg">
           <Package className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
           <p className="text-muted-foreground">Belum ada pesanan, G.</p>
        </div>
      ) : (
        orders.map((order) => (
          <Card key={order.id} className={`bg-card border overflow-hidden ${order.status === 'pending' ? 'border-yellow-500/50 shadow-sm' : 'border-border'}`}>
             
             {/* Header */}
             <div className="bg-muted/30 p-4 flex justify-between items-center text-sm border-b border-border">
                <div>
                    <span className="font-bold mr-4">{order.invoice_number}</span>
                    <span className="text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
                <Badge className={`${getStatusColor(order.status)} text-white border-none uppercase font-bold`}>
                    {order.status}
                </Badge>
             </div>

             <CardContent className="p-4">
                {/* List Barang */}
                <div className="space-y-4 mb-6">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-center">
                            <div className="w-12 h-12 bg-muted rounded overflow-hidden border border-border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={item.product?.images?.[0]?.image_url || "https://ui-avatars.com/api/?name=Product&background=random"} 
                                    className="w-full h-full object-cover" 
                                    alt="Product"
                                />
                            </div>
                            <div className="text-sm">
                                <p className="font-bold">
                                    {item.product?.name || <span className="text-red-500 italic">Produk dihapus</span>}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    Size: {item.variant?.size || "-"} x{item.quantity}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Footer Action */}
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center border-t border-border pt-4 gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground">Total Tagihan</p>
                        <p className="font-black text-lg">Rp {order.total_price.toLocaleString("id-ID")}</p>
                    </div>

                    <div className="flex gap-2 items-center w-full md:w-auto">
                        
                        {/* AKSI: PENDING */}
                        {order.status === 'pending' && (
                            <>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="outline" className="text-red-500 border-red-500 hover:bg-red-500/10 flex-1 md:flex-none font-bold">
                                            <XCircle className="w-4 h-4 mr-2" /> BATAL
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Batalkan Pesanan?</AlertDialogTitle>
                                            <AlertDialogDescription>Stok akan dikembalikan ke toko.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Gak Jadi</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => executeCancelOrder(order.id)} className="bg-red-600 hover:bg-red-700 text-white">Ya, Batalin</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                <Button size="sm" className="font-bold bg-yellow-500 hover:bg-yellow-600 text-white flex-1 md:flex-none" onClick={() => handlePayNow(order.snap_token)}>
                                    <CreditCard className="w-4 h-4 mr-2" /> BAYAR
                                </Button>
                            </>
                        )}

                        {/* AKSI: SHIPPED / DIKIRIM */}
                        {order.status === 'shipped' && order.shipping_resi && (
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-md border border-border">
                                    <Truck className="w-4 h-4 text-blue-500" />
                                    <span className="font-mono font-bold text-sm tracking-wide">{order.shipping_resi}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyResi(order.shipping_resi!)}>
                                        <Copy className="w-3 h-3" />
                                    </Button>
                                </div>
                                <Button size="sm" variant="outline" className="h-8 text-xs w-full" onClick={() => trackPackage(order.shipping_courier || 'jne', order.shipping_resi!)}>
                                    <ExternalLink className="w-3 h-3 mr-2" /> LACAK PAKET
                                </Button>
                            </div>
                        )}

                        {/* AKSI: PAID (Menunggu Resi) */}
                        {order.status === 'paid' && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 px-3 py-1">
                                MENUNGGU PENGIRIMAN
                            </Badge>
                        )}

                    </div>
                </div>
             </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}