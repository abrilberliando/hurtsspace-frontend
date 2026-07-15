"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User as UserIcon, Mail, Phone, MapPin, Award, History, Clock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Order {
    id: number;
    invoice_number: string;
    total_price: number;
    status: string;
    created_at: string;
}

interface UserDetail {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    points: number;
    address_detail: string | null;
    created_at: string;
    deleted_at: string | null;
    orders: Order[];
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Form state
    const [role, setRole] = useState("member");

    useEffect(() => {
        fetchUser();
    }, [id]);

    const fetchUser = async () => {
        try {
            const res = await api.get(`/admin/users/${id}`);
            setUser(res.data.data);
            setRole(res.data.data.role);
        } catch (error) {
            toast.error("Failed to load user data");
            router.push("/admin/users");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async () => {
        setSaving(true);
        try {
            await api.put(`/admin/users/${id}`, { role });
            toast.success("User role successfully updated");
            fetchUser(); // reload data
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update role");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 space-y-6">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-[400px] w-full" />
        </div>;
    }

    if (!user) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/users">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Details</h1>
                    <p className="text-muted-foreground">ID: {user.id}</p>
                </div>
                {user.deleted_at && (
                    <Badge variant="destructive" className="ml-auto">Suspended</Badge>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* --- BAGIAN 1: INFORMASI PROFIL --- */}
                <Card className="md:col-span-1 border-border">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <UserIcon className="w-5 h-5" />
                            Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col gap-1">
                            <p className="text-sm text-muted-foreground font-medium">Full Name</p>
                            <p className="font-semibold text-lg">{user.name}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                                <Mail className="w-4 h-4" /> Email
                            </p>
                            <p>{user.email}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                                <Phone className="w-4 h-4" /> Phone Number
                            </p>
                            <p>{user.phone || "-"}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Main Address
                            </p>
                            <p className="text-sm">{user.address_detail || "No address yet"}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                                <Award className="w-4 h-4 text-yellow-500" /> Society Points
                            </p>
                            <p className="font-bold text-yellow-500">{user.points} PTS</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Joined Since
                            </p>
                            <p className="text-sm">{formatDate(user.created_at)}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* --- BAGIAN 2: KONTROL ADMIN & RIWAYAT --- */}
                <div className="md:col-span-2 space-y-6">
                    
                    {/* KONTROL ROLE */}
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="text-lg">Access Control (Role)</CardTitle>
                            <CardDescription>Change the user's access level in the system</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <Select value={role} onValueChange={setRole} disabled={user.deleted_at !== null}>
                                    <SelectTrigger className="w-full sm:w-[200px]">
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="member">Member</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button 
                                    onClick={handleUpdateRole} 
                                    disabled={role === user.role || saving || user.deleted_at !== null}
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                            {user.deleted_at && (
                                <p className="text-sm text-destructive mt-3">
                                    * This user is suspended, role cannot be changed.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* TABEL ORDER */}
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <History className="w-5 h-5" />
                                Purchase History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {user.orders.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                                    This user has never made a purchase.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            user.orders.map((order) => (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-medium">
                                                        <Link href={`/admin/orders/${order.invoice_number}`} className="hover:underline text-primary">
                                                            {order.invoice_number}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="text-sm">{formatDate(order.created_at)}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="uppercase text-xs">
                                                            {order.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                        {formatCurrency(order.total_price)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
