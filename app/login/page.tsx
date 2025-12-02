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

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/login", { email, password });
      
      // Simpan data ke Zustand
      auth.login(res.data.user, res.data.access_token);
      
      toast.success("Welcome back, G!", {
        description: "Login berhasil."
      });

      // Redirect ke Homepage (atau dashboard admin kalau admin)
      if (res.data.user.role === 'admin') {
         // router.push("/admin/dashboard"); // Nanti kita bikin
         router.push("/"); 
      } else {
         router.push("/");
      }

    } catch (error) { // 👈 Hapus ': any' di sini, biarin kosong
      
      // Kita kasih tau TS: "Woy, error ini bentuknya AxiosError, isinya ada message string"
      const err = error as AxiosError<{ message: string }>;

      toast.error("Gagal Daftar", { 
        description: err.response?.data?.message || "Ada masalah, cek lagi data lo."
      });
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="w-full max-w-md space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tighter">LOGIN</h1>
          <p className="mt-2 text-muted-foreground">
            Masuk buat akses fitur member & checkout.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
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
            <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">Lupa Password?</Link>
            </div>
            <Input 
                id="password" 
                type="password" 
                placeholder="********" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
          </div>

          <Button type="submit" className="w-full font-bold h-12" disabled={loading}>
            {loading ? "LOADING..." : "SIGN IN"}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Belum punya akun?{" "}
            <Link href="/register" className="font-bold text-foreground hover:underline">
              Daftar Society
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}