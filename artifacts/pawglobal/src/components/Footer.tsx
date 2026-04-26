import { Link } from "wouter";
import { PawPrint, Instagram, Twitter, Facebook, Mail, MapPin } from "lucide-react";
import { useStoreSettings } from "@/hooks/use-store-settings";

export function Footer() {
  const { settings } = useStoreSettings();
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 inline-flex">
              <div className="bg-primary/10 p-2 rounded-xl">
                <PawPrint className="h-6 w-6 text-primary" />
              </div>
              <span className="font-serif font-bold text-2xl tracking-tight">EuthList</span>
            </Link>
            <p className="text-muted-foreground leading-relaxed max-w-sm">
              euthlist.com — the world's urgent pet rescue directory. We work with shelters and rescue centres
              across every continent to save pets from euthanasia and connect them with loving homes.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-social-instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-social-twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-social-facebook">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg font-serif">Quick Links</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/" className="text-red-500 hover:text-red-600 transition-colors font-medium">🚨 Urgent Rescue List</Link>
              </li>
              <li>
                <Link href="/findpets" className="text-muted-foreground hover:text-primary transition-colors">Pet Store</Link>
              </li>
              <li>
                <Link href="/shop/dogs" className="text-muted-foreground hover:text-primary transition-colors">Find a Dog</Link>
              </li>
              <li>
                <Link href="/shop/cats" className="text-muted-foreground hover:text-primary transition-colors">Find a Cat</Link>
              </li>
              <li>
                <Link href="/shop/supplies" className="text-muted-foreground hover:text-primary transition-colors">Pet Supplies</Link>
              </li>
              <li>
                <Link href="/donate" className="text-muted-foreground hover:text-primary transition-colors">Support Our Shelters</Link>
              </li>
              <li>
                <Link href="/track" className="text-muted-foreground hover:text-primary transition-colors">Track My Order</Link>
              </li>
              <li>
                <Link href="/my-orders" className="text-muted-foreground hover:text-primary transition-colors">My Orders</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg font-serif">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>{settings.address || "London, United Kingdom"}</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>{settings.contactEmail || "hello@euthlist.com"}</span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-sm text-primary font-medium flex items-center justify-center gap-2">
                <GlobeIcon className="h-4 w-4" />
                Global delivery · Ships worldwide
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center md:flex md:justify-between md:items-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} EuthList · euthlist.com · All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4 md:mt-0">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/shipping-info" className="hover:text-primary transition-colors">Shipping Info</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function GlobeIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  );
}
