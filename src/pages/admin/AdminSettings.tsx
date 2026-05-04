import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminSettings() {
  const { user } = useAuth();
  const [credBusy, setCredBusy] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  const updateCreds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail && !newPassword) return toast.error("Enter a new email or password");
    if (!currentPassword) return toast.error("Enter your current password");
    if (!auth.currentUser || !auth.currentUser.email) return toast.error("Not authenticated properly");
    setCredBusy(true);

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      if (newEmail && newEmail !== auth.currentUser.email) {
        await updateEmail(auth.currentUser, newEmail);
      }
      if (newPassword) {
        await updatePassword(auth.currentUser, newPassword);
      }
      
      toast.success("Credentials updated. Please sign in again.");
      setNewEmail(""); setNewPassword(""); setCurrentPassword("");
      setTimeout(async () => {
        await signOut(auth);
        window.location.href = "/auth";
      }, 1200);
    } catch (error: any) {
      toast.error(error.message || "Update failed");
    } finally {
      setCredBusy(false);
    }
  };


  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <div className="text-xs font-display tracking-[0.4em] text-muted-foreground mb-2">SETTINGS</div>
        <h1 className="font-display font-bold text-3xl">Account</h1>
      </div>

      <div className="luxury-card p-6 space-y-4">
        <div>
          <Label className="text-xs tracking-widest text-muted-foreground">SIGNED IN AS</Label>
          <div className="font-display mt-1">{user?.email}</div>
        </div>
        <div>
          <Label className="text-xs tracking-widest text-muted-foreground">USER ID</Label>
          <div className="text-xs text-muted-foreground mt-1 font-mono break-all">{user?.id}</div>
        </div>
      </div>

      <form onSubmit={updateCreds} className="luxury-card p-6 mt-6 space-y-4">
        <div>
          <h2 className="font-display font-bold text-lg">Change admin credentials</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Update your email and/or password. Confirm with your current password.
          </p>
        </div>
        <div>
          <Label className="text-xs tracking-widest text-muted-foreground">NEW EMAIL (OPTIONAL)</Label>
          <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
            placeholder={user?.email ?? ""} className="bg-surface-2 border-white/10 mt-1" />
        </div>
        <div>
          <Label className="text-xs tracking-widest text-muted-foreground">NEW PASSWORD (OPTIONAL)</Label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            minLength={8} placeholder="Min 8 characters" className="bg-surface-2 border-white/10 mt-1" />
        </div>
        <div>
          <Label className="text-xs tracking-widest text-muted-foreground">CURRENT PASSWORD</Label>
          <Input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            className="bg-surface-2 border-white/10 mt-1" />
        </div>
        <Button type="submit" variant="luxury" disabled={credBusy}>
          {credBusy ? "Updating…" : "Update credentials"}
        </Button>
      </form>

    </div>
  );
}
