"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation"; // 👈 Import notFound
import { useAuth } from "@/lib/useAuth";
import { Loader2 } from "lucide-react";
import DashboardProfile from "@/components/dashboard/DashboardProfile";

export default function DashboardPage() {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Kasih waktu bentar buat useAuth load dari localStorage biar gak flashing 404
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // 1. Loading Screen (Biar gak kaget putih doang)
  if (isChecking) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 2. Security Check: Kalau gak login -> 404 Not Found
  if (!user) {
    return notFound();
  }

  // 3. Render Dashboard kalau Lulus
  return (
    <div>
      <DashboardProfile />
    </div>
  );
}