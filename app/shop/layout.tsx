import { Metadata } from "next";
import { Suspense } from "react"; // 👇 Import Suspense
import { Loader2 } from "lucide-react"; // 👇 Import Icon Loading (Optional, biar cantik)

export const metadata: Metadata = {
  title: "Catalog",
  description: "Browse all Hurtsspace collection.",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    // 👇 BUNGKUS CHILDREN DENGAN SUSPENSE
    <Suspense 
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground animate-pulse">
                Loading...
            </p>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}