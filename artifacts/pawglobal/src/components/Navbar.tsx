import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X, PawPrint, Moon, Sun, Globe, Receipt, Heart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [location] = useLocation();
  const { itemCount } = useCart();
  const { currency, setCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Rescue List", urgent: true },
    { href: "/findpets", label: "Store" },
    { href: "/shop/dogs", label: "Dogs" },
    { href: "/shop/cats", label: "Cats" },
    { href: "/shop/supplies", label: "Supplies" },
    { href: "/donate", label: "Donate" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
            <PawPrint className="h-6 w-6 text-primary" />
          </div>
          <span className="font-serif font-bold text-xl tracking-tight text-foreground">
            EuthList
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            if (link.label === "Donate") return null; // We use the button instead
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  link.urgent
                    ? location === link.href
                      ? "text-red-600 dark:text-red-400"
                      : "text-red-500 dark:text-red-400 hover:text-red-600"
                    : location === link.href
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Redeem Pledge Button */}
          <Link href="/redeem-pledge" className="hidden lg:block">
            <Button size="sm" variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold shadow-sm">
              Redeem Pledge
            </Button>
          </Link>

          {/* Donate Button */}
          <Link href="/donate" className="hidden sm:block">
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5 shadow-sm">
              <Heart className="w-3.5 h-3.5 fill-white" />
              Donate
            </Button>
          </Link>

          {/* Currency Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden sm:flex" data-testid="button-currency-dropdown">
                <Globe className="h-4 w-4" />
                <span className="sr-only">Currency</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["USD", "EUR", "GBP"] as const).map((c) => (
                <DropdownMenuItem
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={currency === c ? "bg-muted font-bold" : ""}
                  data-testid={`menu-item-currency-${c}`}
                >
                  {c}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hidden sm:flex"
            data-testid="button-theme-toggle"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* My Orders */}
          <Link href="/my-orders">
            <Button variant="ghost" size="icon" className="hidden sm:flex" data-testid="button-my-orders" title="My Orders">
              <Receipt className="h-4 w-4" />
              <span className="sr-only">My Orders</span>
            </Button>
          </Link>

          {/* Cart */}
          <Link href="/cart">
            <Button variant="outline" size="icon" className="relative group hover:border-primary" data-testid="button-cart">
              <ShoppingCart className="h-4 w-4 group-hover:text-primary transition-colors" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
          {[...navLinks, { href: "/my-orders", label: "My Orders" }].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-sm font-medium p-2 rounded-md transition-colors hover:bg-muted ${
                location === link.href ? "bg-muted text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-4 pt-4 border-t">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Currency</span>
              <div className="flex gap-2">
                {(["USD", "EUR", "GBP"] as const).map((c) => (
                  <Button
                    key={c}
                    variant={currency === c ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setCurrency(c); setIsMobileMenuOpen(false); }}
                    className="text-xs"
                    data-testid={`button-mobile-currency-${c}`}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm font-medium">Theme</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
