import { Link, NavLink as RRNavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { to: "/", label: "Home" },
    { to: "/cars", label: "Inventory" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];


  return (
    <header className={cn(
      "fixed top-0 inset-x-0 z-50 transition-all duration-500",
      scrolled ? "bg-background/80 backdrop-blur-xl border-b hairline" : "bg-transparent"
    )}>
      <div className="container flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-display font-black text-xl md:text-2xl tracking-[0.18em] text-metal">
            REVV8
          </span>
          <span className="font-display text-[10px] md:text-xs tracking-[0.4em] text-muted-foreground border-l hairline pl-2">
            MOTORS
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {links.map(l => (
            <RRNavLink key={l.to} to={l.to} end={l.to === "/"}
              className={({ isActive }) => cn(
                "text-sm font-medium tracking-wide transition-colors hover:text-foreground",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
              {l.label}
            </RRNavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>Admin</Button>
          )}
          <Button variant="luxury" size="sm" onClick={() => navigate("/cars")}>
            Browse Cars
          </Button>
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t hairline bg-background/95 backdrop-blur-xl animate-fade-in">
          <div className="container py-4 flex flex-col gap-1">
            {links.map(l => (
              <RRNavLink key={l.to} to={l.to} end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) => cn(
                  "py-3 px-2 text-sm font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                {l.label}
              </RRNavLink>
            ))}
            {isAdmin && <RRNavLink to="/admin" onClick={() => setOpen(false)} className="py-3 px-2 text-sm">Admin</RRNavLink>}
          </div>
        </div>
      )}
    </header>
  );
}
