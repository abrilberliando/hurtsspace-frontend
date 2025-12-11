"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"; // Firebase Auth
import { auth as firebaseAuth } from "@/lib/firebase";
import api from "@/lib/axios";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react"; // 👈 Hapus CheckCircle2 (Unused)
import { AxiosError } from "axios";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // State Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // State khusus kalau email belum diverifikasi
  const [needsVerification, setNeedsVerification] = useState(false);

  // 1. Cek Query Param (Redirect dari Email Link)
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
        toast.success("Email Berhasil Diverifikasi! 🎉", {
            description: "Silakan login sekarang, akun lo udah aktif."
        });
        // Bersihkan URL biar bersih
        router.replace('/login');
    }
  }, [searchParams, router]);

  // 2. Logic Login Manual
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNeedsVerification(false); // Reset state

    try {
      const res = await api.post("/login", { email, password });
      
      // Sukses Login
      login(res.data.user, res.data.access_token);
      toast.success("Welcome Back! 👋");
      router.push("/dashboard");

    } catch (err: unknown) {
      const error = err as AxiosError<{ message: string, not_verified?: boolean }>;
      const msg = error.response?.data?.message || "Login gagal, cek email/password.";
      
      // Cek apakah error karena belum verifikasi (Backend kirim flag 'not_verified')
      if (error.response?.data?.not_verified) {
          setNeedsVerification(true); // Munculin tombol resend
          toast.warning("Verifikasi Email Dulu!", { description: msg });
      } else {
          toast.error("Gagal Masuk", { description: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Logic Login Google
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();

    try {
        // A. Pop-up Firebase
        const result = await signInWithPopup(firebaseAuth, provider);
        const fbUser = result.user;

        // B. Hit Laravel Endpoint
        const res = await api.post('/auth/firebase-login', {
            name: fbUser.displayName,
            email: fbUser.email,
            uid: fbUser.uid,
            avatar: fbUser.photoURL
        });

        // C. Simpan Token Laravel
        login(res.data.user, res.data.access_token);
        toast.success(`Wadap, ${fbUser.displayName}!`);
        router.push('/dashboard');

    } catch (err: unknown) { // 👈 Ganti any jadi unknown biar aman
        console.error("Google Login Error:", err);
        const error = err as Error;
        toast.error("Gagal Login Google", { description: error.message || "Ada masalah koneksi ke Google." });
    } finally {
        setGoogleLoading(false);
    }
  };

  // 4. Logic Resend Email (Kalau User Klik Tombol Kirim Ulang)
  const handleResendEmail = async () => {
    if (!email) return toast.error("Isi email dulu di form ya.");
    
    const loadingToast = toast.loading("Mengirim ulang email...");
    try {
        // Kita hit endpoint PUBLIC resendVerification yang udah kita fix
        const res = await api.post('/email/verification-notification', { email });
        
        toast.dismiss(loadingToast);
        toast.success("Terkirim! 📧", { description: res.data.message });
        setNeedsVerification(false); // Sembunyiin tombol lagi

    } catch { // 👈 Hapus variable error karena unused
        toast.dismiss(loadingToast);
        toast.error("Gagal Kirim", { description: "Coba lagi nanti atau pastikan email bener." });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter">Welcome Back</CardTitle>
          <CardDescription>
            Masuk ke akun Hurtsspace lo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          
          {/* TOMBOL GOOGLE */}
          <Button 
            variant="outline" 
            className="w-full h-12 font-bold mb-6 flex items-center justify-center gap-2 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            type="button"
          >
            {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <>
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
                Or login with email
              </span>
            </div>
          </div>

          {/* ALERT VERIFIKASI (Muncul kalau gagal login karena belum verified) */}
          {needsVerification && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 p-3 rounded-md mb-4 text-sm flex flex-col gap-2 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-bold">Akun belum aktif!</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Cek email lo atau klik tombol di bawah buat kirim ulang.</p>
                  <Button variant="secondary" size="sm" onClick={handleResendEmail} className="w-full h-8 text-xs font-bold mt-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors">
                     Kirim Ulang Link Verifikasi
                  </Button>
              </div>
          )}

          <form onSubmit={handleManualLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="email" name="email" type="email" 
                    placeholder="name@example.com" 
                    className="pl-10 h-11" 
                    required 
                    value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                   Lupa password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="password" name="password" type="password" 
                    placeholder="••••••••••••" 
                    className="pl-10 h-11" 
                    required 
                    value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full font-bold uppercase tracking-widest mt-6 h-12" disabled={loading || googleLoading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "LOGIN"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center pb-6">
          <p className="text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link href="/register" className="text-primary hover:underline font-bold">
              Daftar disini
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}