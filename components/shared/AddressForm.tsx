"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, MapPin, X } from "lucide-react";
import { toast } from "sonner";

// Data Interface to be sent out
export interface AddressData {
  name: string;
  phone: string;
  street: string;     // Jalan, Gedung, No Rumah
  areaId: string;     // ID Biteship
  areaName: string;   // String lengkap (Kecamatan, Kota, Prov, Kode Pos)
}

interface Area {
  id: string;
  name: string;
  administrative_division_level_1_name: string; // Provinsi
  postal_code: number;
}

interface AddressFormProps {
  defaultValues?: Partial<AddressData>; // Data awal (opsional)
  onSave: (data: AddressData) => void;  // Function called when button is clicked
  isLoading?: boolean;
  buttonText?: string;
}

export default function AddressForm({ defaultValues, onSave, isLoading, buttonText = "SAVE ADDRESS" }: AddressFormProps) {
  // State Form
  const [name, setName] = useState(defaultValues?.name || "");
  const [phone, setPhone] = useState(defaultValues?.phone || "");
  const [street, setStreet] = useState(defaultValues?.street || "");
  
  // State Area (Biteship)
  const [areaQuery, setAreaQuery] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState(defaultValues?.areaId || "");
  const [selectedAreaName, setSelectedAreaName] = useState(defaultValues?.areaName || "");
  const [loadingArea, setLoadingArea] = useState(false);

  // Update state if defaultValues change (e.g. new user data loaded)
  useEffect(() => {
    if (defaultValues) {
        setName(defaultValues.name || "");
        setPhone(defaultValues.phone || "");
        setStreet(defaultValues.street || "");
        setSelectedAreaId(defaultValues.areaId || "");
        setSelectedAreaName(defaultValues.areaName || "");
    }
  }, [defaultValues]);

  // Logic Cari Kota
  const handleSearchArea = async () => {
    if (areaQuery.length < 3) return toast.error("Type at least 3 letters!");
    setLoadingArea(true);
    try {
      const res = await api.get(`/shipping/areas?query=${areaQuery}`);
      setAreas(res.data.areas || []);
    } catch {
      toast.error("Failed to search location.");
    } finally {
      setLoadingArea(false);
    }
  };

  // Select City Logic
  const handleSelectArea = (area: Area) => {
    setSelectedAreaId(area.id);
    // Format: Kecamatan, Kota, Provinsi, Kode Pos
    const formatName = `${area.name}, ${area.administrative_division_level_1_name} (${area.postal_code})`;
    setSelectedAreaName(formatName);
    setAreas([]); 
  };

  // Clear City Selection Logic
  const handleResetArea = () => {
    setSelectedAreaId("");
    setSelectedAreaName("");
    setAreaQuery("");
  }

  // Submit Handler
  const handleSubmit = () => {
    if (!name || !phone || !street || !selectedAreaId) {
        return toast.error("Please complete all address details!");
    }

    onSave({
        name,
        phone,
        street,
        areaId: selectedAreaId,
        areaName: selectedAreaName
    });
  };

  return (
    <Card className="bg-card border-border rounded-none">
      <CardContent className="p-6 space-y-4">
        
        {/* 1. Nama Lengkap */}
        <div className="space-y-2">
            <Label>Recipient Name</Label>
            <Input 
                placeholder="Full Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
            />
        </div>

        {/* 2. No Telepon */}
        <div className="space-y-2">
            <Label>Phone Number (WhatsApp)</Label>
            <Input 
                placeholder="08xxxxxxxxxx" 
                type="tel"
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
            />
        </div>

        {/* 3. Area (Provinsi, Kota, Kec, Kode Pos) */}
        <div className="space-y-2 relative">
            <Label>Area (District / City / Postal Code)</Label>
            
            {selectedAreaId ? (
                // View when city is selected
                <div className="flex items-center justify-between p-3 bg-muted rounded-md border border-border">
                    <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-bold">{selectedAreaName}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleResetArea} className="h-6 w-6 text-muted-foreground hover:text-destructive">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                // Input Pencarian
                <div className="flex gap-2">
                    <Input 
                        placeholder="Search district or postal code..." 
                        value={areaQuery}
                        onChange={(e) => setAreaQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchArea()}
                    />
                    <Button size="icon" onClick={handleSearchArea} disabled={loadingArea}>
                        {loadingArea ? <Loader2 className="animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                </div>
            )}

            {/* Dropdown Hasil Search */}
            {areas.length > 0 && !selectedAreaId && (
                <div className="absolute top-full left-0 w-full bg-popover border border-border z-10 max-h-48 overflow-y-auto rounded-md shadow-lg mt-1">
                    {areas.map((area) => (
                        <div 
                            key={area.id}
                            className="p-3 text-sm hover:bg-muted cursor-pointer transition border-b border-border last:border-0"
                            onClick={() => handleSelectArea(area)}
                        >
                            <span className="font-bold block">{area.name}</span>
                            <span className="text-xs text-muted-foreground">
                                {area.administrative_division_level_1_name} • {area.postal_code}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* 4. Jalan, Gedung, No Rumah */}
        <div className="space-y-2">
            <Label>Address Detail (Street, Building, House No.)</Label>
            <Textarea 
                placeholder="Example: Jl. Sudirman No. 45, Cyber Building 2nd Floor"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                rows={3}
            />
        </div>

        {/* 5. Save Button */}
        <Button onClick={handleSubmit} disabled={isLoading} className="w-full font-bold">
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
            {buttonText}
        </Button>

      </CardContent>
    </Card>
  );
}