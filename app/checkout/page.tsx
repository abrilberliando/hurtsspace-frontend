"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { useCart } from "@/lib/useCart";
import api from "@/lib/axios";
import { AxiosError } from "axios"; // 👈 Import ini buat handle error type
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";

interface MidtransWindow extends Window {
  snap: {
    pay: (token: string, options: object) => void;
  };
}

interface CourierRate {
  courier_name: string;
  courier_service_name: string;
  price: number;
  duration: string;
}

interface Area {
  id: string;
  name: string;
  administrative_division_level_1_name: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const cart = useCart();

  const [address, setAddress] = useState("");
  const [areaQuery, setAreaQuery] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("");

  const [rates, setRates] = useState<CourierRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<CourierRate | null>(null);
  
  const [loadingArea, setLoadingArea] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user) router.push("/login");
    if (cart.items.length === 0) router.push("/cart");
  }, [user, cart.items, router]);

  const handleSearchArea = async () => {
    if (areaQuery.length < 3) return toast.error("Ketik minimal 3 huruf, G!");
    setLoadingArea(true);
    try {
      const res = await api.get(`/shipping/areas?query=${areaQuery}`);
      setAreas(res.data.areas || []); 
    } catch { 
      // Hapus 'err' karena gak dipake (Fix unused vars)
      toast.error("Gagal cari kota.");
    } finally {
      setLoadingArea(false);
    }
  };

  const handleSelectArea = async (areaId: string) => {
    setSelectedArea(areaId);
    setAreas([]); 
    setLoadingRates(true); // Kita pake variable ini di UI nanti

    try {
      const totalWeight = cart.totalWeight() || 1000;

      const res = await api.post("/shipping/cost", {
        destination_area_id: areaId,
        weight: totalWeight
      });
      
      const pricing = res.data.pricing || [];
      setRates(pricing);
    } catch {
      // Hapus 'err' karena gak dipake
      toast.error("Gagal cek ongkir.");
    } finally {
      setLoadingRates(false);
    }
  };

  const handlePay = async () => {
    if (!address || !selectedArea || !selectedRate) {
        return toast.error("Lengkapi alamat & pilih kurir dulu, G!");
    }

    setProcessing(true);

    try {
        const payload = {
            items: cart.items.map(item => ({
                variant_id: item.variantId,
                quantity: item.quantity
            })),
            shipping_cost: selectedRate.price,
            shipping_courier: selectedRate.courier_name.toLowerCase(),
            shipping_service: selectedRate.courier_service_name,
            shipping_address: address, 
        };

        const res = await api.post("/checkout", payload);

        // 👇 FIX TS-IGNORE & ANY: Pake casting (window as any)
        const snap = (window as unknown as MidtransWindow).snap;

        if (snap) {
            snap.pay(res.data.snap_token, {
                // Hapus parameter 'result' karena gak dipake (Fix unused vars & any)
                onSuccess: function() {
                    toast.success("Pembayaran Berhasil!");
                    cart.clearCart();
                    router.push("/"); 
                },
                onPending: function() {
                    toast.warning("Menunggu pembayaran...");
                    router.push("/");
                },
                onError: function() {
                    toast.error("Pembayaran Gagal!");
                },
                onClose: function() {
                    toast.info("Pop-up ditutup tanpa bayar.");
                }
            });
        }

    } catch (error) {
        // Fix Error handling type safe
        const err = error as AxiosError<{ message: string }>;
        toast.error(err.response?.data?.message || "Gagal checkout.");
    } finally {
        setProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground pt-10 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-black mb-8 uppercase">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* KIRI: ALAMAT & KURIR */}
            <div className="space-y-6">
                <Card className="bg-card border-border">
                    <CardContent className="p-6 space-y-4">
                        <h2 className="font-bold text-xl">Shipping Address</h2>
                        
                        <div className="space-y-2">
                            <Label>Full Address</Label>
                            <Textarea 
                                placeholder="Jalan, Nomor Rumah, RT/RW..." 
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 relative">
                            <Label>City / District</Label>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="Ketik nama kecamatan/kota..." 
                                    value={areaQuery}
                                    onChange={(e) => setAreaQuery(e.target.value)}
                                />
                                <Button size="icon" onClick={handleSearchArea} disabled={loadingArea}>
                                    {loadingArea ? <Loader2 className="animate-spin" /> : <Search className="w-4 h-4" />}
                                </Button>
                            </div>

                            {areas.length > 0 && (
                                <div className="absolute top-full left-0 w-full bg-popover border border-border z-10 max-h-48 overflow-y-auto rounded-md shadow-lg mt-1">
                                    {areas.map((area) => (
                                        <div 
                                            key={area.id}
                                            className="p-3 text-sm hover:bg-muted cursor-pointer transition"
                                            onClick={() => handleSelectArea(area.id)}
                                        >
                                            <span className="font-bold">{area.name}</span>
                                            <span className="text-xs text-muted-foreground block">{area.administrative_division_level_1_name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {selectedArea && <p className="text-xs text-green-500">Area selected!</p>}
                        </div>

                    </CardContent>
                </Card>

                {/* PILIH KURIR */}
                {/* 👇 IMPLEMENTASI loadingRates DISINI (Biar var-nya kepake & UX bagus) */}
                {loadingRates ? (
                    <div className="p-10 text-center border rounded-lg bg-muted/20 animate-pulse">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Calculating shipping costs...</p>
                    </div>
                ) : rates.length > 0 && (
                    <Card className="bg-card border-border">
                        <CardContent className="p-6 space-y-4">
                            <h2 className="font-bold text-xl">Select Shipping</h2>
                            <div className="space-y-2">
                                {rates.map((rate, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => setSelectedRate(rate)}
                                        className={`p-4 border rounded-lg cursor-pointer flex justify-between items-center transition
                                            ${selectedRate === rate ? 'border-foreground bg-muted' : 'border-border hover:border-zinc-500'}
                                        `}
                                    >
                                        <div>
                                            <p className="font-bold uppercase">{rate.courier_name} - {rate.courier_service_name}</p>
                                            <p className="text-xs text-muted-foreground">Estimasi: {rate.duration}</p>
                                        </div>
                                        <p className="font-bold">Rp {rate.price.toLocaleString("id-ID")}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* KANAN: RINGKASAN ORDER */}
            <div>
                <Card className="bg-card border-border sticky top-24">
                    <CardContent className="p-6">
                        <h2 className="font-bold text-xl mb-6">Order Summary</h2>
                        
                        <div className="space-y-3 mb-6">
                            {cart.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                                    <span>Rp {(item.price * item.quantity).toLocaleString("id-ID")}</span>
                                </div>
                            ))}
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>Rp {cart.totalPrice().toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Shipping</span>
                                <span>{selectedRate ? `Rp ${selectedRate.price.toLocaleString("id-ID")}` : "-"}</span>
                            </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="flex justify-between text-lg font-black mb-6">
                            <span>TOTAL</span>
                            <span>Rp {(cart.totalPrice() + (selectedRate?.price || 0)).toLocaleString("id-ID")}</span>
                        </div>

                        <Button 
                            className="w-full h-12 font-bold text-lg" 
                            disabled={processing || !selectedRate}
                            onClick={handlePay}
                        >
                            {processing ? "PROCESSING..." : "PAY NOW"}
                        </Button>
                    </CardContent>
                </Card>
            </div>

        </div>
      </div>
    </main>
  );
}