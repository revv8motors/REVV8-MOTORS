import { useState } from "react";
import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BarChart3, Car, FileText, Inbox, LogOut, Menu, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="font-display text-3xl mb-3">Access Denied</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        Your account does not have admin privileges. Please contact support to be granted admin access.
      </p>
      <div className="flex gap-3">
        <Button variant="outlineLuxury" onClick={() => nav("/")}>Go home</Button>
        <Button variant="luxury" onClick={async () => { await signOut(auth); nav("/auth"); }}>Sign out</Button>
      </div>
    </div>
  );

  const links = [
    { to: "/admin", label: "Dashboard", icon: BarChart3, end: true },
    { to: "/admin/cars", label: "Cars", icon: Car },
    { to: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  ];

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
    return (
    <div className="h-full flex flex-col bg-surface">
      <div className="p-6 border-b hairline">
        <NavLink to="/" className="flex items-center gap-2" onClick={onNavigate}>
          <span className="font-display font-black text-xl tracking-[0.18em] text-metal">REVV8</span>
          <span className="font-display text-[10px] tracking-[0.4em] text-muted-foreground border-l hairline pl-2">ADMIN</span>
        </NavLink>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={onNavigate}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
              isActive ? "bg-white/5 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            <l.icon className="h-4 w-4" />{l.label}
          </NavLink>
        ))}

        <div className="space-y-1">
          <button
            onClick={() => setContentOpen(!contentOpen)}
            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4" />
              Content
            </div>
            <svg
              className={cn("h-4 w-4 transition-transform", contentOpen && "rotate-180")}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {contentOpen && (
            <div className="pl-10 pr-3 py-1 space-y-1">
              <NavLink
                to="/admin/content"
                end
                onClick={onNavigate}
                className={({ isActive }) => cn(
                  "block px-3 py-2 rounded-md text-sm transition-colors",
                  isActive ? "bg-white/5 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                Text Content
              </NavLink>
            </div>
          )}
        </div>

        <NavLink
          to="/admin/settings"
          onClick={onNavigate}
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
            isActive ? "bg-white/5 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          )}
        >
          <Settings className="h-4 w-4" />Settings
        </NavLink>
      </nav>
      <div className="p-3 border-t hairline">
        <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user.email}</div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={async () => { await signOut(auth); nav("/auth"); }}
        >
          <LogOut className="h-4 w-4 mr-2" />Sign out
        </Button>
      </div>
    </div>
  )};


  return (
    <div className="min-h-screen flex bg-background max-w-[100vw] overflow-x-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 border-r hairline flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between gap-3 px-4 h-14 border-b hairline bg-surface sticky top-0 z-30">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-surface border-white/10">
              <SheetHeader className="sr-only">
                <SheetTitle>Admin Navigation</SheetTitle>
              </SheetHeader>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-base tracking-[0.18em] text-metal">REVV8</span>
            <span className="font-display text-[9px] tracking-[0.4em] text-muted-foreground border-l hairline pl-2">ADMIN</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
