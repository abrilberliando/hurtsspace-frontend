import Link from 'next/link';
import { Frown, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-background text-foreground">
      <Frown className="w-16 h-16 text-primary mb-6" />
      <h1 className="text-5xl font-black tracking-tighter mb-3 uppercase">
        404: Page Not Found
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        Waduh, G! Halaman yang lo cari kayaknya udah pindah atau hilang dari peredaran.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" className="font-bold">
          <Link href="/">
            Back to Home
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="font-bold gap-2">
          <Link href="/shop">
            <ArrowLeft className="w-4 h-4" /> Go to Shop
          </Link>
        </Button>
      </div>
    </div>
  );
}