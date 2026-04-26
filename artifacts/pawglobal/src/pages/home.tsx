import { PageTransition } from "@/components/PageTransition";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useAdminData } from "@/contexts/AdminDataContext";
import { ProductCard } from "@/components/ProductCard";
import { Heart, ArrowRight, ShieldCheck, Globe, AlertTriangle, Truck, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Home() {
  const { dogs, cats, euthanasiaListings } = useAdminData();
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const featuredPets = [...dogs.slice(0, 3), ...cats.slice(0, 1)];
  const urgentCount = euthanasiaListings.filter(l => l.status === "at-risk").length;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim().toUpperCase();
    if (q) navigate(`/track/${q}`);
  }

  return (
    <PageTransition>
      <SEOHead
        title="Find Pets — International Pet Store"
        description="Browse dogs, cats, and pet supplies from breeders and rescue centres worldwide. Safe international shipping. GBP pricing."
        keywords="buy dog online, buy cat online, pet shop UK, international pet store, pedigree dogs for sale, pet supplies worldwide"
      />
      {/* Hero Section */}
      <section className="relative bg-muted/30 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10 dark:opacity-5"></div>
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                Global Pet Sanctuary · Shipping Worldwide
              </span>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground leading-tight mb-6">
                Find your new <span className="text-primary">best friend.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                EuthList's pet store — connecting loving homes with dogs, cats and premium supplies from shelters and breeders worldwide.
                Adopt a rescue or bring home a champion breed, delivered anywhere on the planet.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="h-12 px-8 text-base">
                  <Link href="/shop/dogs">Find a Dog</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base bg-background/50 backdrop-blur-sm">
                  <Link href="/shop/cats">Find a Cat</Link>
                </Button>
              </div>

              {urgentCount > 0 && (
                <Link href="/">
                  <div className="mt-6 inline-flex items-center gap-3 bg-red-600/90 backdrop-blur-sm text-white px-5 py-3 rounded-2xl hover:bg-red-700 transition-colors group cursor-pointer">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 shrink-0">
                      <AlertTriangle className="w-4 h-4 animate-pulse" />
                    </span>
                    <div>
                      <p className="font-bold text-sm leading-tight">
                        {urgentCount} pet{urgentCount !== 1 ? "s" : ""} on the Urgent Rescue List
                      </p>
                      <p className="text-xs text-red-100 leading-tight">Scheduled for euthanasia — every day counts</p>
                    </div>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform shrink-0" />
                  </div>
                </Link>
              )}
              {urgentCount === 0 && (
                <Link href="/">
                  <div className="mt-6 inline-flex items-center gap-3 bg-background/60 backdrop-blur-sm border border-border text-foreground px-5 py-3 rounded-2xl hover:bg-background/80 transition-colors group cursor-pointer">
                    <Heart className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-sm font-medium">View Urgent Rescue List</p>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform shrink-0 text-muted-foreground" />
                  </div>
                </Link>
              )}

              {/* Search bar */}
              <form onSubmit={handleSearch} className="mt-8 flex items-center gap-2 w-full max-w-md bg-background/80 backdrop-blur-sm border border-border rounded-2xl px-4 py-2 shadow-sm">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value.toUpperCase())}
                  placeholder="Search by order ID or pet ID..."
                  className="flex-1 bg-transparent text-sm font-mono tracking-wide text-foreground placeholder:text-muted-foreground placeholder:font-sans placeholder:tracking-normal focus:outline-none"
                  maxLength={20}
                />
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="text-xs font-semibold text-primary hover:text-primary/80 disabled:text-muted-foreground transition-colors px-1 py-0.5 shrink-0"
                >
                  Track →
                </button>
              </form>
              <p className="mt-2 text-xs text-muted-foreground/70">
                Enter an order number <span className="font-mono">PGXYZ123</span> or a rescue pet ID <span className="font-mono">ID272757</span>
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-muted/20">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-serif font-bold mb-2">Ethical Sourcing</h3>
              <p className="text-muted-foreground">Partnered with trusted breeders and rescue shelters across the globe.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-muted/20">
              <div className="bg-secondary/10 p-4 rounded-full mb-4">
                <ShieldCheck className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-serif font-bold mb-2">Health Guaranteed</h3>
              <p className="text-muted-foreground">All pets are vet-checked, vaccinated, and travel-ready with certificates.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-muted/20">
              <div className="bg-accent/10 p-4 rounded-full mb-4">
                <Globe className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-serif font-bold mb-2">Global Shipping</h3>
              <p className="text-muted-foreground">Safe, comfortable international pet transport to your doorstep.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Pets */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Featured Friends</h2>
              <p className="text-muted-foreground">Looking for their forever homes right now.</p>
            </div>
            <Button asChild variant="ghost" className="hidden md:flex gap-2">
              <Link href="/shop/dogs">View all <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredPets.map((pet, index) => (
              <ProductCard key={pet.id} product={pet} index={index} />
            ))}
          </div>

          <Button asChild variant="outline" className="w-full mt-8 md:hidden">
            <Link href="/shop/dogs">View all pets</Link>
          </Button>
        </div>
      </section>

      {/* Donation Highlight */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Heart className="w-12 h-12 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">Support Animal Shelters Worldwide</h2>
            <p className="text-lg md:text-xl opacity-90 mb-10 leading-relaxed">
              We partner with rescue centres across every continent to provide food,
              medical care, and safe shelter for stray animals. Your donation makes a direct global impact.
            </p>
            <Button asChild size="lg" variant="secondary" className="h-14 px-8 text-lg font-bold text-primary">
              <Link href="/donate">Make a Donation</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Supplies Highlight */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1">
              <img
                src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1000&q=80"
                alt="Pet supplies"
                className="rounded-2xl shadow-xl"
              />
            </div>
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent font-medium text-sm">
                <Truck className="w-4 h-4" />
                <span>Fast International Delivery</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold">Premium supplies for your premium friend.</h2>
              <p className="text-lg text-muted-foreground">
                From organic grain-free food to orthopedic beds and interactive toys, we stock only the highest quality products for your pets.
              </p>
              <ul className="space-y-3 pb-4">
                {["Top-tier nutritional food", "Durable, safe toys", "Comfortable housing and bedding", "Health and grooming essentials"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">✓</div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/shop/supplies">Shop Supplies</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
