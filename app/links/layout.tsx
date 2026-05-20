import { Metadata } from "next";

export const metadata: Metadata = {
    title: "HURTSSPACE",
    description: "Connect with HURTSSPACE. All our links in one place.",
};

export default function LinktreeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Layout bersih, gak ada padding dari main layout
    return (
        <div className="min-h-[100dvh] w-full bg-black text-white overflow-x-hidden">
            {children}
        </div>
    );
}
