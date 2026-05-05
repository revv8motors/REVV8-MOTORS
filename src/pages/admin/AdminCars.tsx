import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCars } from "@/hooks/useCars";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, collection, addDoc } from "firebase/firestore";
import { Car } from "@/types/car";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Edit, Plus, Trash2, Search, FilterX } from "lucide-react";
import { CarFormDialog } from "@/components/admin/CarFormDialog";
import { bulkActionCars } from "@/services/backendService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function AdminCars() {
  const { data: cars, isLoading } = useCars({});
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Car | null>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  
  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [publishedFilter, setPublishedFilter] = useState("ALL");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["cars"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const toggle = async (car: Car, field: "featured" | "published", value: boolean) => {
    const update = field === "featured" ? { featured: value } : { published: value };
    try {
      await updateDoc(doc(db, "cars", car.id), update);
      toast.success(`${field} updated`);
      refresh();
    } catch (error: unknown) {
      handleFirestoreError(error, OperationType.UPDATE, `cars/${car.id}`);
      toast.error(error instanceof Error ? error.message : "Error");
    }
  };

  const remove = async (car: Car) => {
    try {
      // Soft delete using bulk logic or just delete. We will archive so we test bulk logic actually!
      await bulkActionCars([car.id], "ARCHIVE");
      toast.success("Car archived");
      refresh();
    } catch (error: unknown) {
      handleFirestoreError(error, OperationType.DELETE, `cars/${car.id}`);
      toast.error(error instanceof Error ? error.message : "Error");
    }
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selected.length === 0) return;
    setIsBulkLoading(true);
    let data;
    if (bulkAction === "TOGGLE_FEATURED") data = { value: true };
    else if (bulkAction === "UPDATE_STATUS") data = { status: "SOLD" }; // simple example

    try {
      const res = await bulkActionCars(selected, bulkAction, data);
      toast.success(`Action applied to ${res.successIds.length} cars.`);
      if (res.failedIds.length > 0) toast.error(`Failed for ${res.failedIds.length} cars`);
      setSelected([]);
      setBulkAction("");
      refresh();
    } catch(e: any) {
      toast.error("Bulk action failed: " + e.message);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const filteredCars = (cars || []).filter(c => {
    if (c.archived) return false;
    
    // Search filter
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const match = 
        c.brand.toLowerCase().includes(s) || 
        c.model.toLowerCase().includes(s) || 
        (c.title || "").toLowerCase().includes(s);
      if (!match) return false;
    }

    // Status filter
    if (statusFilter !== "ALL") {
      if (c.status !== statusFilter) return false;
    }

    // Category filter
    if (categoryFilter !== "ALL") {
      if (c.category !== categoryFilter) return false;
    }

    // Published filter
    if (publishedFilter !== "ALL") {
      const isPublished = publishedFilter === "PUBLISHED";
      if (c.published !== isPublished) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredCars.length / pageSize);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedCars = filteredCars.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelectAll = () => {
    const allOnPageSelected = paginatedCars.length > 0 && paginatedCars.every(c => selected.includes(c.id));
    if (allOnPageSelected) {
      const pageIds = paginatedCars.map(c => c.id);
      setSelected(selected.filter(id => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedCars.map(c => c.id);
      const uniqueNewIds = pageIds.filter(id => !selected.includes(id));
      setSelected([...selected, ...uniqueNewIds]);
    }
  };

  const seedDummyData = async () => {
    const dummyCars = [
      { brand: "Toyota", model: "Camry SE", year: 2023, price: 28500, fuel: "Petrol", transmission: "Automatic", category: "Sedan", published: true, featured: true, images: ["https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=1200"], description: "Almost new Toyota Camry SE. Excellent condition with full service history. Features include leather seats, sunroof, and advanced safety features.", mileage: 15000, is_certified: true, is_premium: false, warranty_available: true, inspection_passed: true, status: "AVAILABLE", archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { brand: "BMW", model: "X5 xDrive40i", year: 2022, price: 65000, fuel: "Petrol", transmission: "Automatic", category: "SUV", published: true, featured: true, images: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1200"], description: "Luxurious BMW X5 with premium package. Features panoramic roof, harman/kardon audio, and heads-up display.", mileage: 22000, is_certified: true, is_premium: true, warranty_available: true, inspection_passed: true, status: "AVAILABLE", archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];
    try {
      for (const car of dummyCars) {
        await addDoc(collection(db, "cars"), car);
      }
      toast.success("Dummy cars loaded!");
      refresh();
    } catch (e: unknown) {
      toast.error("Error generating dummy cars");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-xs font-display tracking-[0.4em] text-muted-foreground mb-1">INVENTORY</div>
          <h1 className="font-display font-bold text-3xl">Manage Cars</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {selected.length > 0 && (
            <div className="flex items-center gap-2 bg-surface-2 p-1 rounded-md border hairline w-full sm:w-auto">
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-full sm:w-[160px] bg-transparent border-none h-8 text-xs text-left">
                  <SelectValue placeholder="Bulk Action..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MARK_SOLD">Mark as Sold</SelectItem>
                  <SelectItem value="ARCHIVE">Archive</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="TOGGLE_FEATURED">Set Featured</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="luxury" disabled={!bulkAction || isBulkLoading} onClick={executeBulkAction} className="h-8 text-xs shrink-0">Apply</Button>
            </div>
          )}
          <Button variant="outlineLuxury" size="sm" onClick={seedDummyData} className="text-xs shrink-0">
            Dummy Data
          </Button>
          <Button variant="luxury" size="sm" onClick={() => { setEditing(null); setOpen(true); }} className="text-xs">
            <Plus className="h-4 w-4 mr-1" /> Add Car
          </Button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="flex flex-col md:flex-row gap-3 bg-surface-2 p-4 rounded-xl border hairline">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by brand, model or title..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-10 bg-surface border-white/10 h-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[calc(50%-4px)] sm:w-[130px] bg-surface border-white/10 h-10 text-xs text-left">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="SOLD">Sold</SelectItem>
              <SelectItem value="RESERVED">Reserved</SelectItem>
              <SelectItem value="COMING_SOON">Coming Soon</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[calc(50%-4px)] sm:w-[130px] bg-surface border-white/10 h-10 text-xs text-left">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Category</SelectItem>
              <SelectItem value="SUV">SUV</SelectItem>
              <SelectItem value="Sedan">Sedan</SelectItem>
              <SelectItem value="Hatchback">Hatchback</SelectItem>
              <SelectItem value="Coupe">Coupe</SelectItem>
              <SelectItem value="Luxury">Luxury</SelectItem>
              <SelectItem value="Sports">Sports</SelectItem>
            </SelectContent>
          </Select>

          <Select value={publishedFilter} onValueChange={(v) => { setPublishedFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[calc(50%-4px)] sm:w-[130px] bg-surface border-white/10 h-10 text-xs text-left">
              <SelectValue placeholder="Publication" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Visible</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
            </SelectContent>
          </Select>

          {(searchTerm || statusFilter !== "ALL" || categoryFilter !== "ALL" || publishedFilter !== "ALL") && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setCategoryFilter("ALL");
                setPublishedFilter("ALL");
                setCurrentPage(1);
              }}
              className="h-10 w-10 text-muted-foreground hover:text-foreground"
              title="Clear Filters"
            >
              <FilterX className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block luxury-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left p-4 w-12">
                <input 
                  type="checkbox" 
                  checked={paginatedCars.length > 0 && paginatedCars.every(c => selected.includes(c.id))} 
                  onChange={toggleSelectAll} 
                  className="rounded bg-surface-2 border-white/20"
                />
              </th>
              <th className="text-left p-4">CAR</th>
              <th className="text-left p-4">PRICE</th>
              <th className="text-center p-4">STATUS</th>
              <th className="text-center p-4">PUBLISHED</th>
              <th className="text-right p-4">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">Loading…</td></tr>
              : paginatedCars.length === 0
                ? <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">No cars yet. Add your first.</td></tr>
                : paginatedCars.map((c) => (
                  <tr key={c.id} className="border-t hairline hover:bg-white/[0.02]">
                    <td className="p-4"><input type="checkbox" checked={selected.includes(c.id)} onChange={(e) => e.target.checked ? setSelected([...selected, c.id]) : setSelected(selected.filter(id => id !== c.id))} className="rounded bg-surface-2 border-white/20"/></td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={c.images?.[0] || "/placeholder.svg"} alt="" className="h-12 w-16 object-cover rounded-md bg-surface-2" />
                        <div>
                          <div className="font-medium">{c.brand} {c.model}</div>
                          {c.title && <div className="text-[10px] text-muted-foreground italic mb-0.5">{c.title}</div>}
                          <div className="text-xs text-muted-foreground">{c.category} · {c.year}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-display">
                      {isNaN(Number(c.price)) ? c.price : `₹${Number(c.price).toLocaleString("en-IN")}`}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-full ${c.status === 'SOLD' ? 'bg-red-500/20 text-red-500' : c.status === 'RESERVED' ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-500'}`}>{c.status ? c.status.replace('_', ' ') : "AVAILABLE"}</span>
                    </td>
                    <td className="p-4 text-center">
                      <Switch checked={c.published} onCheckedChange={(v) => toggle(c, "published", v)} />
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-surface border-white/10">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Archive this car?</AlertDialogTitle>
                              <AlertDialogDescription>This will move the car out of public view but keep its data intact.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove(c)} className="bg-destructive">Archive</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* Mobile Vertical List View */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading…</div>
        ) : paginatedCars.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No cars yet. Add your first.</div>
        ) : (
          paginatedCars.map((c) => (
            <div key={c.id} className="relative bg-surface rounded-xl border hairline overflow-hidden shadow-sm">
              <div className="p-4 flex flex-col gap-4">
                {/* Top Section */}
                <div className="flex items-start gap-4">
                  <div className="pt-1">
                    <input 
                      type="checkbox" 
                      checked={selected.includes(c.id)} 
                      onChange={(e) => e.target.checked ? setSelected([...selected, c.id]) : setSelected(selected.filter(id => id !== c.id))} 
                      className="rounded bg-surface-2 border-white/20 h-5 w-5"
                    />
                  </div>
                  <img src={c.images?.[0] || "/placeholder.svg"} alt="" className="h-20 w-28 object-cover rounded-md bg-surface-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-base truncate">{c.brand} {c.model}</div>
                    {c.title && <div className="text-xs text-muted-foreground italic mb-1 truncate">{c.title}</div>}
                    <div className="text-xs text-muted-foreground mb-2">{c.category} · {c.year}</div>
                    <div className="text-sm font-display text-luxury">
                      {isNaN(Number(c.price)) ? c.price : `₹${Number(c.price).toLocaleString("en-IN")}`}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t hairline flex items-center justify-between">
                  <span className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-full ${c.status === 'SOLD' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : c.status === 'RESERVED' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                    {c.status ? c.status.replace('_', ' ') : "AVAILABLE"}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-2">
                       <span className="text-[10px] text-muted-foreground uppercase">{c.published ? 'Visible' : 'Hidden'}</span>
                       <Switch checked={c.published} onCheckedChange={(v) => toggle(c, "published", v)} />
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" onClick={() => { setEditing(c); setOpen(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[90vw] bg-surface border-white/10 rounded-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Archive this car?</AlertDialogTitle>
                          <AlertDialogDescription>This will move the car out of public view but keep its data intact.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(c)} className="bg-destructive text-white">Archive</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-4 sm:flex-row items-center justify-between mt-6 px-2">
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * pageSize, filteredCars.length)}</span> of <span className="font-medium text-foreground">{filteredCars.length}</span> results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="h-8 px-3 text-xs"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "luxury" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 p-0 text-xs ${currentPage === page ? "" : "hover:bg-surface-2"}`}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="h-8 px-3 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <CarFormDialog open={open} onOpenChange={setOpen} car={editing} onSaved={refresh} />
    </div>
  );
}
