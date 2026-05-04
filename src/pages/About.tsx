import { useEffect } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Award, Globe, ShieldCheck, Sparkles } from "lucide-react";
// import showroomImg from "@/assets/about-showroom.jpg";
// import craftsmanshipImg from "@/assets/about-craftsmanship.jpg";
const showroomImg = "https://images.unsplash.com/photo-1562426509-5044a121aa49?auto=format&fit=crop&q=80&w=1200";
const craftsmanshipImg = "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&q=80&w=1200";

export default function About() {
  useEffect(() => { document.title = "About — REVV8 Motors"; }, []);
  const { data: about } = useSiteContent<{ title: string; body: string; stats: { label: string; value: string }[] }>("about");

  const values = [
    { icon: ShieldCheck, title: "Provenance", text: "Every vehicle is fully inspected and history-verified." },
    { icon: Sparkles, title: "Curation", text: "Hand-picked machines with character and pedigree." },
    { icon: Award, title: "Service", text: "White-glove delivery and concierge support, worldwide." },
    { icon: Globe, title: "Network", text: "A global rolodex of collectors, brokers and dealers." },
  ];

  return (
    <div className="pb-24">
      {/* HERO */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={showroomImg} alt="REVV8 Motors showroom" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/40" />
        </div>
        <div className="container relative z-10 pb-20 pt-40">
          <div className="max-w-3xl">
            <div className="text-xs font-display tracking-[0.4em] text-muted-foreground mb-4">ABOUT REVV8</div>
            <h1 className="font-display font-black text-5xl md:text-7xl text-metal mb-6 leading-[0.95]">
              {about?.title ?? "Built for enthusiasts"}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">{about?.body}</p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 border-y hairline bg-surface/40">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(about?.stats ?? []).map(s => (
              <div key={s.label} className="luxury-card p-8 text-center">
                <div className="font-display font-black text-4xl md:text-5xl text-metal">{s.value}</div>
                <div className="text-xs tracking-widest text-muted-foreground mt-2 uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CRAFTSMANSHIP */}
      <section className="py-24">
        <div className="container grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[5/4] overflow-hidden rounded-lg luxury-card p-0">
            <img
              src={craftsmanshipImg}
              alt="Detailing a luxury car"
              loading="lazy"
              width={1280}
              height={1024}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="text-xs font-display tracking-[0.4em] text-muted-foreground mb-3">THE CRAFT</div>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-metal mb-6">Obsessive attention to detail</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Every car that enters our showroom is meticulously inspected, detailed and documented.
              We don't just sell cars — we curate experiences for those who refuse to compromise.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              From the first conversation to handover and beyond, our team is committed to delivering
              the kind of service that turns first-time buyers into lifelong clients.
            </p>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-20 bg-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-40" />
        <div className="container relative">
          <div className="text-center mb-14">
            <div className="text-xs font-display tracking-[0.4em] text-muted-foreground mb-3">OUR VALUES</div>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-metal">What we stand for</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(v => (
              <div key={v.title} className="luxury-card p-8 hover:border-white/20 transition-colors">
                <v.icon className="h-8 w-8 text-metal mb-5" />
                <h3 className="font-display font-bold text-lg mb-2">{v.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
