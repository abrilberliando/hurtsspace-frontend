"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { useCart } from "@/lib/useCart";
import api from "@/lib/axios";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { TicketPercent, X, Loader2, Info } from "lucide-react";
import AddressForm, { AddressData } from "@/components/shared/AddressForm";
import Image from "next/image"; // 👈 Add import Image
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

interface CartStore {
    removeAll?: () => void;
    clearCart?: () => void;
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
    target: 'products' | 'shipping';
    is_all_products: boolean;
    applicable_products?: { id: number; name: string }[];
}

const formatRupiah = (amount: number) => {
    return amount.toLocaleString("id-ID");
};

export default function CheckoutPage() {
    const router = useRouter();
    const { user, login } = useAuth();
    const cart = useCart();

    const [checkoutData, setCheckoutData] = useState<AddressData | null>(null);
    const [orderNote, setOrderNote] = useState("");
    const [rates, setRates] = useState<CourierRate[]>([]);
    const [selectedRate, setSelectedRate] = useState<CourierRate | null>(null);
    const [loadingRates, setLoadingRates] = useState(false);
    const [processing, setProcessing] = useState(false);

    const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
    const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
    const [loadingVoucher, setLoadingVoucher] = useState(false);

    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsChecking(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isChecking) {
            if (!user) {
                router.push("/login");
            } else if (cart.items.length === 0) {
                router.push("/cart");
            }
        }
    }, [isChecking, user, cart.items, router]);

    useEffect(() => {
        const fetchVouchers = async () => {
            try {
                const res = await api.get("/vouchers");
                setAvailableVouchers(res.data.data || []);
            } catch (error) {
                console.log("No vouchers available", error);
            }
        };
        if (user) fetchVouchers();
    }, [user]);

    const defaultAddress = useMemo(() => (user ? {
        name: user.name,
        phone: user.phone || "",
        street: user.address_detail || "",
        areaId: user.city_id || "",
        areaName: user.province_id || ""
    } : undefined), [user]);

    const discountValue = useMemo(() => {
        if (!appliedVoucher) return 0;
        let eligibleAmount = 0;

        if (appliedVoucher.target === 'shipping') {
            eligibleAmount = selectedRate?.price || 0;
        } else {
            if (appliedVoucher.is_all_products) {
                eligibleAmount = cart.totalPrice();
            } else {
                const allowedIds = appliedVoucher.applicable_products?.map(p => p.id) || [];
                eligibleAmount = cart.items.reduce((acc, item) => {
                    if (allowedIds.includes(item.productId)) {
                        return acc + (item.price * item.quantity);
                    }
                    return acc;
                }, 0);
            }
        }

        if (eligibleAmount === 0) return 0;

        let calculated = 0;
        if (appliedVoucher.discount_type === 'percent') {
            calculated = (eligibleAmount * appliedVoucher.discount_amount) / 100;
            if (appliedVoucher.max_discount_amount && calculated > appliedVoucher.max_discount_amount) {
                calculated = appliedVoucher.max_discount_amount;
            }
        } else {
            calculated = appliedVoucher.discount_amount;
        }

        return Math.min(calculated, eligibleAmount);
    }, [appliedVoucher, cart, selectedRate]);

    const grandTotal = Math.max(0, (cart.totalPrice() + (selectedRate?.price || 0)) - discountValue);

    const handleAddressSubmit = async (data: AddressData) => {
        setCheckoutData(data);
        setLoadingRates(true);
        setRates([]);
        setSelectedRate(null);

        try {
            const totalWeight = cart.totalWeight() || 1000;
            const res = await api.post("/shipping/cost", {
                destination_area_id: data.areaId,
                weight: totalWeight
            });

            const pricing = res.data.pricing || [];
            setRates(pricing);

            if (pricing.length > 0) {
                const cheapest = pricing.reduce((prev: CourierRate, curr: CourierRate) =>
                    prev.price < curr.price ? prev : curr
                );
                setSelectedRate(cheapest);
                toast.success(`Cheapest shipping (${cheapest.courier_name}) selected automatically!`);
            }

            const payload = {
                name: user?.name,
                phone: data.phone,
                address_detail: data.street,
                city_id: data.areaId,
                province_id: data.areaName,
            };
            const userRes = await api.put("/user", payload);
            if (user) {
                login({ ...user, ...userRes.data.user }, localStorage.getItem("token") || "");
            }
        } catch {
            toast.error("Failed to check shipping cost.");
        } finally {
            setLoadingRates(false);
        }
    };

    const handleSelectVoucher = async (code: string) => {
        if (!code) return;
        setLoadingVoucher(true);
        try {
            const res = await api.post("/vouchers/check", { code });
            setAppliedVoucher(res.data.data);
            toast.success("Voucher applied!");
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            toast.error(err.response?.data?.message || "Invalid voucher.");
            setAppliedVoucher(null);
        } finally {
            setLoadingVoucher(false);
        }
    };

    const handlePay = async () => {
        if (!checkoutData || !selectedRate) return toast.error("Please select a courier!");

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
                shipping_address: `${checkoutData.name} (${checkoutData.phone}) - ${checkoutData.street}, ${checkoutData.areaName}`,
                voucher_code: appliedVoucher?.code || null,
                note: orderNote,
            };

            const res = await api.post("/checkout", payload);

            const cartStore = cart as unknown as CartStore;

            const snap = (window as unknown as MidtransWindow).snap;
            if (snap) {
                snap.pay(res.data.snap_token, {
                    onSuccess: () => {
                        if (cartStore.removeAll) cartStore.removeAll();
                        else if (cartStore.clearCart) cartStore.clearCart();
                        window.location.href = "/thank-you";
                    },
                    onPending: () => { window.location.href = "/payment-check"; },
                    onError: () => { window.location.href = "/payment-check"; },
                    onClose: () => { window.location.href = "/payment-check"; }
                });
            }
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            toast.error(err.response?.data?.message || "Failed to checkout.");
        } finally {
            setProcessing(false);
        }
    };

    if (isChecking) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center pt-20">
                <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!user || cart.items.length === 0) return null;

    return (
        <main className="min-h-screen bg-background text-foreground pt-10 pb-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-3xl font-black mb-8 uppercase italic underline decoration-primary underline-offset-8">Checkout</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <AddressForm
                                defaultValues={defaultAddress}
                                onSave={handleAddressSubmit}
                                buttonText={loadingRates ? "CALCULATING..." : "CONFIRM ADDRESS"}
                                isLoading={loadingRates}
                            />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl mb-4 uppercase tracking-tighter text-zinc-400">Order Note</h2>
                            <Textarea
                                placeholder="Additional details..."
                                className="min-h-[100px] border-2 border-border focus:border-foreground transition-all duration-300 resize-none rounded-none"
                                value={orderNote}
                                onChange={(e) => setOrderNote(e.target.value)}
                                maxLength={500}
                            />
                        </div>
                        {rates.length > 0 && (
                            <Card className="bg-card border-2 border-border rounded-none">
                                <CardContent className="p-6 space-y-4">
                                    <h2 className="font-bold text-xl uppercase tracking-tighter">2. Select Shipping</h2>
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                        {rates.map((rate, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setSelectedRate(rate)}
                                                className={`p-4 border-2 transition-all cursor-pointer flex justify-between items-center ${selectedRate === rate ? 'border-foreground bg-zinc-100' : 'border-zinc-200'}`}
                                            >
                                                <div>
                                                    <p className="font-black uppercase text-xs">{rate.courier_name} - {rate.courier_service_name}</p>
                                                    <p className="text-[10px] italic">Estimated: {rate.duration}</p>
                                                </div>
                                                <p className="font-bold text-sm">Rp {formatRupiah(rate.price)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div>
                        <Card className="bg-card border-2 border-border sticky top-24 rounded-none">
                            <CardContent className="p-6">
                                <h2 className="font-bold text-xl mb-6 uppercase tracking-tighter">Order Summary</h2>
                                <div className="space-y-4 mb-6">
                                    {cart.items.map((item) => (
                                        <div key={item.id} className="flex gap-4 items-center">
                                            {/* 👇 PRODUCT IMAGE */}
                                            <div className="relative w-16 h-16 bg-muted overflow-hidden border">
                                                <Image
                                                    src={item.image || "/placeholder-product.png"}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 flex justify-between items-center text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-xs uppercase">{item.name}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">Qty: {item.quantity}</span>
                                                </div>
                                                <span className="text-xs font-bold">Rp {formatRupiah(item.price * item.quantity)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Separator className="my-4 h-0.5" />

                                <div className="space-y-3 mb-4">
                                    {!appliedVoucher ? (
                                        <Select onValueChange={handleSelectVoucher} disabled={loadingVoucher || availableVouchers.length === 0}>
                                            <SelectTrigger className="w-full border-2 rounded-none font-bold text-xs h-12 uppercase">
                                                <SelectValue placeholder={availableVouchers.length > 0 ? "USE PROMO CODE" : "NO PROMO AVAILABLE"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableVouchers.map((v) => (
                                                    <SelectItem key={v.id} value={v.code} className="font-bold text-xs uppercase">
                                                        {v.code} ({v.discount_type === 'percent' ? `${v.discount_amount}%` : `Rp ${formatRupiah(v.discount_amount)}`})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between border-2 border-green-600 bg-green-50 p-3">
                                                <span className="font-black text-xs text-green-700 uppercase flex items-center gap-2"><TicketPercent className="w-4 h-4" /> {appliedVoucher.code}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => setAppliedVoucher(null)}><X className="w-4 h-4" /></Button>
                                            </div>
                                            {/* 👇 INFO MAKSIMAL POTONGAN */}
                                            {appliedVoucher.max_discount_amount && appliedVoucher.discount_type === 'percent' && (
                                                <div className="flex items-center gap-2 text-[10px] text-green-700 font-bold uppercase italic">
                                                    <Info className="w-3 h-3" />
                                                    <span>Max Discount: Rp {formatRupiah(appliedVoucher.max_discount_amount)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {appliedVoucher && (
                                        <div className="bg-zinc-50 p-2 flex items-start gap-2 border border-dashed border-zinc-300 italic">
                                            <Info className="w-3 h-3 mt-0.5" />
                                            <p className="text-[9px] uppercase font-bold">Target: {appliedVoucher.target === 'shipping' ? 'Shipping' : 'Products'}</p>
                                        </div>
                                    )}
                                </div>

                                <Separator className="my-4 h-0.5" />

                                <div className="space-y-2 text-xs font-bold uppercase">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>Rp {formatRupiah(cart.totalPrice())}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span>{selectedRate ? `Rp ${formatRupiah(selectedRate.price)}` : "-"}</span>
                                    </div>
                                    {discountValue > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount</span>
                                            <span>- Rp {formatRupiah(discountValue)}</span>
                                        </div>
                                    )}
                                </div>

                                <Separator className="my-4 h-0.5" />

                                <div className="flex justify-between text-xl font-black mb-6 italic uppercase tracking-tighter">
                                    <span>Total</span>
                                    <span>Rp {formatRupiah(grandTotal)}</span>
                                </div>

                                <Button
                                    className="w-full h-14 font-black text-lg rounded-none uppercase tracking-widest"
                                    disabled={processing || !selectedRate}
                                    onClick={handlePay}
                                >
                                    {processing ? <Loader2 className="animate-spin" /> : "PAY NOW"}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
}