"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { AxiosError } from "axios";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Hit the Laravel endpoint created in PasswordResetController
      await api.post("/forgot-password", { email });
      
      setIsSent(true);
      toast.success("Link Sent! 📧", { 
        description: "Check your inbox or spam folder now." 
      });

    } catch (err: unknown) {
      const error = err as AxiosError<{ message: string }>;
      console.error(error);
      
      // For security, backend usually doesn't reveal if email doesn't exist
      // But if there are other errors, display them
      toast.error("Failed to Send", { 
        description: error.response?.data?.message || "An error occurred, try again later." 
      });
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS VIEW (Check Email)
  if (isSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-green-500/20 bg-green-500/5 text-center p-8 animate-in fade-in zoom-in duration-300 shadow-xl">
             <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-black uppercase text-green-700 mb-2">Check Your Inbox</h2>
            <p className="text-muted-foreground mb-6 text-sm">
                We have sent a password reset link to <strong>{email}</strong>. <br/>
                Click the link in the email to create a new password.
            </p>
            <div className="flex flex-col gap-3">
                <Button asChild variant="outline" className="w-full h-11 font-bold">
                    <Link href="/login">Back to Login</Link>
                </Button>
                <button 
                    onClick={() => setIsSent(false)}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                    Wrong email? Resend
                </button>
            </div>
        </Card>
      </div>
    );
  }

  // EMAIL INPUT FORM VIEW
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-black uppercase tracking-tighter">Forgot Password?</CardTitle>
          <CardDescription>
            Enter your email below and we will send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendLink} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    className="pl-10 h-11" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full font-bold uppercase tracking-widest h-11 mt-2" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "SEND RESET LINK"}
            </Button>
            
          </form>
        </CardContent>
        <CardFooter className="justify-center pb-6">
          <Link 
            href="/login" 
            className="flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}