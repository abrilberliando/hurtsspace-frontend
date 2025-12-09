"use client";

import { useEffect, useState, useMemo } from "react"; // 👈 Tambah useMemo
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
import { TicketPercent, X } from "lucide-react";
import AddressForm, { AddressData } from "@/components/shared/AddressForm";

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
    code: string;
    discount_amount: number; // Persentase (e.g., 10) atau Jumlah Tetap (e.g., 50000)
    discount_type: 'percent' | 'fixed';
    max_discount_amount?: number; 
}

// ✨ FUNGSI UTILITY BARU: FORMATTER
const formatRupiah = (amount: number) => {
    // Karena fungsi ini akan dipanggil di client, kita pastikan pake locale yang benar.
    // Kita tetap akan menggunakan state untuk menunda render pertamanya.
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

  // STATE VOUCHER 🎟️
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [loadingVoucher, setLoadingVoucher] = useState(false);

  // ✨ STATE BARU UNTUK MENCEGAH HYDRATION ERROR
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // ✨ SET isClient JADI TRUE SETELAH KOMPONEN MOUNT (DI SISI CLIENT)
    setIsClient(true); 

    if (!user) router.push("/login");
    if (cart.items.length === 0) router.push("/cart");
  }, [user, cart.items, router]);
  
  // ... (handleAddressSubmit, handleApplyVoucher, handlePay logic lainnya tetap sama)
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
            setRates(res.data.pricing || []);
            toast.success("Ongkir berhasil dihitung!");
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

  const handleApplyVoucher = async () => {
    if (!voucherCode) return;
    setLoadingVoucher(true);
    try {
        const res = await api.post("/vouchers/check", { code: voucherCode });
        setAppliedVoucher(res.data.data); 
        toast.success("Voucher berhasil dipasang!", { description: "Potongan harga masuk G." });
    } catch (error) {
        const err = error as AxiosError<{ message: string }>;
        toast.error(err.response?.data?.message || "Kode voucher salah/habis.");
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

        // 2. BERSIHIN KERANJANG DISINI G!
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cartStore = cart as any;

        if (cartStore.removeAll) {
            cartStore.removeAll(); 
        } else if (cartStore.clearCart) {
            cartStore.clearCart(); 
        }

        // 3. Munculin Midtrans Snap
        const snap = (window as unknown as MidtransWindow).snap;

        if (snap) {
            snap.pay(res.data.snap_token, {
                onSuccess: () => {
                    window.location.href = "/thank-you"; 
                },
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

  // 👇 PERHITUNGAN
  const defaultAddress = user ? {
      name: user.name,
      phone: user.phone || "",
      street: user.address_detail || "",
      areaId: user.city_id || "",
      areaName: user.province_id || ""
  } : undefined;

  const discountValue = calculateDiscount();
  const grandTotal = Math.max(0, (cart.totalPrice() + (selectedRate?.price || 0)) - discountValue);

  // ✨ Render Placeholder di Server, Render Angka di Client
  const DisplayRupiah = ({ value }: { value: number }) => {
    if (!isClient) return <span>-</span>; // Tampilkan "-" saat SSR
    return <span>Rp {formatRupiah(value)}</span>;
  };
  
  const DisplayRupiahPositive = ({ value }: { value: number }) => {
    if (!isClient) return <span>-</span>;
    return <span>- Rp {formatRupiah(value)}</span>;
  };
  
  const DisplayRupiahShipping = ({ value }: { value: number }) => {
    if (!isClient) return <span>-</span>;
    return <span>{selectedRate ? `Rp ${formatRupiah(value)}` : "-"}</span>;
  };

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
                                        {/* FIX LOKALISASI DI ONGKIR */}
                                        <p className="font-bold text-sm">Rp {isClient ? formatRupiah(rate.price) : '-'}</p>
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
                                    {/* FIX LOKALISASI DI ITEM PRICE */}
                                    <span>Rp {isClient ? formatRupiah(item.price * item.quantity) : '-'}</span> 
                                </div>
                            ))}
                        </div>
                        
                        <Separator className="my-4" />
                        
                        {/* INPUT VOUCHER */}
                        <div className="flex gap-2 mb-4">
                            <div className="relative flex-1">
                                <TicketPercent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Promo Code" 
                                    className="pl-9" 
                                    value={voucherCode}
                                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                    disabled={!!appliedVoucher}
                                />
                            </div>
                            {appliedVoucher ? (
                                <Button variant="destructive" size="icon" onClick={() => { setAppliedVoucher(null); setVoucherCode(""); }}>
                                    <X className="w-4 h-4" />
                                </Button>
                            ) : (
                                <Button onClick={handleApplyVoucher} disabled={loadingVoucher || !voucherCode}>
                                    APPLY
                                </Button>
                            )}
                        </div>

                        {appliedVoucher && (
                            <div className="bg-green-500/10 text-green-500 text-xs p-2 rounded mb-4 flex justify-between">
                                <span>Code <b>{appliedVoucher.code}</b> applied!</span>
                                {/* FIX LOKALISASI DI DISKON ATAS */}
                                <span>{isClient ? DisplayRupiahPositive({ value: discountValue }) : '-'}</span> 
                            </div>
                        )}

                        <Separator className="my-4" />
                        
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                {/* FIX LOKALISASI DI SUBTOTALL!!! (INI SUMBER ERROR LO) */}
                                <DisplayRupiah value={cart.totalPrice()} /> 
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Shipping</span>
                                {/* FIX LOKALISASI DI SHIPPING */}
                                <DisplayRupiahShipping value={selectedRate?.price || 0} />
                            </div>
                            {appliedVoucher && (
                                <div className="flex justify-between text-green-500 font-bold">
                                    <span>Discount</span>
                                    {/* FIX LOKALISASI DI DISKON BAWAH */}
                                    <DisplayRupiahPositive value={discountValue} />
                                </div>
                            )}
                        </div>

                        <Separator className="my-4" />

                        <div className="flex justify-between text-lg font-black mb-6">
                            <span>TOTAL</span>
                            {/* FIX LOKALISASI DI GRAND TOTAL */}
                            <DisplayRupiah value={grandTotal} /> 
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