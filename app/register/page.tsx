"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Firebase is only used for Google Login
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase"; 

import api from "@/lib/axios"; // Axios to hit Laravel
import { useAuth } from "@/lib/useAuth"; // Our auth hook

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, AlertCircle, Eye, EyeOff } from "lucide-react";
import { AxiosError } from "axios";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth(); // Get login function from store
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 👇 STRICT PASSWORD VALIDATION (Retained)
  const validatePassword = (password: string) => {
    if (password.length < 12) return "Password must be at least 12 characters!";
    if (!/[A-Z]/.test(password)) return "Must contain uppercase letter.";
    if (!/[a-z]/.test(password)) return "Must contain lowercase letter.";
    if (!/[0-9]/.test(password)) return "Must contain number.";
    if (!/[!@#$%^&*]/.test(password)) return "Must contain symbol (!@#$%^&*).";
    return null;
  };

  // 1. GOOGLE PATH (Login via Firebase -> Sync to Laravel)
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();

    try {
        // A. Login to Google (Firebase)
        const result = await signInWithPopup(firebaseAuth, provider);
        const firebaseUser = result.user;
        // const idToken = await firebaseUser.getIdToken(); // 👈 Delete or comment this since unused

        // B. Sync/Login to Laravel Backend
        // Send Google data to a specific endpoint in Laravel
        // (Ensure the '/auth/firebase-login' endpoint is ready to handle 'firstOrCreate')
        const res = await api.post('/auth/firebase-login', {
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            uid: firebaseUser.uid,
        });

        // C. Save Token from Laravel to LocalStorage (Login Success)
        login(res.data.user, res.data.access_token);

        toast.success(`Wadap, ${firebaseUser.displayName}!`, {
            description: "Google login successful."
        });
        
        router.push('/dashboard'); 

    } catch (error: unknown) { // 👈 Ganti any jadi unknown
        console.error("Google Auth Error:", error);
        
        // Casting error message
        let errorMessage = "Failed to login with Google.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }

        toast.error(errorMessage, {
            description: "Check your connection or try again later."
        });
    } finally {
        setGoogleLoading(false);
    }
  };

  // 2. MANUAL PATH (Register to Laravel Database)
  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate Match
    if (formData.password !== formData.password_confirmation) {
        toast.error("Password & Confirmation do not match!");
        setLoading(false);
        return;
    }

    // Validate Password Strength
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
        toast.error("Weak Password!", { description: passwordError });
        setLoading(false);
        return;
    }

    try {
      // Hit Laravel Register API (Pure Database)
      const res = await api.post("/register", formData);
      
      // Scenario 1: Auto Login after Register (If backend returns token)
      if (res.data.access_token) {
          login(res.data.user, res.data.access_token);
          toast.success("Welcome to the Society!", {
            description: "Account created successfully."
          });
          router.push("/dashboard");
      } 
      // Scenario 2: Must Verify Email first (If backend doesn't give token directly)
      else {
          toast.success("Registration Successful!", {
             description: "Check your email to verify your account."
          });
          router.push("/login");
      }

    } catch (err: unknown) {
      // 👈 Definisikan tipe errors secara spesifik
      const error = err as AxiosError<{ message: string, errors?: Record<string, string[]> }>;
      console.error(error);
      
      let msg = error.response?.data?.message || "Failed to register.";
      
      // Handle validation error from Laravel (e.g. email already exists)
      if (error.response?.data?.errors) {
         const firstErrorKey = Object.keys(error.response.data.errors)[0];
         msg = error.response.data.errors[firstErrorKey][0];
      }
      
      toast.error("Registration Failed", { description: msg });
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
          
          {/* 👇 GOOGLE BUTTON */}
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
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="name" name="name" 
                    placeholder="Your Name" 
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
              <Label htmlFor="password">Password (12+ Characters)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="password" name="password" type={showPassword ? "text" : "password"} 
                    placeholder="••••••••••••" 
                    className="pl-10 pr-10 h-11" 
                    required 
                    value={formData.password} onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="text-[10px] text-muted-foreground flex gap-1 items-start mt-1">
                 <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                 <span>Min 12 chars, Uppercase, Lowercase, Number, & Symbol (!@#$)</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Repeat Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="password_confirmation" name="password_confirmation" type={showConfirmPassword ? "text" : "password"} 
                    placeholder="••••••••••••" 
                    className="pl-10 pr-10 h-11" 
                    required 
                    value={formData.password_confirmation} onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full font-bold uppercase tracking-widest mt-6 h-12" disabled={loading || googleLoading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "REGISTER"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center pb-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-bold">
              Login here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}