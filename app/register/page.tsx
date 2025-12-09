"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AxiosError } from "axios";

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/register", { name, email, password });
      
      // Auto Login setelah daftar
      auth.login(res.data.user, res.data.access_token);
      
      toast.success("Welcome to the Society!", {
        description: "Akun berhasil dibuat."
      });

      router.push("/");

    } catch (error) { // 👈 Hapus ': any' di sini, biarin kosong
      
      // Kita kasih tau TS: "Woy, error ini bentuknya AxiosError, isinya ada message string"
      const err = error as AxiosError<{ message: string }>;

      toast.error("Gagal Login", { 
        description: err.response?.data?.message || "Ada masalah, cek lagi data lo."
      });
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="w-full max-w-md space-y-8">
        
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tighter">JOIN SOCIETY</h1>
          <p className="mt-2 text-muted-foreground">
            Dapetin akses eksklusif dan poin belanja.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input 
                id="name" 
                type="text" 
                placeholder="Zidan G" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
                id="email" 
                type="email" 
                placeholder="email@contoh.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
                id="password" 
                type="password" 
                placeholder="Minimal 8 karakter" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
            />
          </div>

          <Button type="submit" className="w-full font-bold h-12" disabled={loading}>
            {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Udah punya akun?{" "}
            <Link href="/login" className="font-bold text-foreground hover:underline">
              Login disini
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}