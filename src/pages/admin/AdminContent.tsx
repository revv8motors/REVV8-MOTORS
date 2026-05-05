import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const KEYS = ["hero", "about", "contact", "testimonials", "footer"] as const;

export default function AdminContent() {
  const qc = useQueryClient();
  const [active, setActive] = useState<typeof KEYS[number]>("hero");
  const { data, isLoading } = useQuery({
    queryKey: ["site_content_all"],
    queryFn: async () => {
      try {
        const snap = await getDocs(collection(db, "site_content"));
        return snap.docs.map(d => ({ key: d.id, ...d.data() }));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, "site_content");
        return [];
      }
    },
  });

  const save = async (key: string, value: unknown) => {
    try {
      await setDoc(doc(db, "site_content", key), { key, value }, { merge: true });
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["site_content"] });
      qc.invalidateQueries({ queryKey: ["site_content_all"] });
    } catch (error: unknown) {
      handleFirestoreError(error, OperationType.UPDATE, `site_content/${key}`);
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const get = (key: string) => data?.find((d: any) => d.key === key)?.value;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 md:mb-8">
        <div className="text-[10px] md:text-xs font-display tracking-[0.4em] text-muted-foreground mb-1 md:mb-2">CMS</div>
        <h1 className="font-display font-bold text-2xl md:text-3xl">Site Content</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm max-w-full">Edit any text shown across the public website.</p>
      </div>

      {/* Mobile Select Navigation */}
      <div className="md:hidden mb-6 w-full">
        <Select value={active} onValueChange={(v) => setActive(v as typeof KEYS[number])}>
          <SelectTrigger className="w-full bg-surface-2 border-white/10 h-12 text-xs font-display tracking-[0.2em] uppercase">
            <SelectValue placeholder="Select Section" />
          </SelectTrigger>
          <SelectContent>
            {KEYS.map(k => (
              <SelectItem key={k} value={k} className="uppercase tracking-[0.2em] text-xs font-display">
                {k}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Tab Navigation */}
      <div className="hidden md:flex flex-wrap gap-2 mb-6 border-b hairline pb-2 w-full">
        {KEYS.map(k => (
          <button key={k} onClick={() => setActive(k)}
            className={`px-3 py-2 text-xs tracking-[0.3em] font-display uppercase border-b-2 transition-colors ${active === k ? "border-white text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {k}
          </button>
        ))}
      </div>

      {isLoading ? <div className="text-muted-foreground">Loading…</div> : (
        <div className="luxury-card p-6">
          {active === "hero" && <HeroEditor initial={get("hero")} onSave={(v) => save("hero", v)} />}
          {active === "about" && <AboutEditor initial={get("about")} onSave={(v) => save("about", v)} />}
          {active === "contact" && <ContactEditor initial={get("contact")} onSave={(v) => save("contact", v)} />}
          {active === "testimonials" && <TestimonialsEditor initial={(get("testimonials") as any) ?? []} onSave={(v) => save("testimonials", v)} />}
          {active === "footer" && <FooterEditor initial={get("footer")} onSave={(v) => save("footer", v)} />}
        </div>
      )}
    </div>
  );
}

function HeroEditor({ initial, onSave }: { initial: any; onSave: (v: unknown) => void }) {
  const [v, setV] = useState({ title: "", subtitle: "", cta: "" });
  useEffect(() => { 
    if (initial) {
      setV({ title: initial.title ?? "", subtitle: initial.subtitle ?? "", cta: initial.cta ?? "" }); 
    } else {
      setV({
        title: "The Pinnacle of Automotive Engineering.",
        subtitle: "Experience driving perfection. We curate only the most exceptional luxury vehicles for our discerning clientele.",
        cta: "Explore Our Collection"
      });
    }
  }, [initial]);
  return (
    <div className="space-y-4">
      <Field label="Title"><Input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} className="bg-surface-2 border-white/10 w-full" /></Field>
      <Field label="Subtitle"><Textarea value={v.subtitle} onChange={(e) => setV({ ...v, subtitle: e.target.value })} className="bg-surface-2 border-white/10 w-full" /></Field>
      <Field label="CTA Label"><Input value={v.cta} onChange={(e) => setV({ ...v, cta: e.target.value })} className="bg-surface-2 border-white/10 w-full" /></Field>
      <div className="pt-2">
        <Button variant="luxury" onClick={() => onSave(v)} className="w-full sm:w-auto">Save</Button>
      </div>
    </div>
  );
}

function AboutEditor({ initial, onSave }: { initial: any; onSave: (v: unknown) => void }) {
  const [v, setV] = useState({ title: "", body: "", stats: [] as { label: string; value: string }[] });
  useEffect(() => { 
    if (initial) {
      setV({ title: initial.title ?? "", body: initial.body ?? "", stats: initial.stats ?? [] }); 
    } else {
      setV({
        title: "A Legacy of Automotive Excellence",
        body: "For over two decades, REVV8 Motors has been the premier destination for luxury automotive enthusiasts. Our meticulously curated inventory represents the pinnacle of engineering, performance, and design.",
        stats: [
          { label: "Vehicles Sold", value: "2,500+" },
          { label: "Years Experience", value: "20+" },
          { label: "Service Awards", value: "15" },
          { label: "Happy Clients", value: "100%" }
        ]
      });
    }
  }, [initial]);
  return (
    <div className="space-y-4">
      <Field label="Title"><Input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} className="bg-surface-2 border-white/10 w-full" /></Field>
      <Field label="Body"><Textarea rows={5} value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} className="bg-surface-2 border-white/10 w-full" /></Field>
      <div>
        <Label className="text-xs tracking-widest text-muted-foreground">STATS</Label>
        <div className="space-y-3 sm:space-y-2 mt-2">
          {v.stats.map((s, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2">
              <Input placeholder="Value" value={s.value} onChange={(e) => { const c = [...v.stats]; c[i] = { ...c[i], value: e.target.value }; setV({ ...v, stats: c }); }} className="bg-surface-2 border-white/10 w-full" />
              <Input placeholder="Label" value={s.label} onChange={(e) => { const c = [...v.stats]; c[i] = { ...c[i], label: e.target.value }; setV({ ...v, stats: c }); }} className="bg-surface-2 border-white/10 w-full" />
              <Button variant="ghost" size="icon" className="self-end sm:self-auto shrink-0" onClick={() => setV({ ...v, stats: v.stats.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button variant="outlineLuxury" size="sm" onClick={() => setV({ ...v, stats: [...v.stats, { label: "", value: "" }] })} className="w-full sm:w-auto"><Plus className="h-3.5 w-3.5 mr-1" />Add stat</Button>
        </div>
      </div>
      <div className="pt-2">
        <Button variant="luxury" onClick={() => onSave(v)} className="w-full sm:w-auto">Save</Button>
      </div>
    </div>
  );
}

function ContactEditor({ initial, onSave }: { initial: any; onSave: (v: unknown) => void }) {
  const [v, setV] = useState({ email: "", phone: "", whatsapp: "", address: "", hours: "", mapEmbed: "" });
  useEffect(() => { 
    if (initial) {
      setV({ 
        email: initial.email ?? "", 
        phone: initial.phone ?? "", 
        whatsapp: initial.whatsapp ?? "", 
        address: initial.address ?? "", 
        hours: initial.hours ?? "",
        mapEmbed: initial.mapEmbed ?? "" 
      }); 
    } else {
      setV({
        email: "contact@revv8motors.com",
        phone: "+1 (555) 019-8888",
        whatsapp: "15550198888",
        address: "100 Luxury Avenue, Beverly Hills, CA 90210",
        hours: "Mon – Sat · 10:00 — 19:00",
        mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3304.76442654394!2d-118.4064789233674!3d34.0755106731481!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2bc04d3d147ab%3A0x8ac7c460d3d528b1!2sRodeo%20Dr%2C%20Beverly%20Hills%2C%20CA%2090210!5e0!3m2!1sen!2sus!4v1689123456789!5m2!1sen!2sus"
      });
    }
  }, [initial]);
  return (
    <div className="space-y-4">
      <Field label="Email"><Input value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} className="bg-surface-2 border-white/10 w-full" /></Field>
      <Field label="Phone"><Input value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} className="bg-surface-2 border-white/10 w-full" /></Field>
      <Field label="WhatsApp number (digits only, with country code)"><Input value={v.whatsapp} onChange={(e) => setV({ ...v, whatsapp: e.target.value })} className="bg-surface-2 border-white/10 w-full" placeholder="15550108888" /></Field>
      <Field label="Address"><Input value={v.address} onChange={(e) => setV({ ...v, address: e.target.value })} className="bg-surface-2 border-white/10 w-full" /></Field>
      <Field label="Hours"><Input value={v.hours} onChange={(e) => setV({ ...v, hours: e.target.value })} className="bg-surface-2 border-white/10 w-full" placeholder="e.g. Mon - Sat: 9 AM - 6 PM" /></Field>
      <Field label="Google Maps embed URL"><Textarea rows={3} value={v.mapEmbed} onChange={(e) => setV({ ...v, mapEmbed: e.target.value })} className="bg-surface-2 border-white/10 w-full" /></Field>
      <div className="pt-2">
        <Button variant="luxury" onClick={() => onSave(v)} className="w-full sm:w-auto">Save</Button>
      </div>
    </div>
  );
}

function TestimonialsEditor({ initial, onSave }: { initial: any[]; onSave: (v: unknown) => void }) {
  const [list, setList] = useState<{ name: string; role: string; text: string }[]>([]);
  useEffect(() => { setList(initial ?? []); }, [initial]);
  return (
    <div className="space-y-4">
      {list.map((t, i) => (
        <div key={i} className="luxury-card p-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input placeholder="Name" value={t.name} onChange={(e) => { const c = [...list]; c[i] = { ...c[i], name: e.target.value }; setList(c); }} className="bg-surface-2 border-white/10 w-full" />
            <Input placeholder="Role/Car" value={t.role} onChange={(e) => { const c = [...list]; c[i] = { ...c[i], role: e.target.value }; setList(c); }} className="bg-surface-2 border-white/10 w-full" />
          </div>
          <Textarea placeholder="Quote" value={t.text} onChange={(e) => { const c = [...list]; c[i] = { ...c[i], text: e.target.value }; setList(c); }} className="bg-surface-2 border-white/10 w-full" />
          <Button variant="ghost" size="sm" className="text-destructive w-full sm:w-auto" onClick={() => setList(list.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5 mr-1" />Remove</Button>
        </div>
      ))}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button variant="outlineLuxury" onClick={() => setList([...list, { name: "", role: "", text: "" }])} className="w-full sm:w-auto"><Plus className="h-3.5 w-3.5 mr-1" />Add testimonial</Button>
        <Button variant="luxury" onClick={() => onSave(list)} className="w-full sm:w-auto">Save all</Button>
      </div>
    </div>
  );
}

function FooterEditor({ initial, onSave }: { initial: any; onSave: (v: unknown) => void }) {
  const [v, setV] = useState({ tagline: "", links: [] as { label: string; href: string }[] });
  useEffect(() => { 
    if (initial) {
      setV({ tagline: initial.tagline ?? "", links: initial.links ?? [] }); 
    } else {
      setV({
        tagline: "Curated luxury. Uncompromised performance.",
        links: [
          { label: "Home", href: "/" },
          { label: "Inventory", href: "/cars" },
          { label: "About Us", href: "/about" },
          { label: "Contact", href: "/contact" }
        ]
      });
    }
  }, [initial]);
  return (
    <div className="space-y-4">
      <Field label="Tagline"><Input value={v.tagline} onChange={(e) => setV({ ...v, tagline: e.target.value })} className="bg-surface-2 border-white/10 w-full" /></Field>
      <div>
        <Label className="text-xs tracking-widest text-muted-foreground">LINKS</Label>
        <div className="space-y-3 sm:space-y-2 mt-2">
          {v.links.map((l, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2">
              <Input placeholder="Label" value={l.label} onChange={(e) => { const c = [...v.links]; c[i] = { ...c[i], label: e.target.value }; setV({ ...v, links: c }); }} className="bg-surface-2 border-white/10 w-full" />
              <Input placeholder="/path" value={l.href} onChange={(e) => { const c = [...v.links]; c[i] = { ...c[i], href: e.target.value }; setV({ ...v, links: c }); }} className="bg-surface-2 border-white/10 w-full" />
              <Button variant="ghost" size="icon" className="self-end sm:self-auto shrink-0" onClick={() => setV({ ...v, links: v.links.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button variant="outlineLuxury" size="sm" onClick={() => setV({ ...v, links: [...v.links, { label: "", href: "" }] })} className="w-full sm:w-auto"><Plus className="h-3.5 w-3.5 mr-1" />Add link</Button>
        </div>
      </div>
      <div className="pt-2">
        <Button variant="luxury" onClick={() => onSave(v)} className="w-full sm:w-auto">Save</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs tracking-widest text-muted-foreground">{label.toUpperCase()}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
