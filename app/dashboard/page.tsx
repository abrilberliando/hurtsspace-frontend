"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Mail, Phone, Save } from "lucide-react";

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); // Email biasanya read-only biar gak kacau
  const [phone, setPhone] = useState("");

  // Load data user saat ini
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Kita kirim data yang mau diupdate aja
      const payload = {
        name: name,
        phone: phone,
        // Alamat & Kota gak usah dikirim disini, udah diurus di halaman Address Book
      };

      const res = await api.put("/user", payload);

      // PENTING: Update data di LocalStorage (Zustand) biar gak perlu refresh halaman
      if (user) {
         // Gabungkan data lama dengan data baru dari server
         const updatedUser = { ...user, ...res.data.user };
         const token = localStorage.getItem("token") || "";
         
         login(updatedUser, token); // Update state global
      }

      toast.success("Profile Updated!", {
        description: "Data diri lo berhasil diperbarui, G."
      });

    } catch {
      toast.error("Gagal Update Profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
        {/* HEADER & AVATAR */}
        <div className="flex items-center gap-4 mb-8">
            <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=000&color=fff`} />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tight">{user.name}</h1>
                <p className="text-muted-foreground">{user.role === 'admin' ? 'Administrator' : 'Hurtsspace Society Member'}</p>
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">
                    💎 {user.points} Points
                </div>
            </div>
        </div>

        {/* FORM SETTINGS */}
        <Card className="bg-card border-border max-w-xl">
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update nama dan kontak lo disini.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                                className="pl-10" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                                className="pl-10 bg-muted/50 cursor-not-allowed" 
                                value={email} 
                                disabled 
                                readOnly 
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Email gak bisa diganti sembarangan ya G.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Phone Number (WhatsApp)</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                                className="pl-10" 
                                placeholder="08xxxxxxxxxx"
                                value={phone} 
                                onChange={(e) => setPhone(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" disabled={loading} className="w-full md:w-auto font-bold">
                            {loading ? (
                                "SAVING..." 
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" /> SAVE CHANGES
                                </>
                            )}
                        </Button>
                    </div>

                </form>
            </CardContent>
        </Card>
    </div>
  );
}