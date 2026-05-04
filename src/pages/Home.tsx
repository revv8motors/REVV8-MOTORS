import { Link } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useCars } from "@/hooks/useCars";
import { Button } from "@/components/ui/button";
import { CarCard } from "@/components/site/CarCard";
import { CarCardSkeleton } from "@/components/site/CarCardSkeleton";
import { ArrowRight, Award, Car as CarIcon, Shield, Sparkles, Zap } from "lucide-react";
// import heroImage from "@/assets/hero-car.jpg";
const heroImage = "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=1920";

const CATEGORIES = [
  { name: "Sports", icon: Zap },
  { name: "SUV", icon: CarIcon },
  { name: "Sedan", icon: Award },
  { name: "Electric", icon: Sparkles },
];

export default function Home() {
  const { data: hero } = useSiteContent<{ title: string; subtitle: string; cta: string }>("hero");
  const { data: about } = useSiteContent<{ title: string; body: string; stats: { label: string; value: string }[] }>("about");
  const { data: testimonials } = useSiteContent<{ name: string; text: string; role: string }[]>("testimonials");
  const { data: featured, isLoading } = useCars({ featured: true, published: true, limit: 6 });

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Luxury car" className="w-full h-full object-cover animate-slow-zoom" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
        </div>
        <div className="container relative z-10 pt-32 pb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
              <Sparkles className="h-3.5 w-3.5 text-metal" />
              <span className="text-xs tracking-[0.3em] font-display text-muted-foreground">PREMIUM AUTOMOTIVE</span>
            </div>
            <h1 className="font-display font-black text-5xl md:text-7xl lg:text-8xl leading-[0.95] mb-6 animate-fade-up">
              <span className="block text-foreground">{hero?.title?.split(".")[0] ?? "Drive Power"}.</span>
              <span className="block text-metal">{(hero?.title?.split(".")[1] ?? " Own Prestige").trim()}.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 animate-fade-up delay-100">
              {hero?.subtitle ?? "Curated collection of the world's finest performance machines."}
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-up delay-200">
              <Button asChild variant="luxury" size="xl">
                <Link to="/cars">{hero?.cta ?? "Browse Cars"} <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outlineLuxury" size="xl">
                <Link to="/about">Our Story</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
      </section>

      {/* CATEGORIES */}
      <section className="py-20 border-y hairline">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map(c => (
              <Link key={c.name} to={`/cars?category=${c.name}`}
                className="group flex flex-col items-center justify-center gap-3 py-8 rounded-xl border hairline hover:border-white/20 hover:bg-surface transition-all">
                <c.icon className="h-7 w-7 text-muted-foreground group-hover:text-metal transition-colors" />
                <span className="font-display tracking-[0.3em] text-sm">{c.name.toUpperCase()}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="py-24">
        <div className="container">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <div className="text-xs font-display tracking-[0.4em] text-muted-foreground mb-3">FEATURED COLLECTION</div>
              <h2 className="font-display font-bold text-4xl md:text-5xl text-metal">Hand-picked machines</h2>
            </div>
            <Button asChild variant="outlineLuxury">
              <Link to="/cars">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? Array.from({ length: 6 }).map((_, i) => <CarCardSkeleton key={i} />)
              : featured?.length === 0
                ? <div className="col-span-full text-center text-muted-foreground py-20">No featured cars yet.</div>
                : featured?.map(c => <CarCard key={c.id} car={c} />)
            }
          </div>
        </div>
      </section>

      {/* ABOUT PREVIEW */}
      <section className="py-24 bg-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-50" />
        <div className="container relative grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs font-display tracking-[0.4em] text-muted-foreground mb-3">THE REVV8 EXPERIENCE</div>
            <h2 className="font-display font-bold text-4xl md:text-5xl mb-6 text-metal">{about?.title ?? "About REVV8"}</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">{about?.body}</p>
            <Button asChild variant="luxury"><Link to="/about">Learn more</Link></Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {(about?.stats ?? []).map(s => (
              <div key={s.label} className="luxury-card p-6 text-center">
                <div className="font-display font-black text-3xl text-metal">{s.value}</div>
                <div className="text-xs tracking-widest text-muted-foreground mt-2 uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <div className="text-xs font-display tracking-[0.4em] text-muted-foreground mb-3">CLIENT VOICES</div>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-metal">Trusted by enthusiasts</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {(testimonials ?? []).map(t => (
              <div key={t.name} className="luxury-card p-8">
                <p className="text-foreground/90 leading-relaxed mb-6">"{t.text}"</p>
                <div className="border-t hairline pt-4">
                  <div className="font-display font-bold">{t.name}</div>
                  <div className="text-xs text-muted-foreground tracking-wider mt-1">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
