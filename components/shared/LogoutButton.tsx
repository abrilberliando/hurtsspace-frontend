"use client";

import React from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";

// 👇 FIX: Pake ComponentProps biar auto-detect semua props milik Button (termasuk className & variant)
interface LogoutButtonProps extends React.ComponentProps<typeof Button> {
  showIcon?: boolean;
  text?: string;
}

export default function LogoutButton({ 
  className, 
  variant = "destructive", 
  showIcon = true, 
  text = "Logout",
  ...props 
}: LogoutButtonProps) {
  const { logout } = useAuth();

  return (
    <Button 
      variant={variant} 
      className={className} 
      onClick={logout}
      {...props}
    >
      {showIcon && <LogOut className="w-4 h-4 mr-2" />}
      {text}
    </Button>
  );
}