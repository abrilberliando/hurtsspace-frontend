"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MoreVertical, Eye, Ban, Undo2 } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    points: number;
    created_at: string;
    deleted_at: string | null;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    // Pagination states (kalau nanti API support, skrg static 1 page dulu krn API pakai simple paginate)
    const [page, setPage] = useState(1);

    // Dialog States
    const [suspendDialog, setSuspendDialog] = useState<{isOpen: boolean, user: User | null}>({isOpen: false, user: null});
    const [restoreDialog, setRestoreDialog] = useState<{isOpen: boolean, user: User | null}>({isOpen: false, user: null});
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [search, roleFilter, page]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/users`, {
                params: { search, role: roleFilter, page }
            });
            // Assume Laravel pagination structure: res.data.data.data 
            // karena res()->json(['data' => $users]) -> paginate() di dalam 'data'
            setUsers(res.data.data.data || res.data.data);
        } catch (error) {
            toast.error("Gagal mengambil data user");
        } finally {
            setLoading(false);
        }
    };

    const confirmSuspend = async () => {
        if (!suspendDialog.user) return;
        setIsProcessing(true);
        try {
            await api.delete(`/admin/users/${suspendDialog.user.id}`);
            toast.success("User berhasil disuspend");
            setSuspendDialog({ isOpen: false, user: null });
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Gagal suspend user");
        } finally {
            setIsProcessing(false);
        }
    };

    const confirmRestore = async () => {
        if (!restoreDialog.user) return;
        setIsProcessing(true);
        try {
            await api.post(`/admin/users/${restoreDialog.user.id}/restore`);
            toast.success("User berhasil dipulihkan");
            setRestoreDialog({ isOpen: false, user: null });
            fetchUsers();
        } catch (error: any) {
            toast.error("Gagal memulihkan user");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">Kelola pengguna, admin, dan hak akses.</p>
            </div>

            <Card className="bg-card border-border">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama, email, atau telepon..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="w-full sm:w-auto">
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full sm:w-[150px]">
                                <SelectValue placeholder="Semua Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Role</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border-border">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>No. HP</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Points</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-[60px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                        Tidak ada data user.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id} className={user.deleted_at ? "opacity-50 bg-destructive/5" : ""}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.phone || "-"}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="uppercase">
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{user.points}</TableCell>
                                        <TableCell>
                                            {user.deleted_at ? (
                                                <Badge variant="destructive">Suspended</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-green-500 border-green-500/50 bg-green-500/10">Active</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/users/${user.id}`} className="cursor-pointer">
                                                            <Eye className="w-4 h-4 mr-2" /> Detail
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {user.deleted_at ? (
                                                        <DropdownMenuItem onClick={() => setRestoreDialog({ isOpen: true, user })} className="text-green-500 cursor-pointer">
                                                            <Undo2 className="w-4 h-4 mr-2" /> Pulihkan (Unsuspend)
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => setSuspendDialog({ isOpen: true, user })} className="text-destructive cursor-pointer">
                                                            <Ban className="w-4 h-4 mr-2" /> Suspend
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Suspend Alert Dialog */}
            <AlertDialog open={suspendDialog.isOpen} onOpenChange={(isOpen) => !isProcessing && setSuspendDialog({ ...suspendDialog, isOpen })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Suspend Akun Ini?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan membuat akun <strong>{suspendDialog.user?.name}</strong> tidak dapat digunakan untuk login lagi sampai dipulihkan kembali. Riwayat transaksi mereka akan tetap tersimpan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
                        <Button variant="destructive" onClick={confirmSuspend} disabled={isProcessing}>
                            {isProcessing ? "Memproses..." : "Ya, Suspend"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Restore Alert Dialog */}
            <AlertDialog open={restoreDialog.isOpen} onOpenChange={(isOpen) => !isProcessing && setRestoreDialog({ ...restoreDialog, isOpen })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Pulihkan Akun Ini?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini akan memulihkan akun <strong>{restoreDialog.user?.name}</strong> sehingga mereka bisa kembali login dan mengakses sistem seperti biasa.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={confirmRestore} disabled={isProcessing}>
                            {isProcessing ? "Memproses..." : "Ya, Pulihkan"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
