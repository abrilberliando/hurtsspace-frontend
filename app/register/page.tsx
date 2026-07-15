"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Firebase cuma buat Google Login aja
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase"; 

import api from "@/lib/axios"; // Axios buat hit Laravel
import { useAuth } from "@/lib/useAuth"; // Hook auth kita

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, AlertCircle } from "lucide-react";
import { AxiosError } from "axios";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth(); // Ambil fungsi login dari store
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 👇 VALIDASI PASSWORD KETAT (Tetap kita pertahankan)
  const validatePassword = (password: string) => {
    if (password.length < 12) return "Password minimal 12 karakter, G!";
    if (!/[A-Z]/.test(password)) return "Harus ada huruf BESAR.";
    if (!/[a-z]/.test(password)) return "Harus ada huruf kecil.";
    if (!/[0-9]/.test(password)) return "Harus ada angka.";
    if (!/[!@#$%^&*]/.test(password)) return "Harus ada simbol (!@#$%^&*).";
    return null;
  };

  // 1. JALUR GOOGLE (Login via Firebase -> Sync ke Laravel)
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();

    try {
        // A. Login ke Google (Firebase)
        const result = await signInWithPopup(firebaseAuth, provider);
        const firebaseUser = result.user;
        // const idToken = await firebaseUser.getIdToken(); // 👈 Hapus atau komen ini karena unused

        // B. Sync/Login ke Backend Laravel
        // Kita kirim data Google ke endpoint khusus di Laravel
        // (Pastikan endpoint '/auth/firebase-login' atau sejenisnya sudah siap handle 'firstOrCreate')
        const res = await api.post('/auth/firebase-login', {
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            uid: firebaseUser.uid,
        });

        // C. Simpan Token dari Laravel ke LocalStorage (Login Sukses)
        login(res.data.user, res.data.access_token);

        toast.success(`Wadap, ${firebaseUser.displayName}!`, {
            description: "Login Google sukses."
        });
        
        router.push('/dashboard'); 

    } catch (error: unknown) { // 👈 Ganti any jadi unknown
        console.error("Google Auth Error:", error);
        
        // Casting error message
        let errorMessage = "Gagal login pake Google.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }

        toast.error(errorMessage, {
            description: "Cek koneksi atau coba lagi nanti."
        });
    } finally {
        setGoogleLoading(false);
    }
  };

  // 2. JALUR MANUAL (Register ke Laravel Database)
  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validasi Match
    if (formData.password !== formData.password_confirmation) {
        toast.error("Password & Konfirmasi gak sama, cek lagi G!");
        setLoading(false);
        return;
    }

    // Validasi Kekuatan Password
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
        toast.error("Password Lemah!", { description: passwordError });
        setLoading(false);
        return;
    }

    try {
      // Hit API Register Laravel (Pure Database)
      const res = await api.post("/register", formData);
      
      // Skenario 1: Auto Login setelah Register (Kalau backend balikin token)
      if (res.data.access_token) {
          login(res.data.user, res.data.access_token);
          toast.success("Welcome to the Society!", {
            description: "Akun berhasil dibuat."
          });
          router.push("/dashboard");
      } 
      // Skenario 2: Harus Verifikasi Email dulu (Kalau backend gak ngasih token langsung)
      else {
          toast.success("Registrasi Berhasil!", {
             description: "Cek email lo buat verifikasi akun ya."
          });
          router.push("/login");
      }

    } catch (err: unknown) {
      // 👈 Definisikan tipe errors secara spesifik
      const error = err as AxiosError<{ message: string, errors?: Record<string, string[]> }>;
      console.error(error);
      
      let msg = error.response?.data?.message || "Gagal daftar.";
      
      // Handle validasi error dari Laravel (misal email udah ada)
      if (error.response?.data?.errors) {
         const firstErrorKey = Object.keys(error.response.data.errors)[0];
         msg = error.response.data.errors[firstErrorKey][0];
      }
      
      toast.error("Gagal Register", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter">Join The Society</CardTitle>
        </CardHeader>
        <CardContent>
          
          {/* 👇 TOMBOL GOOGLE */}
          <Button 
            variant="outline" 
            className="w-full h-12 font-bold mb-6 flex items-center justify-center gap-2 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            type="button"
          >
            {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <>
                    {/* Icon Google SVG */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </>
            )}
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-medium">
                Or register with email
              </span>
            </div>
          </div>

          <form onSubmit={handleManualRegister} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="name" name="name" 
                    placeholder="Nama Lo" 
                    className="pl-10 h-11" 
                    required 
                    value={formData.name} onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="email" name="email" type="email" 
                    placeholder="name@example.com" 
                    className="pl-10 h-11" 
                    required 
                    value={formData.email} onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password (12+ Karakter)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="password" name="password" type="password" 
                    placeholder="••••••••••••" 
                    className="pl-10 h-11" 
                    required 
                    value={formData.password} onChange={handleChange}
                />
              </div>
              <div className="text-[10px] text-muted-foreground flex gap-1 items-start mt-1">
                 <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                 <span>Min 12 huruf, ada Huruf Besar, Kecil, Angka, & Simbol (!@#$)</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Ulangi Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="password_confirmation" name="password_confirmation" type="password" 
                    placeholder="••••••••••••" 
                    className="pl-10 h-11" 
                    required 
                    value={formData.password_confirmation} onChange={handleChange}
                />
              </div>
            </div>

            <Button type="submit" className="w-full font-bold uppercase tracking-widest mt-6 h-12" disabled={loading || googleLoading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "REGISTER"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center pb-6">
          <p className="text-sm text-muted-foreground">
            Udah punya akun?{" "}
            <Link href="/login" className="text-primary hover:underline font-bold">
              Login disini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}