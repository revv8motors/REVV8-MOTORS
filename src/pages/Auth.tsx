import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock } from "lucide-react";

export default function Auth() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Admin Sign In — REVV8 Motors";
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) nav("/admin", { replace: true });
    });
    return () => unsubscribe();
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back");
      nav("/admin", { replace: true });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-glow opacity-50" />
      <div className="relative w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="font-display font-black text-2xl tracking-[0.18em] text-metal">REVV8</span>
            <span className="font-display text-xs tracking-[0.4em] text-muted-foreground border-l hairline pl-2">MOTORS</span>
          </div>
          <h1 className="font-display font-bold text-3xl">Admin Sign In</h1>
        </div>
        <form onSubmit={submit} className="luxury-card p-8 space-y-5">
          <div>
            <Label className="text-xs tracking-widest text-muted-foreground">EMAIL</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="bg-surface-2 border-white/10 mt-1" placeholder="you@example.com" />
          </div>
          <div>
            <Label className="text-xs tracking-widest text-muted-foreground">PASSWORD</Label>
            <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="bg-surface-2 border-white/10 mt-1" />
          </div>
          <Button type="submit" variant="luxury" size="lg" className="w-full" disabled={loading}>
            <Lock className="h-4 w-4 mr-2" />
            {loading ? "Please wait…" : "Sign In"}
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Restricted area. Admin access only.
        </p>
      </div>
    </div>
  );
}
