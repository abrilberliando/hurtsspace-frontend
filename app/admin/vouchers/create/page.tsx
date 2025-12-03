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
            <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardContent className="p-6 space-y-4">
                    
                    <div className="space-y-2">
                        <Label>Voucher Code (Unik)</Label>
                        <Input 
                            placeholder="Contoh: MERDEKA45" 
                            className="bg-black border-zinc-700 uppercase font-mono tracking-widest"
                            value={code} 
                            onChange={e => setCode(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Discount Type</Label>
                            <select 
                                className="w-full bg-black border border-zinc-700 rounded-md px-3 py-2 text-sm text-white"
                                value={discountType}
                                onChange={e => setDiscountType(e.target.value)}
                            >
                                <option value="fixed">Nominal (Rp)</option>
                                <option value="percent">Persen (%)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Amount</Label>
                            <Input 
                                type="number" 
                                placeholder={discountType === 'percent' ? "10" : "50000"} 
                                className="bg-black border-zinc-700"
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
                            className="bg-black border-zinc-700"
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
                                className="bg-black border-zinc-700 text-white" 
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date (Optional)</Label>
                            <Input 
                                type="datetime-local" 
                                className="bg-black border-zinc-700 text-white" 
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                </CardContent>
            </Card>

            <Button type="submit" disabled={loading} className="w-full font-bold bg-white text-black hover:bg-zinc-200">
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                LAUNCH PROMO
            </Button>
        </form>
    </div>
  );
}