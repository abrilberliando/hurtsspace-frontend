"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { AxiosError } from "axios";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    password_confirmation: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate URL (Must have token & email)
  useEffect(() => {
    if (!token || !email) {
      toast.error("Invalid link", { description: "Missing token or email." });
      router.push("/login");
    }
  }, [token, email, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 👇 STRICT PASSWORD VALIDATION (Copied from Register Page)
  const validatePassword = (password: string) => {
    if (password.length < 12) return "Password must be at least 12 characters!";
    if (!/[A-Z]/.test(password)) return "Must contain uppercase letter.";
    if (!/[a-z]/.test(password)) return "Must contain lowercase letter.";
    if (!/[0-9]/.test(password)) return "Must contain number.";
    if (!/[!@#$%^&*]/.test(password)) return "Must contain symbol (!@#$%^&*).";
    return null;
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.password_confirmation) {
      toast.error("Passwords do not match!");
      setLoading(false);
      return;
    }

    // 👇 Use Strict Validator
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
       toast.error("Weak Password!", { description: passwordError });
       setLoading(false);
       return;
    }

    try {
      await api.post("/reset-password", {
        token,
        email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });

      setIsSuccess(true);
      toast.success("Password Reset Successful! 🎉");

    } catch (err: unknown) {
      const error = err as AxiosError<{ message: string }>;
      const msg = error.response?.data?.message || "Failed to reset password. The link might have expired.";
      toast.error("Failed", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md border-green-500/20 bg-green-500/5 text-center p-8 animate-in fade-in zoom-in">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-black uppercase text-green-700 mb-2">All Set!</h2>
        <p className="text-muted-foreground mb-6">
            Your password has been updated. You can now login with your new password.
        </p>
        <Button asChild className="w-full font-bold h-11">
            <Link href="/login">LOGIN NOW</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-border shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-black uppercase tracking-tighter">Reset Password</CardTitle>
        <CardDescription>
          Enter a secure new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleReset} className="space-y-4">
          
          <div className="space-y-2">
            <Label htmlFor="password">New Password (12+ Characters)</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="password" name="password" type={showPassword ? "text" : "password"} 
                placeholder="••••••••••••" 
                className="pl-10 pr-10 h-11" required 
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
            {/* Helper Text */}
            <div className="text-[10px] text-muted-foreground flex gap-1 items-start mt-1">
                 <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                 <span>Min 12 chars, Uppercase, Lowercase, Number, & Symbol (!@#$)</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password_confirmation">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="password_confirmation" name="password_confirmation" type={showConfirmPassword ? "text" : "password"} 
                placeholder="••••••••••••" 
                className="pl-10 pr-10 h-11" required 
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

          <Button type="submit" className="w-full font-bold uppercase tracking-widest h-11 mt-4" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "UPDATE PASSWORD"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Suspense fallback={<div className="animate-pulse text-muted-foreground">Loading...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}