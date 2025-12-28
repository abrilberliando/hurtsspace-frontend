"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Send, Megaphone } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function AdminBroadcastPage() {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [url, setUrl] = useState("");
    const [target, setTarget] = useState("all");
    const [sending, setSending] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!confirm("Yakin mau kirim broadcast ke SEMUA user?")) return;

        setSending(true);
        try {
            const res = await api.post("/admin/broadcast", {
                title,
                message,
                url,
                target
            });
            toast.success("Broadcast Terkirim!", { description: res.data.message });
            setTitle("");
            setMessage("");
            setUrl("");
        } catch {
            toast.error("Gagal mengirim broadcast.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-10">
             <div className="flex items-center gap-3 border-b border-border pb-6">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                    <Megaphone className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">System Broadcast</h1>
                    <p className="text-muted-foreground text-sm">Kirim notifikasi & email massal ke user.</p>
                </div>
            </div>

            <Card className="border-border shadow-lg">
                <CardHeader>
                    <CardTitle>Compose Message</CardTitle>
                    <CardDescription>Pesan akan masuk ke Lonceng Notifikasi dan Email user.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSend} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Judul Broadcast</Label>
                            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: FLASH SALE 12.12!" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Pesan Utama</Label>
                            <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Isi pesan yang menarik..." required rows={4} />
                        </div>
                        <div className="space-y-2">
                            <Label>Link Tujuan (Opsional)</Label>
                            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://hurtsspace.com/shop" />
                        </div>
                        <div className="space-y-2">
                            <Label>Target User</Label>
                            <Select value={target} onValueChange={setTarget}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua User (Admin + Member)</SelectItem>
                                    <SelectItem value="members">Hanya Member</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="pt-4">
                            <Button type="submit" className="w-full font-bold h-12 text-lg" disabled={sending}>
                                {sending ? <Loader2 className="animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                                KIRIM BROADCAST
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}