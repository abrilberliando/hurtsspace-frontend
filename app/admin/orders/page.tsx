"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Truck } from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
    id: number;
    // Tambahin properti lain kalau perlu
}

interface Order {
  id: number;
  invoice_number: string;
  total_price: number;
  status: string;
  shipping_resi: string | null;
  shipping_courier: string | null;
  shipping_service: string | null;
  created_at: string;
  user: { name: string; email: string };
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [resiInput, setResiInput] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/admin/orders");
      setOrders(res.data.data.data); 
    } catch {
      toast.error("Gagal load order admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleShipOrder = async () => {
    if (!selectedOrder || !resiInput) return toast.error("Resi wajib diisi!");

    try {
        await api.put(`/admin/orders/${selectedOrder.id}`, {
            status: 'shipped',
            shipping_resi: resiInput
        });
        toast.success(`Order ${selectedOrder.invoice_number} dikirim!`);
        setIsDialogOpen(false);
        setResiInput("");
        fetchOrders(); 
    } catch {
        toast.error("Gagal update status.");
    }
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

  if (loading) return <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight">Manage Orders</h1>
            <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchOrders(); }}>Refresh Data</Button>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
                        <tr>
                            <th className="px-6 py-4">Invoice</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4">Courier</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-muted/50 transition">
                                <td className="px-6 py-4 font-mono font-bold">{order.invoice_number}</td>
                                <td className="px-6 py-4">
                                    <p className="font-bold">{order.user.name}</p>
                                    <p className="text-xs text-muted-foreground">{order.user.email}</p>
                                </td>
                                <td className="px-6 py-4">Rp {order.total_price.toLocaleString("id-ID")}</td>
                                <td className="px-6 py-4 uppercase">
                                    {order.shipping_courier || "-"} {order.shipping_service}
                                </td>
                                <td className="px-6 py-4">
                                    <Badge className={`${getStatusColor(order.status)} border-none text-white uppercase`}>
                                        {order.status}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {order.status === 'paid' ? (
                                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button 
                                                    size="sm" 
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                                    onClick={() => { setSelectedOrder(order); setResiInput(""); }}
                                                >
                                                    <Truck className="w-4 h-4 mr-2" /> SHIP
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="bg-background border-border text-foreground">
                                                <DialogHeader>
                                                    <DialogTitle>Input Nomor Resi</DialogTitle>
                                                    <DialogDescription>
                                                        Masukkan nomor resi untuk order <b>{selectedOrder?.invoice_number}</b>.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="py-4">
                                                    <Label className="mb-2 block">No. Resi / AWB</Label>
                                                    <Input 
                                                        value={resiInput} 
                                                        onChange={(e) => setResiInput(e.target.value)}
                                                        placeholder="Contoh: JP1234567890"
                                                        className="bg-muted border-input text-foreground"
                                                    />
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                                                    <Button onClick={handleShipOrder} className="bg-blue-600 hover:bg-blue-700 text-white">Update Status</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic font-mono bg-muted px-2 py-1 rounded">
                                            {order.status === 'shipped' ? order.shipping_resi : '-'}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}