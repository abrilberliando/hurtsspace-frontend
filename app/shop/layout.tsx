import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catalog",
  description: "Browse all Hurtsspace collection.",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}