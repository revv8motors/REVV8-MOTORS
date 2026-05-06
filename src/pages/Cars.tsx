import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCars } from "@/hooks/useCars";
import { CarCard } from "@/components/site/CarCard";
import { CarCardSkeleton } from "@/components/site/CarCardSkeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { parsePriceToNumber } from "@/services/backendService";
import { CATEGORIES, FUEL_TYPES, TRANSMISSIONS } from "@/types/car";

export default function Cars() {
  const [params, setParams] = useSearchParams();
  const { data: cars, isLoading } = useCars({ published: true });

  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");
  const [fuel, setFuel] = useState("all");
  const [transmission, setTransmission] = useState("all");
  const [category, setCategory] = useState(params.get("category") ?? "all");
  const [year, setYear] = useState("all");
  const [sort, setSort] = useState("newest");
  const [price, setPrice] = useState<[number, number]>([0, 1000000]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { document.title = "Inventory — REVV8 Motors"; }, []);

  const brands = useMemo(() => Array.from(new Set((cars ?? []).map(c => c.brand))).sort(), [cars]);
  const years = useMemo(() => Array.from(new Set((cars ?? []).map(c => c.year))).sort((a, b) => b - a), [cars]);
  const maxPrice = useMemo(() => Math.max(100000, ...((cars ?? []).map(c => parsePriceToNumber(c.price)))), [cars]);

  useEffect(() => { setPrice([0, maxPrice]); }, [maxPrice]);

  const filtered = useMemo(() => {
    let list = (cars ?? []).filter(c => {
      if (search && !`${c.brand} ${c.model} ${c.title}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (brand !== "all" && c.brand !== brand) return false;
      if (fuel !== "all" && c.fuel !== fuel) return false;
      if (transmission !== "all" && c.transmission !== transmission) return false;
      if (category !== "all" && c.category !== category) return false;
      if (year !== "all" && String(c.year) !== year) return false;
      const numPrice = parsePriceToNumber(c.price);
      if (numPrice < price[0] || numPrice > price[1]) return false;
      return true;
    });
    if (sort === "price-asc") list = list.sort((a, b) => parsePriceToNumber(a.price) - parsePriceToNumber(b.price));
    else if (sort === "price-desc") list = list.sort((a, b) => parsePriceToNumber(b.price) - parsePriceToNumber(a.price));
    return list;
  }, [cars, search, brand, fuel, transmission, category, year, price, sort]);

  const reset = () => {
    setSearch(""); setBrand("all"); setFuel("all"); setTransmission("all");
    setCategory("all"); setYear("all"); setPrice([0, maxPrice]); setSort("newest");
    setParams({});
  };

  return (
    <div className="pt-32 pb-24">
      <div className="container">
        {/* Header */}
        <div className="mb-10">
          <div className="text-xs font-display tracking-[0.4em] text-muted-foreground mb-3">INVENTORY</div>
          <h1 className="font-display font-bold text-4xl md:text-6xl text-metal">The Collection</h1>
          <p className="text-muted-foreground mt-3">{filtered.length} {filtered.length === 1 ? "vehicle" : "vehicles"} available</p>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search brand, model..."
              className="pl-10 h-12 bg-surface border-white/10" />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full sm:w-[180px] h-12 bg-surface border-white/10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low → High</SelectItem>
              <SelectItem value="price-desc">Price: High → Low</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outlineLuxury" size="lg" onClick={() => setShowFilters(!showFilters)} className="w-full sm:w-auto md:hidden">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Filters */}
          <aside className={`${showFilters ? "block" : "hidden"} lg:block space-y-6 luxury-card p-6 h-fit lg:sticky lg:top-28`}>
            <div className="flex justify-between items-center">
              <h3 className="font-display tracking-[0.2em] text-sm">FILTERS</h3>
              <Button variant="ghost" size="sm" onClick={reset}><X className="h-3 w-3 mr-1" />Reset</Button>
            </div>
            <FilterSelect label="Brand" value={brand} setValue={setBrand} options={brands} />
            <FilterSelect label="Category" value={category} setValue={setCategory} options={[...CATEGORIES]} />
            <FilterSelect label="Fuel" value={fuel} setValue={setFuel} options={[...FUEL_TYPES]} />
            <FilterSelect label="Transmission" value={transmission} setValue={setTransmission} options={[...TRANSMISSIONS]} />
            <FilterSelect label="Year" value={year} setValue={setYear} options={years.map(String)} />
            <div>
              <label className="text-xs font-display tracking-[0.2em] text-muted-foreground block mb-3">PRICE RANGE</label>
              <Slider min={0} max={maxPrice} step={5000} value={price} onValueChange={(v) => setPrice(v as [number, number])} />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>₹{price[0].toLocaleString("en-IN")}</span>
                <span>₹{price[1].toLocaleString("en-IN")}</span>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <CarCardSkeleton key={i} />)
              : filtered.length === 0
                ? <div className="col-span-full text-center py-20 text-muted-foreground">No cars match your filters.</div>
                : filtered.map(c => <CarCard key={c.id} car={c} />)
            }
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, setValue, options }: { label: string; value: string; setValue: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-xs font-display tracking-[0.2em] text-muted-foreground block mb-2">{label.toUpperCase()}</label>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className="bg-surface-2 border-white/10"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
