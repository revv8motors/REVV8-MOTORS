import { useSiteContent } from "@/hooks/useSiteContent";
import { Link } from "react-router-dom";

export function SiteFooter() {
  const { data: footer } = useSiteContent<{ tagline: string; links: { label: string; href: string }[] }>("footer");
  const { data: contact } = useSiteContent<{ email: string; phone: string; address: string; hours: string }>("contact");

  return (
    <footer className="border-t hairline bg-surface mt-32">
      <div className="container py-16 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-2xl tracking-[0.18em] text-metal">REVV8</span>
            <span className="font-display text-xs tracking-[0.4em] text-muted-foreground border-l hairline pl-2">MOTORS</span>
          </div>
          <p className="mt-4 text-muted-foreground max-w-md text-sm leading-relaxed">
            {footer?.tagline ?? "Curated luxury. Uncompromised performance."}
          </p>
        </div>
        <div>
          <h4 className="text-xs font-display tracking-[0.3em] text-muted-foreground mb-4">EXPLORE</h4>
          <ul className="space-y-2 text-sm">
            {(footer?.links ?? []).map(l => (
              <li key={l.href}><Link to={l.href} className="hover:text-foreground transition-colors">{l.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-display tracking-[0.3em] text-muted-foreground mb-4">CONTACT</h4>
          <ul className="space-y-2 text-sm text-white">
            {contact?.email && <li>{contact.email}</li>}
            {contact?.phone && <li>{contact.phone}</li>}
            {contact?.address && <li>{contact.address}</li>}
            {contact?.hours && <li className="text-white pt-1">{contact.hours}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t hairline">
        <div className="container py-6 text-base flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center">
          <span className="text-white">© {new Date().getFullYear()} REVV8 Motors. All rights reserved.</span>
          <span className="text-white/80 font-medium whitespace-nowrap">
            Designed By{" "}
            <a 
              href="https://wa.link/jpp1mq" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#ffd700] font-bold hover:underline underline-offset-4 transition-all"
            >
              NEXA DZINE
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
