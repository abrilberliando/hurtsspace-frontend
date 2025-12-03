import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
// 👇 Import Provider Animasi
import { CartAnimationProvider } from "@/lib/cartAnimationContext";
import Footer from "@/components/shared/Footer";
import BottomNav from "@/components/shared/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HURTSSPACE | Minimalist Streetwear",
  description: "Official store of Hurtsspace.",
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* 👇 BUNGKUS DENGAN ANIMATION PROVIDER */}
            <CartAnimationProvider>
                <Navbar />
                <div className="pt-20 pb-16 md:pb-0">
                    {children}
                </div>
                <Footer />
                <BottomNav />
                <Toaster position="top-center" richColors />
            </CartAnimationProvider>
            
        </ThemeProvider>

        <Script
            src="https://app.sandbox.midtrans.com/snap/snap.js"
            data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
            strategy="lazyOnload"
        />
      </body>
    </html>
  );
}