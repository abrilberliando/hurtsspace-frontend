"use client";

import { useEffect, useState, useMemo } from "react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { 
  Truck, 
  Eye, 
  Printer, 
  MapPin, 
  Package, 
  User,
  Search,
  ArrowUpDown,
  Phone,
  CalendarDays,
  Receipt
} from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface OrderItem {
  id: number;
  product: { name: string; };
  variant: { size: string; };
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  invoice_number: string;
  total_price: number | string; 
  status: string;
  shipping_resi: string | null;
  shipping_courier: string | null;
  shipping_service: string | null;
  shipping_address: string;
  shipping_cost: number | string;
  note: string | null;
  created_at: string;
  user: { name: string; email: string; phone?: string }; 
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState(""); 
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const [resiInput, setResiInput] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isResiDialogOpen, setIsResiDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/admin/orders");
      setOrders(res.data.data.data || res.data.data); 
    } catch {
      toast.error("Gagal load order admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatPrice = (price: number | string) => {
    const num = Math.floor(Number(price));
    return num.toLocaleString("id-ID");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
  };

  const getItemsSummary = (items: OrderItem[]) => {
      if (items.length === 0) return "-";
      const firstItem = `${items[0].product.name} (${items[0].variant.size})`;
      if (items.length === 1) return firstItem;
      return `${firstItem} + ${items.length - 1} lainnya`;
  };

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((o) => 
        o.invoice_number.toLowerCase().includes(lowerQuery) ||
        o.user.name.toLowerCase().includes(lowerQuery)
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [orders, searchQuery, sortOrder]);


  const handleShipOrder = async () => {
    if (!selectedOrder || !resiInput) return toast.error("Resi wajib diisi!");

    try {
        await api.put(`/admin/orders/${selectedOrder.id}`, {
            status: 'shipped',
            shipping_resi: resiInput
        });
        toast.success(`Order ${selectedOrder.invoice_number} dikirim!`);
        setIsResiDialogOpen(false);
        setResiInput("");
        fetchOrders(); 
    } catch {
        toast.error("Gagal update status.");
    }
  };

 // 👇 UPDATE: PRINT LABEL LEBIH GEDE & DETAIL (RESIZE UP)
  const handlePrintLabel = (order: Order) => {
    // URL Logo (Simpan file 'logo.png' di folder 'public' project Next.js lo)
    const logoUrl = window.location.origin + "/logo.png"; 

    const printWindow = window.open('', '', 'width=900,height=700');
    if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>Shipping Label - ${order.invoice_number}</title>
                    <style>
                        /* Reset & Base */
                        body { font-family: 'Arial', sans-serif; padding: 25px; max-width: 800px; margin: 0 auto; border: 3px solid #000; box-sizing: border-box; }
                        
                        /* Header */
                        .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
                        .logo-img { max-height: 90px; margin-bottom: 5px; display: block; margin-left: auto; margin-right: auto; }
                        .fallback-logo { font-size: 20px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
                        .courier-badge { font-size: 20px; font-weight: 900; text-transform: uppercase; background: #000; color: #fff; padding: 8px 20px; display: inline-block; margin-top: 10px; border-radius: 4px; }
                        .inv-number { font-size: 16px; margin-top: 8px; font-family: 'Courier New', monospace; font-weight: bold; }

                        /* Layout Sections */
                        .section { border: 2px solid #000; padding: 15px; margin-bottom: 15px; background: #fff; }
                        .section-header { background: #000; color: #fff; font-weight: bold; font-size: 14px; text-transform: uppercase; padding: 4px 8px; display: inline-block; margin-bottom: 10px; }
                        
                        /* Data Penerima (Big & Clear) */
                        .recipient-row { margin-bottom: 6px; font-size: 16px; line-height: 1.4; }
                        .recipient-label { width: 90px; display: inline-block; font-weight: bold; vertical-align: top; color: #444; }
                        .recipient-val { display: inline-block; width: calc(100% - 100px); font-weight: 600; }
                        .recipient-name { font-size: 22px; font-weight: 900; text-transform: uppercase; }
                        .recipient-phone { font-size: 18px; font-weight: 800; letter-spacing: 1px; }
                        .address-val { font-size: 25px; line-height: 1.4; font-weight: 700; display: block; }

                        /* Pengirim */
                        .sender-info { font-size: 14px; line-height: 1.4; }

                        /* Table */
                        .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
                        .items-table th, .items-table td { border: 1px solid #000; padding: 8px; text-align: left; }
                        .items-table th { background: #eee; font-weight: 800; text-transform: uppercase; font-size: 12px; }
                        
                        .footer { margin-top: 20px; text-align: center; font-size: 12px; font-weight: bold; border-top: 1px dashed #000; padding-top: 15px; font-style: italic; }

                        @media print {
                            body { -webkit-print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <!-- Ganti Logo PNG -->
                        <img src="${logoUrl}" class="logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'" />
                        <div class="fallback-logo" style="display:none">HURTSSPACE</div>
                        
                        <div class="courier-badge">${order.shipping_courier || 'KURIR'} - ${order.shipping_service || 'REG'}</div>
                        <div class="inv-number">INV: ${order.invoice_number}</div>
                    </div>

                    <!-- Layout Penerima -->
                    <div class="section">
                        <div class="section-header">PENERIMA (RECIPIENT)</div>
                        <div class="recipient-row" style="margin-top: 5px;">
                            <span class="recipient-val address-val">${order.shipping_address}</span>
                        </div>
                    </div>

                    <!-- Layout Pengirim -->
                    <div class="section" style="border-style: dashed;">
                        <div class="section-header" style="background: #444;">PENGIRIM (SENDER)</div>
                        <div class="sender-info">
                            <strong>HURTSSPACE OFFICIAL STORE</strong><br>
                            0812-3456-7890<br>
                            Surabaya, Jawa Timur
                        </div>
                    </div>

                    <div class="section" style="border-color: #666; background: #fafafa;">
                        <div class="section-header" style="background: #666;">CATATAN PEMBELI (ORDER NOTE)</div>
                        <div style="font-size: 14px; font-weight: bold; font-style: italic; color: #000; padding: 5px 0;">
                            ${order.note ? order.note : '- Tidak ada catatan -'}
                        </div>
                    </div>

                    <!-- Items -->
                    <div style="margin-top: 20px;">
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>Produk</th>
                                    <th width="15%">Size</th>
                                    <th width="10%">Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${order.items.map(item => `
                                    <tr>
                                        <td>${item.product.name}</td>
                                        <td style="text-align:center; font-weight:bold;">${item.variant.size}</td>
                                        <td style="text-align:center;">${item.quantity}</td>
                                    </tr>
                                `).join('')}
                                <tr>
                                    <td colspan="2" style="text-align:right; font-weight:bold;">Ongkos Kirim</td>
                                    <td style="text-align:center;">${formatPrice(order.shipping_cost || 0)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="footer">
                         THANKS G!
                    </div>

                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    } else {
        toast.error("Pop-up diblokir browser, G! Izinkan pop-up dulu.");
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Manage Orders</h1>
                <p className="text-sm text-muted-foreground">List pesanan masuk & status pengiriman.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchOrders(); }}>Refresh Data</Button>
        </div>

        {/* --- TOOLBAR: SEARCH & SORT --- */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-card p-4 rounded-lg border border-border">
            <div className="relative w-full md:w-auto md:min-w-[300px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Cari Invoice / Nama User..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
                <ArrowUpDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                <Select 
                    value={sortOrder} 
                    onValueChange={(val: string) => setSortOrder(val as "newest" | "oldest")}
                >
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest" className="cursor-pointer">Terbaru</SelectItem>
                        <SelectItem value="oldest" className="cursor-pointer">Terlama</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        {/* --- DESKTOP VIEW (TABLE) --- */}
        <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground font-medium border-b border-border">
                        <tr>
                            <th className="px-6 py-4">Invoice</th>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Items</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredOrders.length === 0 ? (
                            <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Tidak ada pesanan ditemukan.</td></tr>
                        ) : (
                            filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-muted/50 transition">
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-mono font-bold text-base">{order.invoice_number}</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <CalendarDays className="w-3 h-3" />
                                                {formatDate(order.created_at)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-medium">{order.user.name}</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> {order.user.phone || "-"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 max-w-[200px] truncate text-muted-foreground align-top" title={getItemsSummary(order.items)}>
                                        {getItemsSummary(order.items)}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-green-600 align-top">
                                        {formatPrice(order.total_price)}
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <Badge className={`${getStatusColor(order.status)} border-none text-white uppercase`}>
                                            {order.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right align-top">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="secondary" onClick={() => { setSelectedOrder(order); setIsDetailDialogOpen(true); }}>
                                                <Eye className="w-4 h-4 mr-1" /> Detail
                                            </Button>
                                            {order.status === 'paid' && (
                                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setSelectedOrder(order); setResiInput(""); setIsResiDialogOpen(true); }}>
                                                    <Truck className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* --- MOBILE VIEW (COMPACT CARD) --- */}
        <div className="block md:hidden space-y-3">
            {filteredOrders.length === 0 ? (
                <div className="p-6 text-center border rounded-lg bg-card text-muted-foreground">Tidak ada pesanan.</div>
            ) : (
                filteredOrders.map((order) => (
                    <div key={order.id} className="bg-card border border-border rounded-lg p-4 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-0.5">
                                <p className="font-mono font-bold text-lg leading-none">{order.invoice_number}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <CalendarDays className="w-3 h-3" />
                                    {formatDate(order.created_at)}
                                </p>
                            </div>
                            <Badge className={`${getStatusColor(order.status)} border-none text-white uppercase text-xs shrink-0`}>
                                {order.status}
                            </Badge>
                        </div>
                        
                        <Separator />

                        <div className="text-sm space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 font-medium">
                                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>{order.user.name}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Phone className="w-3 h-3" />
                                    <span>{order.user.phone || '-'}</span>
                                </div>
                            </div>
                            
                            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border border-border/50 truncate">
                                <Package className="w-3 h-3 inline mr-1 mb-0.5" />
                                {getItemsSummary(order.items)}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <div className="font-bold text-green-600 text-base">
                                {formatPrice(order.total_price)}
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={() => { setSelectedOrder(order); setIsDetailDialogOpen(true); }}>
                                    <Eye className="w-4 h-4 mr-1" /> Detail
                                </Button>
                                {order.status === 'paid' && (
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setSelectedOrder(order); setResiInput(""); setIsResiDialogOpen(true); }}>
                                        <Truck className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* --- MODAL 1: INPUT RESI --- */}
        <Dialog open={isResiDialogOpen} onOpenChange={setIsResiDialogOpen}>
            <DialogContent className="w-[95vw] rounded-lg sm:max-w-lg">
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
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsResiDialogOpen(false)}>Batal</Button>
                    <Button onClick={handleShipOrder} className="bg-blue-600 hover:bg-blue-700 text-white">Simpan & Kirim</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* --- MODAL 2: DETAIL ORDER & PRINT (OFF CANVAS STYLE) --- */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
            <DialogContent className="w-[95vw] rounded-lg max-h-[90vh] overflow-y-auto sm:max-w-2xl bg-card p-4 sm:p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Package className="w-5 h-5" /> Detail Pesanan
                    </DialogTitle>
                    <DialogDescription>Invoice: {selectedOrder?.invoice_number}</DialogDescription>
                </DialogHeader>
                
                {selectedOrder && (
                    <div className="space-y-6">
                        {/* 👇 UPDATED: DETAIL HARGA LENGKAP */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Penerima</Label>
                                <div className="flex items-center gap-2 font-bold text-base"><User className="w-4 h-4" /> {selectedOrder.user.name}</div>
                                <div className="text-sm">{selectedOrder.user.email}</div>
                                <div className="text-sm font-medium text-muted-foreground">{selectedOrder.user.phone}</div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Rincian Biaya</Label>
                                <div className="space-y-1 bg-muted/30 p-3 rounded border border-border/50 text-sm">
                                     {/* Hitung Subtotal Item */}
                                     <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal Item:</span>
                                        <span>{formatPrice(Number(selectedOrder.total_price) - Number(selectedOrder.shipping_cost || 0))}</span>
                                     </div>
                                     <div className="flex justify-between">
                                        <span className="text-muted-foreground">Ongkir ({selectedOrder.shipping_courier || 'Kurir'}):</span>
                                        <span>{formatPrice(selectedOrder.shipping_cost || 0)}</span>
                                     </div>
                                     <div className="border-t border-border/50 my-1"></div>
                                     <div className="flex justify-between font-bold text-lg">
                                        <span>Total:</span>
                                        <span>{formatPrice(selectedOrder.total_price)}</span>
                                     </div>
                                </div>
                                <div className="flex gap-2">
                                    <Badge className={`${getStatusColor(selectedOrder.status)} border-none text-white uppercase text-xs w-fit`}>
                                        {selectedOrder.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-1">
                             <Label className="text-xs text-muted-foreground uppercase tracking-wider">Alamat Pengiriman</Label>
                             <div className="flex gap-2 text-sm bg-muted p-3 rounded-md border border-border">
                                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                <p className="leading-relaxed">{selectedOrder.shipping_address}</p>
                             </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-blue-600 uppercase tracking-wider">Catatan Pembeli</Label>
                            <div className="text-sm bg-blue-50/50 p-3 rounded-md border border-blue-100 italic text-zinc-700">
                                {selectedOrder.note || "Tidak ada catatan dari pembeli."}
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Daftar Barang</Label>
                            <div className="border border-border rounded-md divide-y divide-border max-h-48 overflow-y-auto">
                                {selectedOrder.items.map((item, idx) => (
                                    <div key={idx} className="p-3 flex justify-between items-center text-sm">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{item.product.name}</span>
                                            <span className="text-xs text-muted-foreground">Size: {item.variant.size}</span>
                                        </div>
                                        <div className="font-bold">x{item.quantity}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0 mt-6 flex-col-reverse sm:flex-row">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsDetailDialogOpen(false)}>Tutup</Button>
                    <Button onClick={() => selectedOrder && handlePrintLabel(selectedOrder)} className="w-full sm:w-auto md:ml-2 bg-zinc-800 text-white hover:bg-zinc-900">
                        <Printer className="w-4 h-4 mr-2" /> Cetak Label
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
}