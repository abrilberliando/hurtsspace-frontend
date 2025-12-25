"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { useCart } from "@/lib/useCart";
import api from "@/lib/axios";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { TicketPercent, X, Loader2 } from "lucide-react";
import AddressForm, { AddressData } from "@/components/shared/AddressForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; 

interface MidtransWindow extends Window {
  snap: { pay: (token: string, options: object) => void; };
}
interface CourierRate {
  courier_name: string;
  courier_service_name: string;
  price: number;
  duration: string;
}
interface Voucher {
    id: number;
    code: string;
    description?: string; 
    discount_amount: number;
    discount_type: 'percent' | 'fixed';
    max_discount_amount?: number; 
}

const formatRupiah = (amount: number) => {
    return amount.toLocaleString("id-ID");
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const cart = useCart();

  const [checkoutData, setCheckoutData] = useState<AddressData | null>(null);
  const [rates, setRates] = useState<CourierRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<CourierRate | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [processing, setProcessing] = useState(false);

  // STATE VOUCHER
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]); 
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [loadingVoucher, setLoadingVoucher] = useState(false);

  // ✨ SECURITY STATE
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
        setIsChecking(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Logic Redirect
  useEffect(() => {
    if (!isChecking) {
        if (!user) {
             router.push("/login");
        } else if (cart.items.length === 0) {
             router.push("/cart");
        }
    }
  }, [isChecking, user, cart.items, router]);

  // 👇 FETCH AVAILABLE VOUCHERS SAAT MOUNT
  useEffect(() => {
      const fetchVouchers = async () => {
          try {
              const res = await api.get("/vouchers"); 
              setAvailableVouchers(res.data.data || []);
          } catch (error) {
              console.log("No vouchers available or API error", error);
          }
      };
      if (user) fetchVouchers();
  }, [user]);


  // --- LOGIC SECURITY GATE ---
  
  if (isChecking) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center pt-20">
            <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
        </div>
      );
  }

  if (!user || cart.items.length === 0) {
      return null; 
  }

  // --- CONTENT CHECKOUT ---

  const handleAddressSubmit = async (data: AddressData) => {
    setCheckoutData(data);
    setLoadingRates(true);
    setRates([]);
    setSelectedRate(null);

    const fetchOngkir = async () => {
        try {
            const totalWeight = cart.totalWeight() || 1000;
            const res = await api.post("/shipping/cost", {
                destination_area_id: data.areaId,
                weight: totalWeight
            });
            
            const pricing = res.data.pricing || [];
            setRates(pricing);

            // 👇 AUTO SELECT CHEAPEST SHIPPING
            if (pricing.length > 0) {
                const cheapest = pricing.reduce((prev: CourierRate, curr: CourierRate) => 
                    prev.price < curr.price ? prev : curr
                );
                setSelectedRate(cheapest);
                toast.success(`Ongkir termurah (${cheapest.courier_name}) otomatis dipilih!`);
            } else {
                toast.error("Tidak ada kurir tersedia untuk rute ini.");
            }

        } catch {
            toast.error("Gagal cek ongkir.");
        }
    };

    const autoSaveProfile = async () => {
        try {
            const payload = {
                name: user?.name,
                phone: data.phone,
                address_detail: data.street,
                city_id: data.areaId,
                province_id: data.areaName,
            };
            const res = await api.put("/user", payload);
            if (user) {
                const updatedUser = { ...user, ...res.data.user };
                // 👇 UPDATE: Ambil token dari localStorage 'token' (Independent Key)
                const token = localStorage.getItem("token") || ""; 
                login(updatedUser, token); 
            }
        } catch (error) {
            console.error("Auto-save failed", error);
        }
    };

    await Promise.all([fetchOngkir(), autoSaveProfile()]);
    setLoadingRates(false);
  };

  // 👇 HANDLE SELECT VOUCHER
  const handleSelectVoucher = async (code: string) => {
    if (!code) return;
    setLoadingVoucher(true);
    try {
        const res = await api.post("/vouchers/check", { code });
        setAppliedVoucher(res.data.data); 
        toast.success("Voucher berhasil dipasang!", { description: "Potongan harga masuk G." });
    } catch (error) {
        const err = error as AxiosError<{ message: string }>;
        toast.error(err.response?.data?.message || "Kode voucher tidak valid.");
        setAppliedVoucher(null);
    } finally {
        setLoadingVoucher(false);
    }
  };

  const calculateDiscount = () => {
      if (!appliedVoucher) return 0;
      const subtotal = cart.totalPrice();
      let calculatedDiscount = 0;

      if (appliedVoucher.discount_type === 'percent') {
          calculatedDiscount = (subtotal * appliedVoucher.discount_amount) / 100;
          
          if (appliedVoucher.max_discount_amount !== undefined && calculatedDiscount > appliedVoucher.max_discount_amount) {
              calculatedDiscount = appliedVoucher.max_discount_amount;
          }
      } else {
          calculatedDiscount = appliedVoucher.discount_amount;
      }

      return Math.min(calculatedDiscount, subtotal);
  };

  const handlePay = async () => {
    if (!checkoutData || !selectedRate) {
        return toast.error("Pilih kurir dulu, G!");
    }

    setProcessing(true);

    try {
        const payload = {
            items: cart.items.map(item => ({
                product_id: item.productId,
                variant_id: item.variantId,
                quantity: item.quantity
            })),
            shipping_cost: selectedRate.price,
            shipping_courier: selectedRate.courier_name.toLowerCase(),
            shipping_service: selectedRate.courier_service_name,
            shipping_address: `${checkoutData.name} (${checkoutData.phone}) - ${checkoutData.street}, ${checkoutData.areaName}`,
            voucher_code: appliedVoucher?.code || null,
            discount_amount: calculateDiscount(),
        };

        const res = await api.post("/checkout", payload); 

        // BERSIHIN KERANJANG DISINI G!
        // 👇 FIX: Ganti 'as any' jadi tipe spesifik biar ESLint seneng
        const cartStore = cart as unknown as { removeAll?: () => void; clearCart?: () => void };

        if (cartStore.removeAll) {
            cartStore.removeAll(); 
        } else if (cartStore.clearCart) {
            cartStore.clearCart(); 
        }

        // Munculin Midtrans Snap
        const snap = (window as unknown as MidtransWindow).snap;

        if (snap) {
            snap.pay(res.data.snap_token, {
                onSuccess: () => { window.location.href = "/thank-you"; },
                onPending: () => {
                    toast.info("Pesanan dibuat, silakan bayar nanti.");
                    window.location.href = "/dashboard/orders"; 
                },
                onError: () => toast.error("Pembayaran Gagal!"),
                onClose: () => {
                    toast.warning("Lanjutin bayar di History ya G!");
                    window.location.href = "/dashboard/orders";
                }
            });
        }
    } catch (error) {
        const err = error as AxiosError<{ message: string }>;
        toast.error(err.response?.data?.message || "Gagal checkout. Cek koneksi atau data lo.");
    } finally {
        setProcessing(false);
    }
  };

  const defaultAddress = user ? {
      name: user.name,
      phone: user.phone || "",
      street: user.address_detail || "",
      areaId: user.city_id || "",
      areaName: user.province_id || ""
  } : undefined;

  const discountValue = calculateDiscount();
  const grandTotal = Math.max(0, (cart.totalPrice() + (selectedRate?.price || 0)) - discountValue);

  return (
    <main className="min-h-screen bg-background text-foreground pt-10 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-black mb-8 uppercase">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* KIRI */}
            <div className="space-y-6">
                <div>
                    <h2 className="font-bold text-xl mb-4">1. Shipping Details</h2>
                    <AddressForm 
                        defaultValues={defaultAddress}
                        onSave={handleAddressSubmit}
                        buttonText={loadingRates ? "MENGHITUNG..." : "KONFIRMASI & CEK ONGKIR"}
                        isLoading={loadingRates}
                    />
                </div>

                {rates.length > 0 && (
                    <Card className="bg-card border-border animate-in fade-in">
                        <CardContent className="p-6 space-y-4">
                            <h2 className="font-bold text-xl">2. Select Shipping</h2>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {rates.map((rate, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => setSelectedRate(rate)}
                                        className={`p-4 border rounded-lg cursor-pointer flex justify-between items-center transition
                                            ${selectedRate === rate ? 'border-foreground bg-muted ring-1 ring-foreground' : 'border-border hover:border-zinc-500'}
                                        `}
                                    >
                                        <div>
                                            <p className="font-bold uppercase text-sm">{rate.courier_name} - {rate.courier_service_name}</p>
                                            <p className="text-xs text-muted-foreground">Estimasi: {rate.duration}</p>
                                        </div>
                                        <p className="font-bold text-sm">Rp {formatRupiah(rate.price)}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* KANAN: RINGKASAN & VOUCHER */}
            <div>
                <Card className="bg-card border-border sticky top-24">
                    <CardContent className="p-6">
                        <h2 className="font-bold text-xl mb-6">Order Summary</h2>
                        
                        <div className="space-y-3 mb-6">
                            {cart.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                                    <span>Rp {formatRupiah(item.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                        
                        <Separator className="my-4" />
                        
                        {/* SELECT VOUCHER */}
                        <div className="flex gap-2 mb-4 items-center">
                            <div className="relative flex-1">
                                {appliedVoucher ? (
                                     <div className="flex items-center justify-between border border-green-500/50 bg-green-500/10 text-green-600 rounded-md px-3 py-2">
                                        <span className="font-bold text-sm flex items-center gap-2">
                                            <TicketPercent className="w-4 h-4" /> {appliedVoucher.code}
                                        </span>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 text-green-600 hover:text-red-500 hover:bg-transparent"
                                            onClick={() => setAppliedVoucher(null)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                     </div>
                                ) : (
                                    <Select onValueChange={handleSelectVoucher} disabled={loadingVoucher || availableVouchers.length === 0}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={availableVouchers.length > 0 ? "Pilih Promo / Voucher" : "Tidak ada voucher tersedia"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableVouchers.map((v) => (
                                                <SelectItem key={v.id} value={v.code}>
                                                    <span className="font-bold">{v.code}</span>
                                                    <span className="text-muted-foreground ml-2">
                                                        - {v.discount_type === 'percent' ? `${v.discount_amount}%` : `Rp ${formatRupiah(v.discount_amount)}`}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>

                        {appliedVoucher && (
                            <div className="text-right text-xs text-green-500 mb-4 font-medium">
                                Potongan: - Rp {formatRupiah(discountValue)}
                            </div>
                        )}

                        <Separator className="my-4" />
                        
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>Rp {formatRupiah(cart.totalPrice())}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Shipping</span>
                                <span>{selectedRate ? `Rp ${formatRupiah(selectedRate.price)}` : "-"}</span>
                            </div>
                            {appliedVoucher && (
                                <div className="flex justify-between text-green-500 font-bold">
                                    <span>Discount</span>
                                    <span>- Rp {formatRupiah(discountValue)}</span>
                                </div>
                            )}
                        </div>

                        <Separator className="my-4" />

                        <div className="flex justify-between text-lg font-black mb-6">
                            <span>TOTAL</span>
                            <span>Rp {formatRupiah(Math.max(grandTotal, 0))}</span>
                        </div>

                        <Button 
                            className="w-full h-14 font-bold text-lg" 
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