"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/lib/useAuth";
import AddressForm, { AddressData } from "@/components/shared/AddressForm"; // Import Komponen Baru
import { toast } from "sonner";
import { MapPin } from "lucide-react";

export default function AddressPage() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);

  // Handle Simpan ke Database User
  const handleSaveToProfile = async (data: AddressData) => {
    setLoading(true);
    try {
        const payload = {
            name: data.name,
            phone: data.phone,
            address_detail: data.street,
            city_id: data.areaId,
            province_id: data.areaName, // Kita simpan nama area lengkap disini
        };

        const res = await api.put("/user", payload);
        
        // Update Local User State
        if (user) {
             const updatedUser = { ...user, ...res.data.user };
             const token = localStorage.getItem("token") || "";
             login(updatedUser, token);
        }

        toast.success("Alamat Profil Berhasil Disimpan!");
    } catch {
        toast.error("Gagal simpen alamat.");
    } finally {
        setLoading(false);
    }
  };

  // Siapkan data awal dari user profile
  const defaultValues = user ? {
      name: user.name,
      phone: user.phone || "",
      street: user.address_detail || "",
      areaId: user.city_id || "",
      areaName: user.province_id || ""
  } : undefined;

  return (
    <div className="max-w-xl space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5" /> Buku Alamat Saya
        </h2>
        
        {/* Panggil Komponen AddressForm */}
        <AddressForm 
            defaultValues={defaultValues}
            onSave={handleSaveToProfile}
            isLoading={loading}
            buttonText="UPDATE ALAMAT PROFIL"
        />
    </div>
  );
}