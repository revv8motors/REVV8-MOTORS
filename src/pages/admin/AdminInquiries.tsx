import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Phone, Trash2, Check, ArrowUpDown } from "lucide-react";

type SortOrder = "newest" | "oldest";

export default function AdminInquiries() {
  const qc = useQueryClient();
  const [sort, setSort] = useState<SortOrder>("newest");

  const { data, isLoading } = useQuery({
    queryKey: ["inquiries", sort],
    queryFn: async () => {
      try {
        const q = query(collection(db, "inquiries"), orderBy("created_at", sort === "oldest" ? "asc" : "desc"));
        const snapshot = await getDocs(q);
        const inquiries = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
        
        // Fetch related cars
        for (const inq of inquiries) {
          if (inq.car_id) {
            try {
              const carRef = doc(db, "cars", inq.car_id);
              const carSnap = await getDoc(carRef);
              if (carSnap.exists()) {
                inq.cars = { brand: carSnap.data().brand, model: carSnap.data().model };
              }
            } catch (e) {
               // ignore missing cars
            }
          }
        }
        return inquiries;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, "inquiries");
        return [];
      }
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["inquiries"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const markRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "inquiries", id), { read: true, read_at: new Date().toISOString() });
      toast.success("Marked as read");
      refresh();
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `inquiries/${id}`);
      toast.error(error.message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this inquiry?")) return;
    try {
      await deleteDoc(doc(db, "inquiries", id));
      toast.success("Deleted");
      refresh();
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, `inquiries/${id}`);
      toast.error(error.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-xs font-display tracking-[0.4em] text-muted-foreground mb-2">CUSTOMER MESSAGES</div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl">Inquiries</h1>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sort} onValueChange={(v) => setSort(v as SortOrder)}>
            <SelectTrigger className="w-[180px] bg-surface border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : data?.length === 0 ? (
          <div className="luxury-card p-12 text-center text-muted-foreground">No inquiries yet.</div>
        ) : (
          data?.map((i: any) => (
            <div key={i.id} className={`luxury-card p-4 sm:p-6 ${!i.read ? "border-white/20" : ""}`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-base break-words">{i.name}</span>
                    {!i.read && <Badge className="bg-metal text-black border-0">NEW</Badge>}
                    {i.cars && (
                      <Badge variant="outline" className="border-white/20 break-all">
                        {i.cars.brand} {i.cars.model}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-y-2 sm:gap-x-6 text-sm sm:text-base text-foreground/90">
                    <a href={`mailto:${i.email}`} className="flex items-center gap-2 hover:text-metal transition-colors break-all">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="break-all">{i.email}</span>
                    </a>
                    {i.phone && (
                      <a href={`tel:${i.phone}`} className="flex items-center gap-2 hover:text-metal transition-colors">
                        <Phone className="h-4 w-4 shrink-0" />
                        {i.phone}
                      </a>
                    )}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground sm:whitespace-nowrap sm:text-right">
                  <div>{new Date(i.created_at).toLocaleString()}</div>
                  {i.read && i.read_at && (
                    <div className="mt-1 flex items-center gap-1 sm:justify-end text-[11px] sm:text-xs">
                      <Check className="h-3 w-3" />
                      Read · {new Date(i.read_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm sm:text-base text-foreground/90 leading-relaxed mb-4 break-words">{i.message}</p>
              <div className="flex flex-wrap gap-2">
                {!i.read && (
                  <Button variant="ghost" size="sm" onClick={() => markRead(i.id)}>
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Mark as read
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(i.id)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
