"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { ROLE_LABELS } from "@/lib/constants";
import { SectionHeader } from "@/components/app/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  UserCog, Loader2, Save, Lock, Eye, EyeOff, ShieldCheck, Crown, User,
} from "lucide-react";

export function ProfileSettings() {
  const { user, setUser } = useAppStore();

  // Profile fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [nip, setNip] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Loading states
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoadingProfile(true);
      const res = await api.profile();
      const u = res.user;
      setName(u.name || "");
      setPhone(u.phone || "");
      setPosition(u.position || "");
      setNip(u.nip || "");
      setEmail(u.email || "");
      setRole(u.role || "");
    } catch {
      toast.error("Gagal memuat data profil");
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }
    try {
      setSavingProfile(true);
      const res = await api.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        position: position.trim(),
      });
      // Update store user
      if (user) {
        setUser({ ...user, name: res.user.name, phone: res.user.phone, position: res.user.position });
      }
      toast.success("Profil berhasil diperbarui");
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan profil");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword) {
      toast.error("Password saat ini wajib diisi");
      return;
    }
    if (!newPassword) {
      toast.error("Password baru wajib diisi");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    try {
      setSavingPassword(true);
      await api.updateProfile({
        currentPassword,
        newPassword,
      });
      toast.success("Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast.error(e.message || "Gagal mengubah password");
    } finally {
      setSavingPassword(false);
    }
  };

  const roleIcon = role === "ADMIN" ? ShieldCheck : role === "ATASAN" ? Crown : User;
  const RoleIcon = roleIcon;

  if (loadingProfile) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 space-y-6">
      <SectionHeader
        title="Pengaturan Akun"
        subtitle="Kelola informasi profil dan password Anda"
        icon={UserCog}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informasi Profil */}
        <Card className="glass-card border-primary/15">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCog className="w-4 h-4 text-primary" />
              Informasi Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nama */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-name" className="text-xs font-medium text-muted-foreground">
                Nama Lengkap
              </Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap"
                className="bg-background/50"
              />
            </div>

            {/* Jabatan */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-position" className="text-xs font-medium text-muted-foreground">
                Jabatan
              </Label>
              <Input
                id="profile-position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Jabatan"
                className="bg-background/50"
              />
            </div>

            {/* NIP - read only */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-nip" className="text-xs font-medium text-muted-foreground">
                NIP
              </Label>
              <Input
                id="profile-nip"
                value={nip}
                readOnly
                className="bg-muted/40 cursor-not-allowed text-muted-foreground"
              />
            </div>

            {/* Telepon */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-phone" className="text-xs font-medium text-muted-foreground">
                Telepon
              </Label>
              <Input
                id="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nomor telepon"
                className="bg-background/50"
              />
            </div>

            <Separator className="my-2" />

            {/* Email - read only */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-email" className="text-xs font-medium text-muted-foreground">
                Email
              </Label>
              <Input
                id="profile-email"
                value={email}
                readOnly
                className="bg-muted/40 cursor-not-allowed text-muted-foreground"
              />
            </div>

            {/* Role - read only with badge */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Role
              </Label>
              <div>
                <Badge variant="outline" className="gap-1.5 text-xs py-1 px-2.5">
                  <RoleIcon className="w-3 h-3" />
                  {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}
                </Badge>
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90 mt-2"
            >
              {savingProfile ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Simpan Profil
            </Button>
          </CardContent>
        </Card>

        {/* Ubah Password */}
        <Card className="glass-card border-primary/15">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="w-4 h-4 text-primary" />
              Ubah Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current password */}
            <div className="space-y-1.5">
              <Label htmlFor="current-pw" className="text-xs font-medium text-muted-foreground">
                Password Saat Ini
              </Label>
              <div className="relative">
                <Input
                  id="current-pw"
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan password saat ini"
                  className="bg-background/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Separator className="my-2" />

            {/* New password */}
            <div className="space-y-1.5">
              <Label htmlFor="new-pw" className="text-xs font-medium text-muted-foreground">
                Password Baru
              </Label>
              <div className="relative">
                <Input
                  id="new-pw"
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="bg-background/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword && newPassword.length < 6 && (
                <p className="text-[11px] text-amber-500 mt-1">Password minimal 6 karakter</p>
              )}
            </div>

            {/* Confirm new password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pw" className="text-xs font-medium text-muted-foreground">
                Konfirmasi Password Baru
              </Label>
              <div className="relative">
                <Input
                  id="confirm-pw"
                  type={showConfirmPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="bg-background/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-red-500 mt-1">Password tidak cocok</p>
              )}
            </div>

            <Button
              onClick={handleSavePassword}
              disabled={savingPassword}
              className="w-full bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90 mt-2"
            >
              {savingPassword ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              Simpan Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
