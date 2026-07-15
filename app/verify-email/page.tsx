"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState("Verifying your email status...");

    useEffect(() => {
        // Backend Laravel akan redirect ke sini dengan query param:
        // Success: /verify-email?verified=1
        // Error: /verify-email?error=message

        const isVerified = searchParams.get('verified');
        const errorMsg = searchParams.get('error');

        // Simulasi delay dikit biar UX kerasa "memproses" (opsional)
        const timer = setTimeout(() => {
            if (isVerified) {
                setStatus('success');
                setMessage("Email successfully verified! Your account is active and ready to use.");
            } else if (errorMsg) {
                setStatus('error');
                setMessage(decodeURIComponent(errorMsg));
            } else {
                // Fallback if user randomly opens this page without a link from email
                setStatus('error');
                setMessage("Invalid link or missing parameters.");
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [searchParams]);

    return (
        <Card className="w-full max-w-md border-border shadow-2xl text-center overflow-hidden">
            {/* Status Indicator Bar */}
            <div className={`h-2 w-full ${status === 'success' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-blue-500 animate-pulse'}`} />
            
            <CardHeader className="pt-10 pb-2">
                <div className="flex justify-center mb-6">
                    {status === 'loading' && (
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                            <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative z-10" />
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                            <CheckCircle2 className="w-20 h-20 text-green-500 animate-in zoom-in duration-300 relative z-10" />
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                            <XCircle className="w-20 h-20 text-red-500 animate-in zoom-in duration-300 relative z-10" />
                        </div>
                    )}
                </div>
                
                <CardTitle className="text-3xl font-black uppercase tracking-tighter">
                    {status === 'loading' ? 'Verifying...' : status === 'success' ? 'Verified!' : 'Oopss!'}
                </CardTitle>
                <CardDescription className="text-base mt-2 px-4 leading-relaxed">
                    {message}
                </CardDescription>
            </CardHeader>

            <CardFooter className="flex justify-center pb-10 pt-4 px-8">
                {status === 'success' ? (
                    <Button asChild size="lg" className="w-full font-bold h-12 uppercase tracking-wide gap-2 group">
                        <Link href="/login">
                            Login Now <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                ) : status === 'error' ? (
                     <Button asChild variant="outline" className="w-full">
                        <Link href="/login">Back to Login</Link>
                    </Button>
                ) : (
                    <Button disabled variant="ghost" className="w-full text-muted-foreground">
                        Please wait...
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

export default function VerifyEmailPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-background px-4 bg-[url('/grid-pattern.svg')]">
             {/* Suspense is required for pages that read useSearchParams */}
             <Suspense fallback={<div className="text-sm text-muted-foreground animate-pulse">Loading verification...</div>}>
                <VerifyEmailContent />
             </Suspense>
        </main>
    );
}