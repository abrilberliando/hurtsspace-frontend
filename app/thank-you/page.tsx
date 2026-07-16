"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, ShoppingBag } from "lucide-react";

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 text-center">
      
      {/* Icon Sukses */}
      <div className="mb-6 animate-in zoom-in duration-500">
        <CheckCircle className="w-24 h-24 text-green-500" />
      </div>

      <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 uppercase">
        Payment Successful!
      </h1>
      
      <p className="text-muted-foreground max-w-md mb-10 text-lg">
        Thank you for shopping at Hurtsspace, G! <br/>
        Your order is being processed and will be shipped soon.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Button asChild size="lg" className="w-full font-bold">
            <Link href="/dashboard/orders">
                <ShoppingBag className="w-4 h-4 mr-2" />
                CHECK MY ORDER
            </Link>
        </Button>

        <Button asChild variant="outline" size="lg" className="w-full font-bold">
            <Link href="/">
                BALIK KE HOME <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
        </Button>
      </div>

    </main>
  );
}