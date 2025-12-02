import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner"; 
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HURTSSPACE | Minimalist Streetwear",
  description: "Official store of Hurtsspace.",
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
            <Navbar />
            <div className="pt-20"> 
                {children}
            </div>
            {/* 👇 2. Pasang Toaster disini, paling bawah */}
            <Toaster position="top-center" richColors />
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