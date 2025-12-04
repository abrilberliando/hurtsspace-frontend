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
import type { Metadata, Viewport } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://hurtsspace.com"), // Ganti domain nanti pas deploy
  title: {
    default: "HURTSSPACE | Minimalist Streetwear Indonesia",
    template: "%s | HURTSSPACE", // Nanti %s diganti nama produk
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
        url: "/og-image.jpg", // Nanti kita siapin gambar ini di folder public
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
    creator: "@hurtsspace", // Ganti username sosmed
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