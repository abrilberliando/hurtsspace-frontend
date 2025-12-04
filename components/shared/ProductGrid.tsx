import { ReactNode } from "react";

export default function ProductGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 gap-y-10">
      {children}
    </div>
  );
}