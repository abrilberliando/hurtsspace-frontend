"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Bell, Info, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/lib/useAuth";

interface Notification {
  id: string;
  data: {
    title: string;
    message: string;
    url?: string;
    amount?: number;
    type?: string;
  };
  read_at: string | null;
  created_at: string;
}

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // 👇 FIX: Logic Fetch dipindah ke dalam useEffect
  // Gak perlu useCallback lagi, code jadi lebih ringkas & aman dari linter warning
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications");
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unread_count);
      } catch (error) {
        console.error("Failed to load notifications", error);
      }
    };

    // Panggil langsung
    fetchNotifications();

    // Polling tiap 1 menit (Realtime-ish)
    const interval = setInterval(fetchNotifications, 60000);
    
    // Cleanup interval pas unmount
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.put("/notifications/read");
      setUnreadCount(0);
      // Optimistic update UI
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      handleMarkAsRead(); // Auto read pas dibuka
    }
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-background animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <h4 className="font-bold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">
              {unreadCount} New
            </span>
          )}
        </div>
        
        {/* Div biasa + overflow-y-auto sebagai pengganti ScrollArea */}
        <div className="h-[300px] overflow-y-auto scrollbar-hide">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-xs">No notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 hover:bg-muted/50 transition-colors ${!notif.read_at ? 'bg-muted/10' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1 shrink-0">
                        {/* Icon Dinamis */}
                        {notif.data.type === 'order_paid' ? (
                            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <Package className="w-4 h-4" />
                            </div>
                        ) : (
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                <Info className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-bold leading-none">{notif.data.title}</p>
                      <p className="text-xs text-muted-foreground leading-snug">
                        {notif.data.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground pt-1">
                        {new Date(notif.created_at).toLocaleDateString("id-ID", { 
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                      
                      {notif.data.url && (
                          <Link href={notif.data.url} className="block mt-2">
                              <Button variant="outline" size="sm" className="w-full h-7 text-xs">
                                  Lihat Detail
                              </Button>
                          </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}