import { useEffect, useState } from "react";
import { auth, db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { User, onAuthStateChange, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export function useAuth() {
  const [session, setSession] = useState<{ user: User } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkRole = async (u: User) => {
      if (u.email === 'revv8motors@gmail.com') {
          if (!mounted) return;
          setIsAdmin(true);
          setLoading(false);
          return;
      }
      try {
        const docRef = doc(db, "user_roles", u.uid);
        const docSnap = await getDoc(docRef);
        console.log("[useAuth] checkRole for", u.uid, "exists:", docSnap.exists());
        if (!mounted) return;
        setIsAdmin(docSnap.exists() && docSnap.data().role === "admin");
        setLoading(false);
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, `user_roles/${u.uid}`);
        if (!mounted) return;
        setIsAdmin(false);
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!mounted) return;
      setUser(u);
      setSession(u ? { user: u } : null);
      if (u) {
        setLoading(true);
        setTimeout(() => checkRole(u), 0);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { session, user, isAdmin, loading };
}

