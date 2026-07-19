"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Power, Type, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AxiosError } from "axios";

interface RunningText {
  id: number;
  content: string;
  link_url: string | null;
  is_active: boolean;
}

export default function AdminRunningTextPage() {
  const [texts, setTexts] = useState<RunningText[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");

  const fetchTexts = async () => {
    try {
        const res = await api.get("/admin/running-texts");
        // Handle format response (data.data atau data langsung tergantung controller)
        const data = res.data.data || res.data || [];
        setTexts(data);
    } catch {
        toast.error("Failed to load running text data.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchTexts(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return toast.error("Konten teks wajib diisi!");

    setSubmitting(true);
    try {
        await api.post("/admin/running-texts", { 
            content, 
            link_url: link 
        });
        
        toast.success("Text successfully added!");
        setContent("");
        setLink("");
        fetchTexts(); // Refresh list
    } catch (error) {
        const err = error as AxiosError<{ message: string }>;
        toast.error("Failed to add text.", { 
            description: err.response?.data?.message || "Cek koneksi lo." 
        });
    } finally {
        setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this text?")) return;
    
    // Optimistic UI update
    const originalTexts = [...texts];
    setTexts(texts.filter(t => t.id !== id));

    try {
        await api.delete(`/admin/running-texts/${id}`);
        toast.success("Teks dihapus.");
    } catch { 
        toast.error("Failed to delete."); 
        setTexts(originalTexts); // Rollback
    }
  };

  const handleToggle = async (id: number) => {
    // Optimistic UI
    const originalTexts = [...texts];
    setTexts(texts.map(t => t.id === id ? { ...t, is_active: !t.is_active } : t));

    try {
        await api.put(`/admin/running-texts/${id}/toggle`);
        toast.success("Status updated!");
    } catch { 
        toast.error("Failed to update status."); 
        setTexts(originalTexts); // Rollback
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: ADD FORM */}
            <div className="lg:col-span-1">
                <Card className="h-fit sticky top-24 border-border shadow-md bg-card">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Plus className="w-5 h-5" /> Add Announcement
                        </CardTitle>
                        <CardDescription>Create promo info, flash sales, or important announcements.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Konten Teks</Label>
                                <Input 
                                    value={content} 
                                    onChange={e => setContent(e.target.value)} 
                                    placeholder="Contoh: DISKON 50% HARI INI!" 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Link (Opsional)</Label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        value={link} 
                                        onChange={e => setLink(e.target.value)} 
                                        placeholder="/shopall?promo=sale" 
                                        className="pl-9"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground">Users can click the text to go to this link.</p>
                            </div>
                            <Button disabled={submitting} className="w-full font-bold mt-2">
                                {submitting ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Plus className="mr-2 w-4 h-4" />}
                                {submitting ? "Saving..." : "ADD TEXT"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* KOLOM KANAN: LIST TEKS */}
            <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-xl">Announcement List</h2>
                    <Badge variant="outline">{texts.length} Items</Badge>
                </div>
                
                {loading ? (
                    <div className="space-y-3">
                        {[1,2,3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
                    </div>
                ) : texts.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-xl text-muted-foreground bg-muted/10">
                        <Type className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">No active announcements yet.</p>
                        <p className="text-xs">The text you add will appear here.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {texts.map((item) => (
                            <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-border rounded-lg bg-card shadow-sm hover:shadow-md transition-all gap-4 group">
                                <div className="space-y-1 flex-1 min-w-0">
                                    <p className="font-bold text-base md:text-lg break-words leading-tight">{item.content}</p>
                                    
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <Badge variant={item.is_active ? "default" : "secondary"} className={`${item.is_active ? "bg-green-600 hover:bg-green-700" : "text-muted-foreground"} text-[10px] uppercase tracking-wider`}>
                                            {item.is_active ? "Active" : "Hidden"}
                                        </Badge>

                                        {item.link_url && (
                                            <span className="text-xs text-blue-500 font-mono flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded truncate max-w-[200px]">
                                                <LinkIcon className="w-3 h-3 flex-shrink-0" /> {item.link_url}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 shrink-0 self-start sm:self-center">
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => handleToggle(item.id)} 
                                        title={item.is_active ? "Sembunyikan" : "Tampilkan"}
                                        className={item.is_active ? "border-green-200 text-green-600 hover:bg-green-50" : ""}
                                    >
                                        <Power className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="destructive" 
                                        onClick={() => handleDelete(item.id)} 
                                        title="Delete Permanently"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}