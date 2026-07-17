"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"; 
import { auth as firebaseAuth } from "@/lib/firebase";
import api from "@/lib/axios";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { AxiosError } from "axios";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
        toast.success("Email Verified Successfully! 🎉", {
            description: "Please login now, your account is active."
        });
        router.replace('/login');
    }
  }, [searchParams, router]);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNeedsVerification(false);

    try {
      const res = await api.post("/login", { email, password });
      login(res.data.user, res.data.access_token);
      toast.success("Welcome Back! 👋");
      router.push("/dashboard");

    } catch (err: unknown) {
      const error = err as AxiosError<{ message: string, not_verified?: boolean }>;
      const msg = error.response?.data?.message || "Login failed, check email/password.";
      
      if (error.response?.data?.not_verified) {
          setNeedsVerification(true);
          toast.warning("Verify Your Email First!", { description: msg });
      } else {
          toast.error("Login Failed", { description: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(firebaseAuth, provider);
        const fbUser = result.user;

        const res = await api.post('/auth/firebase-login', {
            name: fbUser.displayName,
            email: fbUser.email,
            uid: fbUser.uid
        });

        login(res.data.user, res.data.access_token);
        toast.success(`Wadap, ${fbUser.displayName}!`);
        router.push('/dashboard');

    } catch (err: unknown) {
        console.error("Google Login Error:", err);
        const error = err as Error;
        toast.error("Google Login Failed", { description: error.message || "Connection problem with Google." });
    } finally {
        setGoogleLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) return toast.error("Please enter your email in the form.");
    const loadingToast = toast.loading("Resending email...");
    try {
        const res = await api.post('/email/verification-notification', { email });
        toast.dismiss(loadingToast);
        toast.success("Sent! 📧", { description: res.data.message });
        setNeedsVerification(false);
    } catch {
        toast.dismiss(loadingToast);
        toast.error("Failed to Send", { description: "Try again later or make sure your email is correct." });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-none shadow-none bg-transparent">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-black uppercase tracking-tighter">Welcome Back</CardTitle>
          <CardDescription>
            Log in to your Hurtsspace account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          
          <Button 
            variant="outline" 
            className="w-full h-12 font-bold mb-6 flex items-center justify-center gap-2 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all rounded-none"
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

          {needsVerification && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 p-3 rounded-none mb-4 text-sm flex flex-col gap-2 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-bold">Account not active!</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Check your email or click the button below to resend.</p>
                  <Button variant="secondary" size="sm" onClick={handleResendEmail} className="w-full h-8 text-xs font-bold mt-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors rounded-none">
                     Resend Verification Link
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
                    className="pl-10 h-11 rounded-none border-2 focus-visible:ring-0 focus-visible:border-foreground" 
                    required 
                    value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {/* 👇 FORGOT PASSWORD LINK */}
                <Link href="/forgot-password" className="text-xs text-primary hover:underline font-bold transition-colors">
                   Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="password" name="password" type={showPassword ? "text" : "password"} 
                    placeholder="••••••••••••" 
                    className="pl-10 pr-10 h-11 rounded-none border-2 focus-visible:ring-0 focus-visible:border-foreground" 
                    required 
                    value={password} onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full font-black uppercase tracking-widest mt-6 h-12 rounded-none" disabled={loading || googleLoading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "LOGIN"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center pb-6">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-bold">
              Sign up here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}