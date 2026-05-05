import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { db, auth, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs, getCountFromServer } from "firebase/firestore";
import { Car, CheckCircle2, Inbox, MailWarning, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  const stats = useQuery({
    queryKey: ["admin-stats", user?.uid],
    enabled: !authLoading && isAdmin,
    queryFn: async () => {
      const getStat = async (q: any, label: string) => {
        try {
          return await getCountFromServer(q);
        } catch (e) {
          console.error(`[AdminStats] Error fetching ${label}:`, e);
          throw e;
        }
      };

      try {
        const [carsSnap, pubSnap, featSnap, inqSnap, unreadSnap, recentSnap] = await Promise.all([
          getStat(collection(db, "cars"), "total cars"),
          getStat(query(collection(db, "cars"), where("published", "==", true)), "published cars"),
          getStat(query(collection(db, "cars"), where("featured", "==", true)), "featured cars"),
          getStat(collection(db, "inquiries"), "total inquiries"),
          getStat(query(collection(db, "inquiries"), where("read", "==", false)), "unread inquiries"),
          getDocs(query(collection(db, "inquiries"), orderBy("created_at", "desc"), limit(5))),
        ]);

        return {
          totalCars: carsSnap.data().count ?? 0,
          published: pubSnap.data().count ?? 0,
          featured: featSnap.data().count ?? 0,
          inquiries: inqSnap.data().count ?? 0,
          unread: unreadSnap.data().count ?? 0,
          recent: recentSnap.docs.map(i => ({ id: i.id, ...i.data() } as any)),
        };
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, "dashboard stats");
        return { totalCars: 0, published: 0, featured: 0, inquiries: 0, unread: 0, recent: [] };
      }
    },
  });


  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl">
      <div className="mb-6 sm:mb-8">
        <div className="text-xs font-display tracking-[0.4em] text-muted-foreground mb-2">DASHBOARD</div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Snapshot of your REVV8 Motors platform</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10">
        <Stat label="Total Cars" value={stats.data?.totalCars} icon={Car} />
        <Stat label="Published" value={stats.data?.published} icon={CheckCircle2} />
        <Stat label="Featured" value={stats.data?.featured} icon={Star} />
        <Stat label="Total Inquiries" value={stats.data?.inquiries} icon={Inbox} />
        <Stat
          label="Unread Inquiries"
          value={stats.data?.unread}
          icon={MailWarning}
          accent={(stats.data?.unread ?? 0) > 0}
        />
      </div>

      <div className="luxury-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-base sm:text-lg">Recent inquiries</h2>
          <Link to="/admin/inquiries" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
        </div>
        <div className="divide-y divide-white/5">
          {(stats.data?.recent ?? []).length === 0
            ? <div className="text-sm text-muted-foreground py-6 text-center">No inquiries yet.</div>
            : stats.data?.recent.map((i) => (
              <div key={i.id} className="py-4 flex items-start gap-3 sm:gap-4">
                <div className={`h-2 w-2 mt-2 rounded-full shrink-0 ${i.read ? "bg-muted" : "bg-metal"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:gap-3">
                    <div className="font-medium truncate">
                      {i.name} · <span className="text-muted-foreground font-normal break-all">{i.email}</span>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap mt-1 sm:mt-0">
                      {new Date(i.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 line-clamp-2 break-words">{i.message}</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | undefined;
  icon: any;
  accent?: boolean;
}) {
  return (
    <div className={cn("luxury-card p-4 sm:p-6", accent && "border-destructive/40")}>
      <div className="flex justify-between items-start gap-2">
        <div className="text-[10px] sm:text-xs tracking-widest text-muted-foreground">{label.toUpperCase()}</div>
        <Icon className={cn("h-4 w-4 shrink-0", accent ? "text-destructive" : "text-muted-foreground")} />
      </div>
      <div
        className={cn(
          "font-display font-black text-2xl sm:text-3xl mt-3",
          accent ? "text-destructive" : "text-metal"
        )}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}
