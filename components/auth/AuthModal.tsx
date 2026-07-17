"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import api from "@/lib/axios";
import { AxiosError } from "axios";
import { auth as firebaseAuth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"; 

export default function AuthModal() {
    const { isAuthModalOpen, closeAuthModal, login } = useAuth();
    const router = useRouter();

    // Login State
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleManualLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginLoading(true);

        try {
            const res = await api.post("/login", { email: loginEmail, password: loginPassword });
            login(res.data.user, res.data.access_token);
            toast.success("Welcome Back! 👋");
            closeAuthModal();
        } catch (err: unknown) {
            const error = err as AxiosError<{ message: string, not_verified?: boolean }>;
            const msg = error.response?.data?.message || "Login failed, check email/password.";
            if (error.response?.data?.not_verified) {
                toast.warning("Verify Your Email First!", { description: msg });
            } else {
                toast.error("Login Failed", { description: msg });
            }
        } finally {
            setLoginLoading(false);
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
            closeAuthModal();
        } catch (err: unknown) {
            console.error("Google Login Error:", err);
            toast.error("Google Login Failed", { description: "Connection problem with Google." });
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <Dialog open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
            <DialogContent className="sm:max-w-[425px] border-none bg-background rounded-none shadow-2xl overflow-hidden p-6">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Welcome Back</DialogTitle>
                    <DialogDescription>
                        Log in to continue to your checkout.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-2 space-y-4">
                    <Button 
                        variant="outline" 
                        className="w-full h-12 font-bold flex items-center justify-center gap-2 border-zinc-300 transition-all rounded-none"
                        onClick={handleGoogleLogin}
                        disabled={loginLoading || googleLoading}
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

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground font-medium">Or email</span>
                        </div>
                    </div>

                    <form onSubmit={handleManualLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    type="email" 
                                    placeholder="name@example.com" 
                                    className="pl-10 h-11 rounded-none border-2 focus-visible:ring-0 focus-visible:border-foreground" 
                                    required 
                                    value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Password</Label>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        closeAuthModal();
                                        router.push("/forgot-password");
                                    }}
                                    className="text-xs font-semibold text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    type={showLoginPassword ? "text" : "password"} 
                                    placeholder="••••••••••••" 
                                    className="pl-10 pr-10 h-11 rounded-none border-2 focus-visible:ring-0 focus-visible:border-foreground" 
                                    required 
                                    value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                >
                                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full font-black uppercase tracking-widest mt-2 h-12 rounded-none" disabled={loginLoading || googleLoading}>
                            {loginLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "LOGIN"}
                        </Button>
                    </form>
                    
                    <div className="pt-4 text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <button 
                            onClick={() => {
                                closeAuthModal();
                                router.push("/register");
                            }} 
                            className="font-bold text-foreground hover:underline underline-offset-4"
                        >
                            Register here
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
