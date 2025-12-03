"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, ShoppingBag, Users, Package, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// 👇 DEFINISI TIPE DATA (Biar TS Senyum)
interface LowStockItem {
  id: number;
  stock: number;
  size: string;
  product: { name: string };
}

interface RecentOrder {
  id: number;
  invoice_number: string;
  total_price: number;
  status: string;
  user: { name: string };
}

interface DashboardStats {
  revenue: number;
  total_orders: number;
  total_users: number;
  total_products: number;
  low_stock: LowStockItem[];
  recent_orders: RecentOrder[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/dashboard");
        setStats(res.data.data);
      } catch {
        console.error("Gagal load stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="grid grid-cols-4 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;
  
  // 👇 Cek null biar TS gak rewel 'possibly null'
  if (!stats) return <div>Gagal memuat data.</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black tracking-tight">DASHBOARD</h1>

      {/* 1. KARTU STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">Rp {stats.revenue.toLocaleString("id-ID")}</div>
            </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Total Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.total_orders}</div>
            </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Members</CardTitle>
                <Users className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.total_users}</div>
            </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Total Products</CardTitle>
                <Package className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.total_products}</div>
            </CardContent>
        </Card>
      </div>

      {/* 2. LOW STOCK & RECENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Low Stock */}
          <Card className="bg-card border-border">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Low Stock Alert
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      {stats.low_stock.length === 0 ? (
                          <p className="text-muted-foreground text-sm">Stok aman semua, G!</p>
                      ) : (
                          stats.low_stock.map((item) => (
                              <div key={item.id} className="flex justify-between items-center border-b border-border pb-2 last:border-0">
                                  <div>
                                      <p className="font-bold text-sm">{item.product.name}</p>
                                      <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                                  </div>
                                  <Badge variant="destructive">Sisa {item.stock}</Badge>
                              </div>
                          ))
                      )}
                  </div>
              </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="bg-card border-border">
              <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      {stats.recent_orders.map((order) => (
                          <div key={order.id} className="flex justify-between items-center border-b border-border pb-2 last:border-0">
                              <div>
                                  <p className="font-bold text-sm">{order.invoice_number}</p>
                                  <p className="text-xs text-muted-foreground">{order.user.name}</p>
                              </div>
                              <div className="text-right">
                                  <p className="font-bold text-sm">Rp {order.total_price.toLocaleString()}</p>
                                  <span className="text-[10px] uppercase text-muted-foreground">{order.status}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}