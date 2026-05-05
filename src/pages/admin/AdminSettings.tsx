import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { auth, db } from "@/lib/firebase";
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function AdminSettings() {
  const { user } = useAuth();
  const [credBusy, setCredBusy] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  const [aiBusy, setAiBusy] = useState(false);
  const [aiProvider, setAiProvider] = useState("openrouter");
  const [aiModel, setAiModel] = useState("google/gemini-2.0-flash-001");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiConfigured, setAiConfigured] = useState(false);

  useEffect(() => {
    const loadAiSettings = async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "site_settings", "ai"));
        if (snap.exists()) {
          const data = snap.data();
          if (data.aiProvider) setAiProvider(data.aiProvider);
          if (data.aiModel) setAiModel(data.aiModel);
          if (data.aiApiKeyEncrypted) setAiConfigured(true);
        }
      } catch (err) {
        console.error("Failed to load AI settings", err);
      }
    };
    loadAiSettings();
  }, [user]);

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

  const updateAiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiBusy(true);
    let attempts = 0;
    const maxAttempts = 2;

    const performUpdate = async (): Promise<void> => {
      try {
        attempts++;
        if (!auth.currentUser) throw new Error("Not logged in");
        
        let aiApiKeyEncrypted = undefined;
        
        if (aiApiKey) {
          const token = await auth.currentUser.getIdToken();
          const res = await fetch("/api/admin/encrypt", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ text: aiApiKey })
          });
          
          let data;
          try {
            data = await res.json();
          } catch (e) {
            throw new Error(`Server connection error (Status ${res.status})`);
          }
          
          if (!data.success) throw new Error(data.error || "Encryption failed");
          aiApiKeyEncrypted = data.encrypted;
        }
        
        const updateData: any = { aiProvider, aiModel };
        if (aiApiKeyEncrypted) {
          updateData.aiApiKeyEncrypted = aiApiKeyEncrypted;
        }
        
        await setDoc(doc(db, "site_settings", "ai"), updateData, { merge: true });
        toast.success("AI settings updated securely");
        setAiApiKey("");
        setAiConfigured(true);
      } catch (error: any) {
        if (error?.message === "Failed to fetch" && attempts < maxAttempts) {
          console.warn(`Fetch failed (attempt ${attempts}), retrying...`);
          await new Promise(r => setTimeout(r, 1000));
          return performUpdate();
        }
        
        if (error?.message === "Failed to fetch") {
          toast.error("Network error: Server is unreachable. The server may be restarting, please wait a moment and try again.");
        } else {
          toast.error(error.message || "Failed to update AI settings");
        }
      }
    };

    await performUpdate().finally(() => {
      setAiBusy(false);
    });
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <div className="text-xs font-display tracking-[0.4em] text-muted-foreground mb-2">SETTINGS</div>
        <h1 className="font-display font-bold text-3xl">Account & System</h1>
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

      <form onSubmit={updateAiSettings} className="luxury-card p-6 mt-6 space-y-4">
        <div>
          <h2 className="font-display font-bold text-lg">AI Integration</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure secure AI services for auto-generating car descriptions and SEO metadata. 
            Keys are encrypted at rest and never exposed to the client.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs tracking-widest text-muted-foreground">PROVIDER</Label>
            <div className="bg-surface-2 border border-white/10 mt-1 px-3 py-2 rounded-md text-sm">
              OpenRouter
            </div>
          </div>
          <div>
            <Label className="text-xs tracking-widest text-muted-foreground">MODEL</Label>
            <Input
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              placeholder="e.g. google/gemini-2.0-flash-001"
              className="bg-surface-2 border-white/10 mt-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs tracking-widest text-muted-foreground">
            API KEY {aiConfigured && <span className="text-luxury">(Configured)</span>}
          </Label>
          <Input 
            type="password" 
            value={aiApiKey} 
            onChange={(e) => setAiApiKey(e.target.value)}
            placeholder={aiConfigured ? "•••••••• (Leave blank to keep current)" : "Enter API key to encrypt"} 
            className="bg-surface-2 border-white/10 mt-1 text-mono" 
          />
        </div>
        <Button type="submit" variant="luxury" disabled={aiBusy}>
          {aiBusy ? "Saving…" : "Save AI Settings"}
        </Button>
      </form>

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
