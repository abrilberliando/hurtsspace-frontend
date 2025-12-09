'use client'; // Error components must be Client Components

import { Suspense, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error ke layanan error reporting (e.g., Sentry)
    console.error("Critical Runtime Error:", error);
  }, [error]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-background text-foreground">
      <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
      <h1 className="text-5xl font-black tracking-tighter mb-3 uppercase text-red-500">
        500: Server Down
      </h1>
      <p className="text-lg text-muted-foreground mb-4 max-w-md">
        Waduh, ada masalah teknis yang tidak terduga, G. Coba ulangi lagi ya.
      </p>
      <p className="text-xs text-red-400 mb-8">
        Error detail: {error.message}
      </p>

      <Button 
        onClick={() => reset()} // Mencoba me-render ulang segment
        size="lg" 
        className="font-bold gap-2"
      >
        <RefreshCw className="w-4 h-4" /> Coba Lagi
      </Button>
    </div>
    </Suspense>
  );
}