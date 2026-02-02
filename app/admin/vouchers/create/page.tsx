"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Package, Truck, AlertCircle } from "lucide-react";
import { AxiosError } from "axios";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function CreateVoucherPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // --- STATE UTAMA ---
    const [code, setCode] = useState("");
    const [target, setTarget] = useState("products"); 
    const [isAllProducts, setIsAllProducts] = useState(true); 
    const [discountType, setDiscountType] = useState("fixed");
    const [discountAmount, setDiscountAmount] = useState("");
    const [maxDiscount, setMaxDiscount] = useState("");
    const [stock, setStock] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // 👇 SOLUSI ABSOLUT: Reset state secara sinkron
    const changeTarget = (val: string) => {
        setTarget(val);
        if (val === "shipping") {
            setIsAllProducts(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/admin/vouchers", {
                code: code.toUpperCase(),
                target: target,
                is_all_products: target === "shipping" ? true : isAllProducts,
                discount_type: discountType,
                discount_amount: discountAmount,
                max_discount_amount: maxDiscount || null,
                stock: stock,
                start_date: startDate || null,
                end_date: endDate || null
            });
            toast.success("Voucher Meluncur! 🚀");
            router.push("/admin/vouchers");
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            toast.error(err.response?.data?.message || "Gagal buat voucher.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-20 px-4">
            <h1 className="text-3xl font-black uppercase mb-8 italic tracking-tighter">New Promo Lab</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="border-[3px] border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
                    <CardContent className="p-6 space-y-6">
                        
                        {/* 1. KODE & TARGET */}
                        <div className="space-y-4 border-b-2 border-black pb-6">
                            <div className="space-y-2">
                                <Label className="font-black uppercase text-xs">Voucher Code</Label>
                                <Input 
                                    className="uppercase font-mono font-bold border-2 border-black h-12 rounded-none focus-visible:ring-0 focus-visible:border-primary" 
                                    value={code} 
                                    onChange={e => setCode(e.target.value)} 
                                    required 
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="font-black uppercase text-xs">Target Promo</Label>
                                    <Select value={target} onValueChange={changeTarget}>
                                        <SelectTrigger className="border-2 border-black font-bold h-12 rounded-none">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="border-2 border-black rounded-none">
                                            <SelectItem value="products" className="font-bold uppercase text-xs">Produk</SelectItem>
                                            <SelectItem value="shipping" className="font-bold uppercase text-xs">Ongkos Kirim</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 👇 BOX SWITCH DENGAN LOGIC TOTAL RE-MOUNT */}
                                <div className="h-12">
                                    {target === "products" ? (
                                        <div key="switch-products" className="flex items-center justify-between p-3 border-2 border-black bg-zinc-50 h-full animate-in fade-in">
                                            <Label className="font-bold uppercase text-[10px]">Semua Produk?</Label>
                                            <Switch 
                                                checked={isAllProducts} 
                                                onCheckedChange={(checked) => setIsAllProducts(checked)} 
                                            />
                                        </div>
                                    ) : (
                                        <div key="switch-shipping" className="flex items-center justify-center p-3 border-2 border-dashed border-zinc-400 bg-zinc-100 h-full animate-in zoom-in-95">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-2">
                                                <Truck className="w-4 h-4" /> Auto All (Ongkir)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!isAllProducts && target === "products" && (
                                <div className="bg-orange-500 text-white p-3 text-[10px] font-black flex items-center gap-2 animate-in slide-in-from-top-2">
                                    <AlertCircle className="w-4 h-4" /> KHUSUS PRODUK PILIHAN SAJA!
                                </div>
                            )}
                        </div>

                        {/* 2. VALUE & DISCOUNT */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="font-black uppercase text-xs">Tipe</Label>
                                <Select value={discountType} onValueChange={setDiscountType}>
                                    <SelectTrigger className="border-2 border-black font-bold h-12 rounded-none"><SelectValue /></SelectTrigger>
                                    <SelectContent className="border-2 border-black rounded-none">
                                        <SelectItem value="fixed" className="font-bold uppercase text-xs">Rupiah (Rp)</SelectItem>
                                        <SelectItem value="percent" className="font-bold uppercase text-xs">Persen (%)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-black uppercase text-xs">Amount</Label>
                                <Input 
                                    type="number" 
                                    className="border-2 border-black font-bold h-12 rounded-none" 
                                    value={discountAmount} 
                                    onChange={e => setDiscountAmount(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>

                        {discountType === "percent" && (
                            <div className="space-y-2 p-4 bg-yellow-50 border-2 border-dashed border-yellow-400">
                                <Label className="font-black uppercase text-xs">Max Cap (Rp)</Label>
                                <Input 
                                    type="number" 
                                    className="border-2 border-black font-bold h-12 rounded-none bg-white" 
                                    value={maxDiscount} 
                                    onChange={e => setMaxDiscount(e.target.value)} 
                                />
                                <p className="text-[9px] font-bold text-yellow-700 italic uppercase">Biar gak rugi bandar G!</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="font-black uppercase text-xs">Stok / Kuota</Label>
                            <Input 
                                type="number" 
                                className="border-2 border-black font-bold h-12 rounded-none" 
                                value={stock} 
                                onChange={e => setStock(e.target.value)} 
                                required 
                            />
                        </div>

                        {/* 3. DATES */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <div className="space-y-2">
                                <Label className="font-black uppercase text-xs text-zinc-500">Start</Label>
                                <Input type="datetime-local" className="border-2 border-black rounded-none h-12" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-black uppercase text-xs text-zinc-500">End</Label>
                                <Input type="datetime-local" className="border-2 border-black rounded-none h-12" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        </div>

                    </CardContent>
                </Card>

                <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full h-20 font-black text-2xl uppercase tracking-widest rounded-none border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                >
                    {loading ? <Loader2 className="animate-spin" /> : "DEPLOY VOUCHER"}
                </Button>
            </form>
        </div>
    );
}