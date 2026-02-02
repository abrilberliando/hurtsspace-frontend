"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Save, PackageSearch, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";

// 👇 INTERFACE ANTI-ANY (ESLint Approved)
interface Product {
    id: number;
    name: string;
}

interface Voucher {
    id: number;
    code: string;
    target: 'products' | 'shipping';
    is_all_products: boolean;
    products: Product[];
}

export default function VoucherDetailPage() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [voucher, setVoucher] = useState<Voucher | null>(null);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // 1. FETCH DATA
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [vRes, pRes] = await Promise.all([
                    api.get(`/admin/vouchers/${id}`),
                    api.get("/admin/products")
                ]);

                const voucherData: Voucher = vRes.data.data;
                setVoucher(voucherData);
                setAllProducts(pRes.data.data);
                
                // Ambil ID produk yang emang udah nempel di voucher ini
                setSelectedIds(voucherData.products.map((p: Product) => p.id));
            } catch {
                toast.error("Gagal tarik data dari server.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // 2. SEARCH LOGIC (Biar gak pusing kalau barang ribuan)
    const filteredProducts = useMemo(() => {
        return allProducts.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allProducts, searchQuery]);

    // 3. TOGGLE HANDLER
    const toggleProduct = (productId: number) => {
        setSelectedIds(prev => 
            prev.includes(productId) 
                ? prev.filter(i => i !== productId) 
                : [...prev, productId]
        );
    };

    // 4. SYNC TO BACKEND
    const handleSync = async () => {
        setSaving(true);
        try {
            await api.post(`/admin/vouchers/${id}/sync`, {
                product_ids: selectedIds
            });
            toast.success("Voucher rules updated! 🔥");
        } catch {
            toast.error("Gagal sinkronisasi produk.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="animate-spin w-12 h-12 text-primary" />
                <p className="font-black uppercase tracking-widest text-xs">Loading Lab Data...</p>
            </div>
        );
    }

    if (!voucher) return <div className="p-20 text-center font-bold">Voucher Not Found G!</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4">
            {/* HEADER AREA */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-black pb-8">
                <div className="space-y-4">
                    <Button asChild variant="ghost" className="p-0 hover:bg-transparent text-zinc-500 hover:text-black transition-all">
                        <Link href="/admin/vouchers" className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest">
                            <ArrowLeft className="w-4 h-4" /> Back to List
                        </Link>
                    </Button>
                    <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none">
                        Voucher: <span className="underline decoration-primary">{voucher.code}</span>
                    </h1>
                    <div className="flex gap-2">
                        <span className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">Target: {voucher.target}</span>
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black ${voucher.is_all_products ? 'bg-zinc-100' : 'bg-orange-500 text-white'}`}>
                            Selective: {voucher.is_all_products ? 'NO' : 'YES'}
                        </span>
                    </div>
                </div>
                <Button 
                    onClick={handleSync} 
                    disabled={saving} 
                    className="h-16 px-8 rounded-none border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all font-black text-lg italic"
                >
                    {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                    SYNC PRODUCTS
                </Button>
            </div>

            {/* PRODUCT SELECTOR */}
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <Input 
                        placeholder="CARI PRODUK (CONTOH: DECK, WHEELS...)" 
                        className="pl-12 h-14 border-2 border-black rounded-none font-bold uppercase tracking-widest focus-visible:ring-0 focus-visible:border-primary"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Card className="border-[3px] border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <CardHeader className="bg-zinc-100 border-b-2 border-black py-4">
                        <CardTitle className="text-xs font-black flex items-center gap-3 uppercase tracking-widest">
                            <PackageSearch className="w-5 h-5" /> 
                            Daftar Produk ({selectedIds.length} terpilih)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-1 divide-y-2 divide-zinc-200 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <div 
                                        key={product.id} 
                                        className={`flex items-center justify-between p-5 transition-all hover:bg-zinc-50 ${selectedIds.includes(product.id) ? 'bg-zinc-50/50' : ''}`}
                                    >
                                        <div className="space-y-1">
                                            <p className="text-sm font-black uppercase tracking-tight">{product.name}</p>
                                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Product ID: #{product.id}</p>
                                        </div>
                                        <Checkbox 
                                            id={`product-${product.id}`}
                                            className="w-6 h-6 border-2 border-black data-[state=checked]:bg-primary data-[state=checked]:text-black rounded-none"
                                            checked={selectedIds.includes(product.id)}
                                            onCheckedChange={() => toggleProduct(product.id)}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="p-20 text-center text-zinc-400 font-black uppercase tracking-widest italic text-xs">
                                    Barang nggak ketemu G! Coba cari yang lain.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <p className="text-[10px] text-center text-zinc-400 font-bold uppercase tracking-widest italic">
                *Hanya produk yang dichecklist yang bakal dapet diskon pas pake voucher ini.
            </p>
        </div>
    );
}