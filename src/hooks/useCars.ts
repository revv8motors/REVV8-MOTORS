import { useQuery } from "@tanstack/react-query";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { Car } from "@/types/car";
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";

export function useCars(opts?: { featured?: boolean; published?: boolean; limit?: number }) {
  return useQuery({
    queryKey: ["cars", opts],
    queryFn: async () => {
      try {
        let q = query(collection(db, "cars"), orderBy("created_at", "desc"));
        if (opts?.featured !== undefined) q = query(q, where("featured", "==", opts.featured));
        if (opts?.published !== undefined) q = query(q, where("published", "==", opts.published));
        if (opts?.limit) q = query(q, limit(opts.limit));
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Car);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, "cars");
        return [];
      }
    },
  });
}

export function useCar(id?: string) {
  return useQuery({
    queryKey: ["car", id],
    enabled: !!id,
    queryFn: async () => {
      try {
        const docRef = doc(db, "cars", id!);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Car;
        }
        return null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `cars/${id}`);
        return null;
      }
    },
  });
}

