"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, GripVertical, Trash2, Link as LinkIcon, Power } from "lucide-react";
import Image from "next/image";
import { UploadOverlay } from "@/components/ui/UploadOverlay";

// Preset Icons array
const PRESET_ICONS = [
    { value: 'globe', label: 'Website' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'shopee', label: 'Shopee' },
    { value: 'tokopedia', label: 'Tokopedia' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'twitter', label: 'Twitter / X' },
    { value: 'linkedin', label: 'LinkedIn' },
];

export default function AdminLinktreePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    
    const [settings, setSettings] = useState({
        page_title: '',
        page_subtitle: '',
        background_type: 'color',
        background_color: '#0a0a0a',
        page_text_color: '#ffffff',
        button_bg_color: '#ffffff',
        button_text_color: '#000000',
        button_border_color: '#333333',
        button_style: 'glass',
    });
    
    // File inputs for preview
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [bgPreview, setBgPreview] = useState<string | null>(null);
    const [bgFile, setBgFile] = useState<File | null>(null);

    const [links, setLinks] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/admin/linktree');
            setSettings({
                page_title: res.data.settings.page_title || '',
                page_subtitle: res.data.settings.page_subtitle || '',
                background_type: res.data.settings.background_type || 'color',
                background_color: res.data.settings.background_color || '#0a0a0a',
                page_text_color: res.data.settings.page_text_color || '#ffffff',
                button_bg_color: res.data.settings.button_bg_color || '#ffffff',
                button_text_color: res.data.settings.button_text_color || '#000000',
                button_border_color: res.data.settings.button_border_color || '#333333',
                button_style: res.data.settings.button_style || 'glass',
            });
            setLogoPreview(res.data.settings.logo);
            setBgPreview(res.data.settings.background_image);
            setLinks(res.data.links);
        } catch (error) {
            toast.error("Gagal load data linktree");
        } finally {
            setLoading(false);
        }
    };

    // --- SETTINGS HANDLERS ---
    const handleSettingsChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'bg') => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        if (type === 'logo') {
            setLogoFile(file);
            setLogoPreview(url);
        } else {
            setBgFile(file);
            setBgPreview(url);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        setUploadError(null);
        setUploadSuccess(false);
        try {
            const formData = new FormData();
            Object.entries(settings).forEach(([key, val]) => formData.append(key, val as string));
            if (logoFile) formData.append('logo', logoFile);
            if (bgFile) formData.append('background_image', bgFile);

            await api.post('/admin/linktree/settings', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Settings saved!");
            setLogoFile(null);
            setBgFile(null);
            setUploadSuccess(true); setSaving(false);
        } catch (error) {
            const err = error as any;
            setUploadError(err.response?.data?.message || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    // --- LINKS HANDLERS ---
    const [newLink, setNewLink] = useState({ icon: 'globe', label: '', url: '' });
    const [newLinkIconFile, setNewLinkIconFile] = useState<File | null>(null);

    const addLink = async () => {
        if (!newLink.label || !newLink.url) {
            toast.error("Label and URL are required");
            return;
        }
        setSaving(true);
        setUploadError(null);
        setUploadSuccess(false);
        try {
            const formData = new FormData();
            formData.append('icon', newLink.icon);
            formData.append('label', newLink.label);
            formData.append('url', newLink.url);
            if (newLinkIconFile) formData.append('custom_icon', newLinkIconFile);

            await api.post('/admin/linktree/links', formData);
            toast.success("Link added");
            setNewLink({ icon: 'globe', label: '', url: '' });
            setNewLinkIconFile(null);
            fetchData();
            setUploadSuccess(true); setSaving(false);
        } catch (error) {
            const err = error as any;
            setUploadError(err.response?.data?.message || "Failed to add link");
        } finally {
            setSaving(false);
        }
    };

    const deleteLink = async (id: number) => {
        if(!confirm("Delete this link?")) return;
        try {
            await api.delete(`/admin/linktree/links/${id}`);
            toast.success("Link deleted");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete link");
        }
    };

    const toggleLink = async (id: number) => {
        try {
            await api.put(`/admin/linktree/links/${id}/toggle`);
            toast.success("Link status updated");
            fetchData();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    // Reordering logic (basic move up/down for now instead of full dnd to keep it simple)
    const moveLink = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === links.length - 1) return;

        const newLinks = [...links];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        // Swap elements
        const temp = newLinks[index];
        newLinks[index] = newLinks[targetIndex];
        newLinks[targetIndex] = temp;

        // Update order visually
        setLinks(newLinks);

        // Map to API format
        const payload = newLinks.map((l, i) => ({ id: l.id, sort_order: i }));
        
        try {
            await api.put('/admin/linktree/links/reorder', { links: payload });
        } catch (error) {
            toast.error("Failed to reorder links");
            fetchData(); // Revert on fail
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;

    return (
        <div className="space-y-6">
            <UploadOverlay 
                isOpen={saving || uploadSuccess} 
                isError={!!uploadError} 
                isSuccess={uploadSuccess}
                errorMessage={uploadError || undefined}
                onRetry={() => {
                    setUploadError(null);
                    setSaving(false);
                }} 
                onCloseSuccess={() => {
                    setUploadSuccess(false);
                    setSaving(false);
                }}
            />
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Linktree Management</h1>
                    <p className="text-muted-foreground">Manage your custom /links page</p>
                </div>
                <Button asChild variant="outline">
                    <a href="/links" target="_blank" rel="noopener noreferrer">
                        <LinkIcon className="w-4 h-4 mr-2" /> View Live Page
                    </a>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: Controls */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="settings">
                        <TabsList className="w-full">
                            <TabsTrigger value="settings" className="flex-1">Appearance Settings</TabsTrigger>
                            <TabsTrigger value="links" className="flex-1">Manage Links</TabsTrigger>
                        </TabsList>

                        <TabsContent value="settings" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Page Info</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-xl border bg-muted overflow-hidden relative">
                                            {logoPreview && <Image src={logoPreview} alt="Logo" fill className="object-cover" />}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Label>Logo</Label>
                                            <Input type="file" accept="image/*" onChange={e => handleFileChange(e, 'logo')} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Page Title</Label>
                                        <Input value={settings.page_title} onChange={e => handleSettingsChange('page_title', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Subtitle (Bio)</Label>
                                        <Input value={settings.page_subtitle} onChange={e => handleSettingsChange('page_subtitle', e.target.value)} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Design</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Background Type</Label>
                                        <Select value={settings.background_type} onValueChange={v => handleSettingsChange('background_type', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="color">Solid Color</SelectItem>
                                                <SelectItem value="image">Image Background</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {settings.background_type === 'color' ? (
                                        <div className="space-y-2">
                                            <Label>Background Color</Label>
                                            <div className="flex gap-2">
                                                <Input type="color" className="w-14 p-1" value={settings.background_color} onChange={e => handleSettingsChange('background_color', e.target.value)} />
                                                <Input value={settings.background_color} onChange={e => handleSettingsChange('background_color', e.target.value)} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label>Background Image</Label>
                                            <Input type="file" accept="image/*" onChange={e => handleFileChange(e, 'bg')} />
                                            {bgPreview && <div className="mt-2 text-sm text-muted-foreground">Image loaded. Save to apply.</div>}
                                        </div>
                                    )}

                                    <div className="space-y-2 pt-4 border-t">
                                        <Label>Page Text Color</Label>
                                        <div className="flex gap-2">
                                            <Input type="color" className="w-14 p-1" value={settings.page_text_color} onChange={e => handleSettingsChange('page_text_color', e.target.value)} />
                                            <Input value={settings.page_text_color} onChange={e => handleSettingsChange('page_text_color', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-4 border-t">
                                        <Label>Button Style</Label>
                                        <Select value={settings.button_style} onValueChange={v => handleSettingsChange('button_style', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="solid">Solid</SelectItem>
                                                <SelectItem value="outline">Outline</SelectItem>
                                                <SelectItem value="glass">Glassmorphism (Premium)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Button BG Color</Label>
                                            <div className="flex gap-2">
                                                <Input type="color" className="w-14 p-1" value={settings.button_bg_color} onChange={e => handleSettingsChange('button_bg_color', e.target.value)} />
                                                <Input value={settings.button_bg_color} onChange={e => handleSettingsChange('button_bg_color', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Button Text Color</Label>
                                            <div className="flex gap-2">
                                                <Input type="color" className="w-14 p-1" value={settings.button_text_color} onChange={e => handleSettingsChange('button_text_color', e.target.value)} />
                                                <Input value={settings.button_text_color} onChange={e => handleSettingsChange('button_text_color', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label>Button Border Color (for Outline/Glass)</Label>
                                            <div className="flex gap-2">
                                                <Input type="color" className="w-14 p-1" value={settings.button_border_color} onChange={e => handleSettingsChange('button_border_color', e.target.value)} />
                                                <Input value={settings.button_border_color} onChange={e => handleSettingsChange('button_border_color', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>

                                    <Button onClick={saveSettings} disabled={saving} className="w-full">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Save Settings
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="links" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Add New Link</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Icon Preset</Label>
                                            <Select value={newLink.icon} onValueChange={v => setNewLink({...newLink, icon: v})}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {PRESET_ICONS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Custom Icon (Optional)</Label>
                                            <Input type="file" accept="image/*" onChange={e => setNewLinkIconFile(e.target.files?.[0] || null)} />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label>Label</Label>
                                            <Input placeholder="e.g. Visit Our Website" value={newLink.label} onChange={e => setNewLink({...newLink, label: e.target.value})} />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label>URL</Label>
                                            <Input placeholder="https://..." value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} />
                                        </div>
                                    </div>
                                    <Button onClick={addLink} className="w-full"><Plus className="w-4 h-4 mr-2"/> Add Link</Button>
                                </CardContent>
                            </Card>

                            <div className="space-y-2">
                                {links.map((link, i) => (
                                    <Card key={link.id} className="p-4 flex items-center gap-4">
                                        <div className="flex flex-col gap-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveLink(i, 'up')} disabled={i === 0}>▲</Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveLink(i, 'down')} disabled={i === links.length - 1}>▼</Button>
                                        </div>
                                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center overflow-hidden relative shrink-0">
                                            {link.custom_icon ? <Image src={link.custom_icon} alt="icon" fill className="object-cover"/> : <span className="text-xl capitalize">{link.icon[0]}</span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold truncate">{link.label}</h4>
                                            <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch checked={link.is_active} onCheckedChange={() => toggleLink(link.id)} />
                                            <Button variant="destructive" size="icon" onClick={() => deleteLink(link.id)}><Trash2 className="w-4 h-4"/></Button>
                                        </div>
                                    </Card>
                                ))}
                                {links.length === 0 && <p className="text-center text-muted-foreground py-8 border rounded border-dashed">No links added yet.</p>}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* RIGHT: Live Preview (Sticky) */}
                <div className="lg:block">
                    <div className="sticky top-24 border rounded-3xl overflow-hidden shadow-2xl h-[600px] w-full max-w-[320px] mx-auto relative bg-black flex flex-col items-center p-6">
                        {/* Preview content simulating the live page */}
                        {settings.background_type === 'image' && bgPreview && (
                            <img src={bgPreview} alt="bg" className="object-cover opacity-50 absolute inset-0 w-full h-full pointer-events-none" />
                        )}
                        {settings.background_type === 'color' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-white/10 pointer-events-none" style={{ backgroundColor: settings.background_color }} />
                        )}

                        <div className="relative z-10 w-full flex flex-col items-center mt-8">
                            <div className="rounded-2xl mb-4 overflow-hidden relative shadow-md">
                                {logoPreview && <img src={logoPreview} alt="logo" className="max-w-[120px] max-h-[100px] w-auto h-auto object-contain"/>}
                            </div>
                            <h3 className="font-bold text-lg text-center mb-1" style={{ color: settings.page_text_color }}>{settings.page_title || 'TITLE'}</h3>
                            <p className="text-xs mb-8 text-center" style={{ color: settings.page_text_color, opacity: 0.8 }}>{settings.page_subtitle || 'Subtitle goes here'}</p>

                            <div className="w-full space-y-3">
                                {links.filter(l => l.is_active).map(l => (
                                    <div 
                                        key={l.id} 
                                        className={`w-full px-6 py-4 rounded-lg text-sm font-bold text-center border truncate flex items-center gap-2 ${settings.button_style === 'solid' ? '' : 'bg-transparent backdrop-blur-sm'}`}
                                        style={{
                                            backgroundColor: settings.button_style === 'solid' ? settings.button_bg_color : 'rgba(255,255,255,0.1)',
                                            color: settings.button_text_color,
                                            borderColor: settings.button_border_color
                                        }}
                                    >
                                        {l.custom_icon ? (
                                            <img src={l.custom_icon} alt="icon" className="w-5 h-5 object-contain" />
                                        ) : (
                                            ['globe', 'email', 'phone'].includes(l.icon) ? (
                                                <div className="w-5 h-5 flex items-center justify-center opacity-80">
                                                    {l.icon === 'globe' && <LinkIcon className="w-4 h-4"/>}
                                                    {l.icon === 'email' && <span className="text-xs">✉️</span>}
                                                    {l.icon === 'phone' && <span className="text-xs">📞</span>}
                                                </div>
                                            ) : (
                                                <img src={`https://cdn.simpleicons.org/${l.icon === 'twitter' ? 'x' : l.icon}/${settings.button_text_color.replace('#', '')}`} alt="icon" className="w-5 h-5 object-contain" />
                                            )
                                        )}
                                        <span className="flex-1 pr-6">{l.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
