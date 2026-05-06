import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useSiteImages(type: string) {
  return useQuery({
    queryKey: ["site_images", type],
    queryFn: async () => {
      const q = query(collection(db, "images"), where("type", "==", type));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    },
    staleTime: 1000 * 60 * 5, // 5 mins
  });
}
