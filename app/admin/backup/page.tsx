"use client";

import { useState, useEffect } from "react";
import { 
  DatabaseBackup, 
  Loader2, 
  Download, 
  Trash2,
  Calendar,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { toast } from "sonner";
import { format } from "date-fns";

interface Backup {
  id: number;
  filename: string;
  file_url: string;
  created_at: string;
}

export default function AdminBackupPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const fetchBackups = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/admin/backups");
      setBackups(res.data.data);
    } catch (error) {
      toast.error("Failed to fetch backups");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleRunBackup = async () => {
    try {
      setIsBackingUp(true);
      toast.info("Generating database backup, please wait...");
      await api.post("/admin/backups");
      toast.success("Database backup generated successfully!");
      fetchBackups();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate backup");
      console.error(error);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDeleteBackup = async (id: number) => {
    if (!confirm("Are you sure you want to delete this backup?")) return;
    try {
      setIsDeleting(id);
      await api.delete(`/admin/backups/${id}`);
      toast.success("Backup deleted successfully");
      setBackups(backups.filter((b) => b.id !== id));
    } catch (error) {
      toast.error("Failed to delete backup");
      console.error(error);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Database Backup</h1>
          <p className="text-muted-foreground mt-1">
            Manage and generate database backups (.sql).
          </p>
        </div>
        <Button 
          onClick={handleRunBackup} 
          disabled={isBackingUp}
          className="gap-2"
        >
          {isBackingUp ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <DatabaseBackup className="w-4 h-4" />
          )}
          {isBackingUp ? "Generating Backup..." : "Run New Backup"}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <DatabaseBackup className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No backups found</p>
            <p className="text-sm">Click "Run New Backup" to generate your first backup.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Filename</th>
                  <th className="px-6 py-4 font-medium">Generated At</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="font-medium">{backup.filename}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(backup.created_at), "MMM d, yyyy HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="gap-2"
                        >
                          <a href={backup.file_url} target="_blank" rel="noreferrer">
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteBackup(backup.id)}
                          disabled={isDeleting === backup.id}
                          className="gap-2"
                        >
                          {isDeleting === backup.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
