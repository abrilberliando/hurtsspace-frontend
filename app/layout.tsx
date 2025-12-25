import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import MidtransScriptLoader from "@/components/shared/MidtransScriptLoader"; 
import { CartAnimationProvider } from "@/lib/cartAnimationContext";
import Footer from "@/components/shared/Footer";
import BottomNav from "@/components/shared/BottomNav";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import AuthCheck from "@/components/auth/AuthCheck";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    metadataBase: new URL("https://hurtsspace.com"), 
    title: {
      default: "HURTSSPACE | Minimalist Streetwear Indonesia",
      template: "%s | HURTSSPACE",
    },
    description: "Official store of Hurtsspace. Premium minimalist streetwear designed in Indonesia. Shop the latest drop of tees, hoodies, and cargo pants.",
    keywords: ["streetwear", "fashion", "indonesia", "clothing brand", "minimalist", "hurtsspace"],
    authors: [{ name: "Hurtsspace Team" }],
    creator: "Hurtsspace",
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: "https://hurtsspace.com",
      title: "HURTSSPACE | Minimalist Streetwear",
      description: "Redefine your style with premium cuts and minimalist design.",
      siteName: "HURTSSPACE",
      images: [
        {
          url: "/og-image.jpg", 
          width: 1200,
          height: 630,
          alt: "Hurtsspace Official Store",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "HURTSSPACE | Minimalist Streetwear",
      description: "Redefine your style with premium cuts and minimalist design.",
      images: ["/og-image.jpg"],
      creator: "@hurtsspace", 
    },
};

// Config Viewport terpisah di Next.js 14/15
export const viewport: Viewport = {
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
                {/* 1. SCRIPT MIDTRANS DINAMIS DI SINI */}
                <MidtransScriptLoader /> 

                <AuthCheck />
                
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                    >
                        {/* 👇 BUNGKUS DENGAN ANIMATION PROVIDER */}
                        <CartAnimationProvider>
                            <Suspense fallback={<div className="h-20 border-b flex items-center justify-center">...</div>}>
                                <Navbar />
                            </Suspense>
                            <Suspense fallback={<div className="flex justify-center items-center h-screen pt-20">...</div>}>
                            <div className="pt-20 pb-16 md:pb-0">
                                {children}
                            </div>
                            </Suspense>
                            <Footer />
                            <BottomNav />
                            <Toaster position="top-center" richColors />
                        </CartAnimationProvider>
                        
                </ThemeProvider>
            </body>
        </html>
    );
}