import { Link, useLocation } from "wouter";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Dog, Cat, ShoppingBag, LogOut, ArrowLeft, Settings, Users, Receipt, FileEdit, AlertTriangle, Menu, X } from "lucide-react";
import { ReactNode, useState, useEffect } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  { href: "/admin/dogs", label: "Dogs", icon: Dog },
  { href: "/admin/cats", label: "Cats", icon: Cat },
  { href: "/admin/supplies", label: "Supplies", icon: ShoppingBag },
  { href: "/admin/euthanasia", label: "Euthanasia List", icon: AlertTriangle },
  { href: "/admin/pages", label: "Pages", icon: FileEdit },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function SidebarContent({ onNav, currentAdmin, logout, isActive }: {
  onNav?: () => void;
  currentAdmin: { email: string; role: string } | null;
  logout: () => void;
  isActive: (href: string, exact?: boolean) => boolean;
}) {
  return (
    <>
      <div className="p-5 border-b border-border">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">EuthList</p>
        <p className="text-lg font-bold text-foreground">Admin Panel</p>
        {currentAdmin && (
          <p className="text-xs text-muted-foreground mt-1 truncate" title={currentAdmin.email}>
            {currentAdmin.email}
          </p>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            onClick={onNav}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(href, exact)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            data-testid={`nav-admin-${label.toLowerCase()}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}

        {currentAdmin?.role === "super" && (
          <Link
            href="/admin/signup"
            onClick={onNav}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/admin/signup")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            data-testid="nav-admin-users"
          >
            <Users className="w-4 h-4 shrink-0" />
            Add Admin
          </Link>
        )}
      </nav>

      <div className="p-3 border-t border-border space-y-1.5">
        <Link
          href="/"
          onClick={onNav}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          Back to Store
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => { onNav?.(); logout(); }}
          data-testid="button-admin-logout"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const { logout, currentAdmin } = useAdminAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location === href;
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-background border-r border-border flex-col">
        <SidebarContent
          currentAdmin={currentAdmin}
          logout={logout}
          isActive={isActive}
        />
      </aside>

      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-background border-r border-border flex flex-col md:hidden transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">EuthList</p>
            <p className="text-base font-bold text-foreground">Admin Panel</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent
          onNav={() => setSidebarOpen(false)}
          currentAdmin={currentAdmin}
          logout={logout}
          isActive={isActive}
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-background border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-muted text-foreground"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-foreground text-sm">
            {navItems.find(n => isActive(n.href, n.exact))?.label ?? "Admin"}
          </span>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
