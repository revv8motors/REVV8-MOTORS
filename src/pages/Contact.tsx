import { useEffect } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { ContactDealerForm } from "@/components/site/ContactDealerForm";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
// import contactImg from "@/assets/contact-showroom.jpg";
const contactImg = "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1920";

export default function Contact() {
  useEffect(() => { document.title = "Contact — REVV8 Motors"; }, []);
  const { data: contact } = useSiteContent<{ email: string; phone: string; address: string; whatsapp: string; hours: string }>("contact");

  return (
    <div className="pb-24">
      {/* HERO */}
      <section className="relative min-h-[55vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={contactImg} alt="REVV8 Motors dealership" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/40" />
        </div>
        <div className="container relative z-10 pb-16 pt-40">
          <div className="max-w-3xl">
            <div className="text-xs font-display tracking-[0.4em] text-muted-foreground mb-4">GET IN TOUCH</div>
            <h1 className="font-display font-black text-5xl md:text-7xl text-metal mb-5 leading-[0.95]">Let's talk</h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Looking for something specific? Our team is ready to help you find your next car.
            </p>
          </div>
        </div>
      </section>

      {/* CONTACT GRID */}
      <section className="py-20">
        <div className="container grid lg:grid-cols-5 gap-10">
          {/* Info side */}
          <div className="lg:col-span-2 space-y-4">
            <div className="text-xs font-display tracking-[0.4em] text-muted-foreground mb-2">REACH US</div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-metal mb-6">Visit, call or write</h2>

            {contact?.email && <Row icon={Mail} label="Email" value={contact.email} href={`mailto:${contact.email}`} />}
            {contact?.phone && <Row icon={Phone} label="Phone" value={contact.phone} href={`tel:${contact.phone}`} />}
            {contact?.address && <Row icon={MapPin} label="Showroom" value={contact.address} />}
            <Row icon={Clock} label="Hours" value={contact?.hours ?? "Mon – Sat · 10:00 — 19:00"} />
          </div>

          {/* Form side */}
          <div className="lg:col-span-3">
            <div className="luxury-card p-8 md:p-10">
              <h2 className="font-display font-bold text-2xl md:text-3xl mb-2">Send a message</h2>
              <p className="text-sm text-muted-foreground mb-8">We typically respond within a few hours.</p>
              <ContactDealerForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ icon: Icon, label, value, href }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; href?: string }) {
  const Wrap: React.ElementType = href ? "a" : "div";
  return (
    <Wrap href={href} className="flex items-start gap-4 luxury-card p-5 hover:border-white/20 transition-colors">
      <div className="h-11 w-11 shrink-0 rounded-md bg-surface-2 flex items-center justify-center">
        <Icon className="h-5 w-5 text-metal" />
      </div>
      <div className="min-w-0">
        <div className="text-xs tracking-[0.2em] text-muted-foreground">{label.toUpperCase()}</div>
        <div className="font-display mt-0.5 break-words">{value}</div>
      </div>
    </Wrap>
  );
}
