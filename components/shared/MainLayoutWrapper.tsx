"use client";

import { usePathname } from "next/navigation";

export default function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isSpecialRoute = pathname === '/shop' || pathname.startsWith('/admin');

    return (
        <div className={isSpecialRoute ? "" : "pt-20 pb-16 md:pb-0"}>
            {children}
        </div>
    );
}
