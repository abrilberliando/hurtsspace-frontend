"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { User, Mail, Phone, Save, Loader2, Check, MapPin } from "lucide-react";
import { AxiosError } from "axios";
import AddressForm, { AddressData } from "@/components/shared/AddressForm";
import LogoutButton from "../shared/LogoutButton";



export default function DashboardProfile() {
  const { user, login } = useAuth();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Form State Basic Info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  


  // Load data user awal
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || "");
    }
  }, [user]);



  // --- LOGIC UPDATE PROFILE (Basic Info + Avatar) ---
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("_method", "PUT"); 

      const res = await api.post("/user", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (user) {
         const updatedUser = { ...user, ...res.data.user };
         const token = localStorage.getItem("token") || "";
         login(updatedUser, token); 
      }

      toast.success("Profile Updated!", { description: "Your personal data is safe and secured." });

    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      toast.error(err.response?.data?.message || "Failed to Update Profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  // --- LOGIC UPDATE ADDRESS ---
  const handleSaveAddress = async (data: AddressData) => {
    setLoadingAddress(true);
    try {
        const payload = {
            // Kita kirim ulang nama/hp biar gak ketimpa null, tapi fokus utamanya update alamat
            name: user?.name, 
            phone: data.phone,
            address_detail: data.street,
            city_id: data.areaId,
            province_id: data.areaName,
            _method: "PUT"
        };

        const res = await api.post("/user", payload); // Use the same /user endpoint
        
        if (user) {
             const updatedUser = { ...user, ...res.data.user };
             const token = localStorage.getItem("token") || "";
             login(updatedUser, token);
        }

        toast.success("Address Saved Successfully!", { description: "Ready to checkout new items." });
    } catch {
        toast.error("Failed to save address.");
    } finally {
        setLoadingAddress(false);
    }
  };

  if (!user) return null;

  // Default data for address form
  const addressDefaultValues = {
      name: user.name,
      phone: user.phone || "",
      street: user.address_detail || "",
      areaId: user.city_id || "",
      areaName: user.province_id || ""
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-10 px-2">
        
        {/* === HEADER === */}
        {/* Sekarang layoutnya full width & clean */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 pb-6 border-b border-border">

            <div className="text-center sm:text-left flex-1 space-y-2 mb-2">
                <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">{user.name}</h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <span className="text-muted-foreground text-sm font-medium">{user.email}</span>
                    <span className="hidden sm:inline text-border">|</span>
                    <span className="text-muted-foreground text-sm font-medium">{user.role === 'admin' ? 'Administrator' : 'Society Member'}</span>
                </div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20 mt-1">
                    💎 {user.points} Points
                </div>
            </div>
            <LogoutButton />
        </div>

        {/* === MAIN CONTENT: UNIFIED CARD === */}
        <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 md:p-10 space-y-12">
                
                {/* SECTION: PERSONAL INFO */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Personal Information</h3>
                            <p className="text-sm text-muted-foreground">Manage your main personal data here.</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone Number</Label>
                                <Input placeholder="08xxxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Email Address</Label>
                                <Input value={email} disabled readOnly className="bg-muted/50 cursor-not-allowed h-11" />
                                <p className="text-[10px] text-muted-foreground pt-1">Email is locked for account security.</p>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={loadingProfile} size="lg" className="w-full sm:w-auto font-bold min-w-[160px]">
                                {loadingProfile ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> SAVING...</> : <><Save className="mr-2 h-4 w-4" /> SAVE CHANGES</>}
                            </Button>
                        </div>
                    </form>
                </section>

                <Separator />

                {/* SECTION: ADDRESS BOOK */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Shipping Address</h3>
                            <p className="text-sm text-muted-foreground">This address will be automatically used during checkout.</p>
                        </div>
                    </div>

                    {/* Reuse Component AddressForm */}
                    <div className="bg-muted/30 p-6 rounded-xl border border-border/50">
                        <AddressForm 
                            defaultValues={addressDefaultValues}
                            onSave={handleSaveAddress}
                            isLoading={loadingAddress}
                            buttonText="UPDATE SHIPPING ADDRESS"
                        />
                    </div>
                </section>
            </CardContent>
        </Card>
    </div>
  );
}