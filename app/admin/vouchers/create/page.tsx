"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AxiosError } from "axios";

// 👇 Import Shadcn Select Components
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


export default function CreateVoucherPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form State
    const [code, setCode] = useState("");
    const [discountType, setDiscountType] = useState("fixed"); // fixed or percent
    const [discountAmount, setDiscountAmount] = useState("");
    const [stock, setStock] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post("/admin/vouchers", {
                code: code.toUpperCase(),
                discount_type: discountType,
                discount_amount: discountAmount,
                stock: stock,
                start_date: startDate,
                end_date: endDate
            });
            
            toast.success("Voucher berhasil dibuat!");
            router.push("/admin/vouchers");

        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            toast.error(err.response?.data?.message || "Gagal buat voucher.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Create New Promo</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 👇 FIX 1: Gunakan semantic colors untuk Dark Mode */}
                <Card className="bg-card border-border text-foreground">
                    <CardContent className="p-6 space-y-4">
                        
                        <div className="space-y-2">
                            <Label>Voucher Code (Unik)</Label>
                            <Input 
                                placeholder="Contoh: MERDEKA45" 
                                // 👇 FIX 2: Ganti styling input agar adaptif
                                className="uppercase font-mono tracking-widest"
                                value={code} 
                                onChange={e => setCode(e.target.value)} 
                                required 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Discount Type</Label>
                                
                                {/* 👇 FIX 3: Ganti Select HTML Jadul ke Shadcn Select */}
                                <Select value={discountType} onValueChange={setDiscountType}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih Tipe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* 👇 FIX 4: Styling Dropdown item sudah otomatis Shadcn */}
                                        <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                                        <SelectItem value="percent">Persen (%)</SelectItem>
                                    </SelectContent>
                                </Select>

                            </div>
                            <div className="space-y-2">
                                <Label>Amount</Label>
                                <Input 
                                    type="number" 
                                    placeholder={discountType === 'percent' ? "10" : "50000"} 
                                    // 👇 FIX 5: Ganti styling input agar adaptif
                                    className="bg-input"
                                    value={discountAmount} 
                                    onChange={e => setDiscountAmount(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Total Stock (Quota)</Label>
                            <Input 
                                type="number" 
                                placeholder="100" 
                                className="bg-input"
                                value={stock} 
                                onChange={e => setStock(e.target.value)} 
                                required 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date (Optional)</Label>
                                <Input 
                                    type="datetime-local" 
                                    // 👇 FIX 6: Input date tidak butuh styling manual lagi
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Date (Optional)</Label>
                                <Input 
                                    type="datetime-local" 
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                    </CardContent>
                </Card>

                {/* 👇 FIX 7: Tombol Submit adaptif (primary) */}
                <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                    {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                    LAUNCH PROMO
                </Button>
            </form>
        </div>
    );
}