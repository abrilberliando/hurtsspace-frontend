import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import { ThemeProvider } from "@/components/theme-provider"; // 👈 Import ini

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
      {/* 👆 suppressHydrationWarning wajib biar gak error warning antara server/client */}
      
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
        </ThemeProvider>
      </body>
    </html>
  );
}