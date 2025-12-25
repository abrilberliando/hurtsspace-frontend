"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HelpCircle, FileText, MessageSquare } from "lucide-react";

export default function PaymentCheckPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border shadow-xl text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4">
            <HelpCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tighter">
            Status Pembayaran
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Transaksi anda belum terkonfirmasi selesai atau anda menutup halaman pembayaran.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg border border-border text-sm text-left">
            <p className="font-bold mb-2">Udah transfer / bayar?</p>
            <p className="text-muted-foreground mb-4">
              Sistem kami kadang butuh waktu beberapa menit buat verifikasi pembayaran anda. Cek status terbaru di halaman <strong>Order History</strong>.
            </p>
            <p className="font-bold mb-2">Belum bayar?</p>
            <p className="text-muted-foreground">
              Santai, pesanan anda udah tersimpan. Anda bisa lanjutin pembayaran lewat halaman <strong>Order History</strong> juga kok.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button asChild className="w-full font-bold h-12 text-base uppercase tracking-wide">
            <Link href="/dashboard/orders">
              <FileText className="w-4 h-4 mr-2" /> Cek Status Order
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}