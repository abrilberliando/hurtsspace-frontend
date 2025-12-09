import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Catalog",
  description: "Browse all Hurtsspace collection.",
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return;
  <Suspense
    fallback={
      <div className="flex justify-center items-center h-screen pt-20">
        Loading Page...
      </div>
    }
  >
    <>{children}</>
  </Suspense>;
}
