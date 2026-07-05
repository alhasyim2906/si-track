"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, LogIn, ShieldCheck, UserCog, Crown, X } from "lucide-react";
import { Logo } from "./Logo";

export function LoginModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const setUser = useAppStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const r = await api.login(email, password);
      setUser(r.user);
      toast.success(`Selamat datang, ${r.user.name}!`);
      onOpenChange(false);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      toast.error(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (role: "admin" | "petugas" | "atasan") => {
    const map = {
      admin: { e: "admin@kpii.go.id", p: "admin123" },
      petugas: { e: "petugas@kpii.go.id", p: "petugas123" },
      atasan: { e: "lurah@kpii.go.id", p: "lurah123" },
    };
    setEmail(map[role].e);
    setPassword(map[role].p);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card navy-glow border-primary/30 sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <Logo size={56} />
          </div>
          <DialogTitle className="text-center text-xl gold-gradient-text font-extrabold">Login Petugas</DialogTitle>
          <DialogDescription className="text-center text-xs">
            Masuk sebagai Admin, Petugas, atau Lurah untuk mengelola permohonan surat tanah.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input id="email" type="email" placeholder="nama@kpii.go.id" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background/60" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-background/60" required />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#f5d77a] via-[#d4af37] to-[#b8941f] text-[#0a1628] font-semibold hover:opacity-90">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
            Masuk
          </Button>
        </form>
        <div className="pt-2 border-t border-border/40">
          <p className="text-[10px] text-center text-muted-foreground mb-2 uppercase tracking-wide">Akun Demo (klik untuk isi otomatis)</p>
          <div className="grid grid-cols-3 gap-2">
            <Button type="button" variant="outline" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 text-[10px]" onClick={() => quickFill("admin")}>
              <ShieldCheck className="w-4 h-4 text-primary" /> Admin
            </Button>
            <Button type="button" variant="outline" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 text-[10px]" onClick={() => quickFill("petugas")}>
              <UserCog className="w-4 h-4 text-primary" /> Petugas
            </Button>
            <Button type="button" variant="outline" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 text-[10px]" onClick={() => quickFill("atasan")}>
              <Crown className="w-4 h-4 text-primary" /> Lurah
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
