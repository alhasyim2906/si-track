"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { SectionHeader } from "@/components/app/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  Loader2,
  Inbox,
  ShieldCheck,
  UserCog,
  Crown,
  Save,
  Mail,
  Phone,
  IdCard,
  Briefcase,
} from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: Role;
  position: string | null;
  nip: string | null;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const roleIcon = (role: string) => (role === "ADMIN" ? ShieldCheck : role === "ATASAN" ? Crown : UserCog);
const roleColor = (role: string) =>
  role === "ADMIN" ? "#d4af37" : role === "ATASAN" ? "#f59e0b" : "#3b82f6";

function fmtDateTime(iso: string | null): string {
  if (!iso) return "Belum pernah";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

interface FormState {
  email: string;
  name: string;
  role: Role;
  position: string;
  nip: string;
  phone: string;
  password: string;
  isActive: boolean;
}

const emptyForm: FormState = {
  email: "",
  name: "",
  role: "PETUGAS",
  position: "",
  nip: "",
  phone: "",
  password: "",
  isActive: true,
};

export function UserManagement() {
  const { user: currentUser, can } = useAppStore();
  const allowed = can("manage_users");

  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);

  // dialog state
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  // delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await api.users()) as { items: UserItem[] };
      setItems(res.items || []);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat daftar pengguna");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (u: UserItem) => {
    setEditId(u.id);
    setForm({
      email: u.email,
      name: u.name,
      role: u.role,
      position: u.position || "",
      nip: u.nip || "",
      phone: u.phone || "",
      password: "",
      isActive: u.isActive,
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    // validation
    if (!form.email.trim() || !form.name.trim() || !form.role) {
      toast.error("Email, Nama, dan Role wajib diisi");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error("Format email tidak valid");
      return;
    }
    if (!editId && !form.password.trim()) {
      toast.error("Password wajib diisi untuk pengguna baru");
      return;
    }
    if (form.password && form.password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setSaving(true);
    try {
      const body: any = {
        email: form.email.trim().toLowerCase(),
        name: form.name.trim(),
        role: form.role,
        position: form.position.trim() || undefined,
        nip: form.nip.trim() || undefined,
        phone: form.phone.trim() || undefined,
        isActive: form.isActive,
      };
      if (form.password.trim()) body.password = form.password.trim();

      if (editId) {
        await api.updateUser(editId, body);
        toast.success("Pengguna berhasil diperbarui");
      } else {
        await api.createUser(body);
        toast.success("Pengguna baru berhasil ditambahkan");
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan pengguna");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: UserItem) => {
    // optimistic
    const prev = items;
    setItems((arr) => arr.map((x) => (x.id === u.id ? { ...x, isActive: !u.isActive } : x)));
    try {
      await api.updateUser(u.id, { isActive: !u.isActive });
      toast.success(`Akun ${u.name} ${!u.isActive ? "diaktifkan" : "dinonaktifkan"}`);
    } catch (e: any) {
      setItems(prev);
      toast.error(e?.message || "Gagal mengubah status akun");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.deleteUser(deleteId);
      toast.success("Pengguna berhasil dihapus");
      setDeleteId(null);
      setDeleteName("");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Gagal menghapus pengguna");
    } finally {
      setDeleting(false);
    }
  };

  if (!allowed) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <Card className="glass-card border-primary/15">
          <CardContent className="p-8 text-center text-muted-foreground">
            Akses ditolak. Hanya Administrator yang dapat mengelola pengguna.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 space-y-5">
      <SectionHeader
        title="Manajemen Pengguna"
        subtitle="Kelola akun admin, petugas, dan atasan"
        icon={Users}
        action={
          <Button
            onClick={openCreate}
            className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> Tambah Pengguna
          </Button>
        }
      />

      <Card className="glass-card border-primary/15">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Daftar Pengguna</h3>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {items.length} pengguna
            </Badge>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Memuat pengguna…</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="w-10 h-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada pengguna terdaftar.</p>
            </div>
          ) : (
            <div className="list-table-scroll max-h-[60vh] overflow-y-auto overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
                    <TableHead className="text-xs">Pengguna</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Jabatan</TableHead>
                    <TableHead className="text-xs">NIP</TableHead>
                    <TableHead className="text-xs">Telepon</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Login Terakhir</TableHead>
                    <TableHead className="text-xs text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((u) => {
                    const RoleIcon = roleIcon(u.role);
                    const rc = roleColor(u.role);
                    const isSelf = currentUser?.id === u.id;
                    return (
                      <TableRow key={u.id} className="border-border/30">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="w-8 h-8 border" style={{ borderColor: `${rc}55` }}>
                              <AvatarFallback
                                className="text-xs font-bold"
                                style={{ backgroundColor: `${rc}1a`, color: rc }}
                              >
                                {u.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate flex items-center gap-1.5">
                                {u.name}
                                {isSelf && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/40 text-primary">
                                    Anda
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate">{u.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className="inline-flex items-center gap-1 rounded-full text-[10px] font-semibold px-2 py-0.5 border whitespace-nowrap"
                            style={{ color: rc, backgroundColor: `${rc}1a`, borderColor: `${rc}55` }}
                          >
                            <RoleIcon className="w-3 h-3" />
                            {ROLE_LABELS[u.role]}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">{u.position || "—"}</TableCell>
                        <TableCell className="text-xs font-mono">{u.nip || "—"}</TableCell>
                        <TableCell className="text-xs">{u.phone || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={u.isActive}
                              onCheckedChange={() => handleToggleActive(u)}
                              disabled={isSelf}
                            />
                            <span
                              className={`text-[10px] font-medium ${
                                u.isActive ? "text-green-400" : "text-muted-foreground"
                              }`}
                            >
                              {u.isActive ? "Aktif" : "Nonaktif"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {fmtDateTime(u.lastLoginAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => openEdit(u)}
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            {isSelf ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-40" disabled>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>Tidak dapat menghapus akun sendiri</TooltipContent>
                              </Tooltip>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setDeleteId(u.id);
                                  setDeleteName(u.name);
                                }}
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card navy-glow border-primary/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              {editId ? "Edit Pengguna" : "Tambah Pengguna Baru"}
            </DialogTitle>
            <DialogDescription>
              {editId
                ? "Perbarui informasi pengguna. Kosongkan password jika tidak ingin mengubahnya."
                : "Lengkapi data untuk membuat akun pengguna baru."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nama@kelurahan.go.id"
                  className="pl-8 bg-input/50"
                />
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Nama Lengkap *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama lengkap pengguna"
                className="bg-input/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role *</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as Role })}
              >
                <SelectTrigger className="w-full bg-input/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#d4af37]" /> Administrator
                  </SelectItem>
                  <SelectItem value="PETUGAS">
                    <UserCog className="w-3.5 h-3.5 mr-1 text-[#3b82f6]" /> Petugas Kelurahan
                  </SelectItem>
                  <SelectItem value="ATASAN">
                    <Crown className="w-3.5 h-3.5 mr-1 text-[#f59e0b]" /> Lurah (Atasan)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Jabatan</Label>
              <div className="relative">
                <Briefcase className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  placeholder="Staf Administrasi"
                  className="pl-8 bg-input/50"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">NIP</Label>
              <div className="relative">
                <IdCard className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={form.nip}
                  onChange={(e) => setForm({ ...form, nip: e.target.value })}
                  placeholder="19850101 201001 1 001"
                  className="pl-8 bg-input/50"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Telepon</Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="08xx-xxxx-xxxx"
                  className="pl-8 bg-input/50"
                />
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">
                Password {editId ? <span className="text-muted-foreground">(kosongkan jika tidak diubah)</span> : "*"}
              </Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editId ? "••••••••" : "Minimal 6 karakter"}
                className="bg-input/50"
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between rounded-lg border border-border/40 p-3 bg-input/20">
              <div>
                <Label className="text-sm font-medium">Akun Aktif</Label>
                <p className="text-[11px] text-muted-foreground">Pengguna nonaktif tidak dapat login</p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
              {editId ? "Simpan Perubahan" : "Tambah Pengguna"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="glass-card navy-glow border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-destructive" /> Hapus Pengguna?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus akun <strong className="text-foreground">{deleteName}</strong>.
              Tindakan ini tidak dapat dibatalkan. Riwayat aktivitas tetap tersimpan dengan referensi nama.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
