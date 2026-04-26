import { useState, useMemo } from "react";
import { PageTransition } from "@/components/PageTransition";
import SEOHead from "@/components/SEOHead";
import { useAdminData } from "@/contexts/AdminDataContext";
import { EuthanasiaListing, petDisplayId } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Heart, MapPin, Clock, Search, CheckCircle, User } from "lucide-react";
import { Link } from "wouter";

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function DeadlineBadge({ deadline }: { deadline: string }) {
  const days = daysUntil(deadline);
  if (days <= 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
      <Clock className="w-3 h-3" /> Time up
    </span>
  );
  if (days <= 3) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 animate-pulse">
      <Clock className="w-3 h-3" /> {days} day{days !== 1 ? "s" : ""} left
    </span>
  );
  if (days <= 7) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
      <Clock className="w-3 h-3" /> {days} days left
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400">
      <Clock className="w-3 h-3" /> {days} days left
    </span>
  );
}

function EuthanasiaCard({ listing, searchQuery = "" }: { listing: EuthanasiaListing, searchQuery?: string }) {
  const isRescued = listing.status === "rescued";
  const days = daysUntil(listing.deadline);
  const urgent = !isRescued && days <= 3;
  const displayId = petDisplayId(listing.id);

  const isSearchedById = searchQuery.trim() !== "" && displayId.toLowerCase().includes(searchQuery.trim().toLowerCase());

  return (
    <div className={`bg-background rounded-2xl border overflow-hidden shadow-sm flex flex-col transition-all duration-200 hover:shadow-md ${
      isRescued ? "opacity-70 border-border" : urgent ? "border-red-300 dark:border-red-800 ring-1 ring-red-200 dark:ring-red-900" : "border-border hover:border-primary/30"
    }`}>
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted shrink-0">
        <img
          src={listing.image}
          alt={listing.name}
          className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${isRescued ? "grayscale" : ""}`}
          onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80"; }}
        />
        {isRescued && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="bg-green-500 text-white text-sm font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Rescued
            </span>
          </div>
        )}
        {!isRescued && urgent && (
          <div className="absolute top-3 left-3">
            <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3" /> URGENT
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="bg-background/90 backdrop-blur-sm text-muted-foreground text-xs px-2 py-0.5 rounded-full font-mono">
            {displayId}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-bold text-lg text-foreground leading-tight">{listing.name}</h3>
            <p className="text-sm text-muted-foreground">{listing.breed} · {listing.age} · {listing.gender}</p>
          </div>
          {!isRescued && <DeadlineBadge deadline={listing.deadline} />}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          <MapPin className="w-3 h-3 shrink-0" />
          <span>{listing.shelter}, {listing.location}</span>
        </div>

        {listing.author && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <User className="w-3 h-3 shrink-0" />
            <span>Listed by {listing.author}</span>
          </div>
        )}

        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4 flex-1">
          {listing.description}
        </p>

        {!isRescued ? (
          <div className="flex flex-col gap-2">
            <Link href={`/donate?pet=${encodeURIComponent(listing.name)}&id=${displayId}`}>
              <Button className="w-full h-9 text-sm bg-red-600 hover:bg-red-700 text-white" size="sm">
                <Heart className="w-3.5 h-3.5 mr-1.5 fill-white" /> Donate to Save {listing.name}
              </Button>
            </Link>
            <Link href={`/euthanasia/${listing.id}#adopt`} className="w-full">
              <Button variant="outline" className="w-full h-9 text-sm" size="sm">
                Adopt / Foster
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
              <CheckCircle className="w-4 h-4" />
              This pet found safety
            </div>
            {isSearchedById && (
              <Link href={`/donate?pet=${encodeURIComponent(listing.name)}&id=${displayId}&redeem=true`} className="w-full">
                <Button variant="outline" className="w-full h-9 text-sm border-green-600 text-green-700 hover:bg-green-50" size="sm">
                  Redeem Pledge
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EuthanasiaPage() {
  const { euthanasiaListings } = useAdminData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "at-risk" | "rescued" | "dog" | "cat">("all");

  const filtered = useMemo(() => {
    return euthanasiaListings
      .filter(l => {
        const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.breed.toLowerCase().includes(search.toLowerCase()) ||
          l.location.toLowerCase().includes(search.toLowerCase()) ||
          petDisplayId(l.id).toLowerCase().includes(search.toLowerCase());
        const matchFilter =
          filter === "all" ? true :
          filter === "at-risk" ? l.status === "at-risk" :
          filter === "rescued" ? l.status === "rescued" :
          filter === "dog" ? l.species === "dog" :
          filter === "cat" ? l.species === "cat" : true;
        return matchSearch && matchFilter;
      })
      .sort((a, b) => {
        if (a.status === "rescued" && b.status !== "rescued") return 1;
        if (b.status === "rescued" && a.status !== "rescued") return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
  }, [euthanasiaListings, search, filter]);

  const atRiskCount = euthanasiaListings.filter(l => l.status === "at-risk").length;

  return (
    <PageTransition>
      <SEOHead
        title="Urgent Pet Rescue List"
        description="Pets urgently needing rescue from euthanasia. View and adopt dogs, cats, and more at risk across the UK, Europe, and worldwide."
        keywords="urgent pet rescue, euthanasia list, dogs needing rescue, cats needing rescue, adopt to save a life, pet adoption UK"
      />
      {/* Hero / Alert Banner */}
      <div className="bg-red-600 dark:bg-red-900 text-white py-10 px-4 text-center">
        <div className="container mx-auto max-w-4xl flex flex-col items-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold">Urgent Rescue List</h1>
          </div>
          <p className="text-white/90 text-base md:text-lg leading-relaxed max-w-3xl mb-4 mx-auto">
            Pet euthanasia is a humane, painless veterinary procedure — often involving a sedative
            followed by a barbiturate injection that causes rapid unconsciousness and cardiac arrest.
            These animals are scheduled for euthanasia and need urgent help. <strong>Every day counts.</strong>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            {atRiskCount > 0 && (
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-semibold">
                <Clock className="w-4 h-4" />
                {atRiskCount} pet{atRiskCount !== 1 ? "s" : ""} urgently need rescue right now
              </div>
            )}
            <Link href="/donate">
              <Button className="bg-white text-red-600 hover:bg-gray-100 font-bold shadow-md rounded-full px-6">
                <Heart className="w-4 h-4 mr-2 fill-red-600" /> Donate Now
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="text-white border-white hover:bg-white/10 font-bold shadow-md rounded-full px-6">
                Redeem Pledge
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* What you can do */}
      <div className="bg-muted/40 border-b border-border py-5 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-wrap gap-4 md:gap-8 text-sm">
            <div className="flex items-center gap-2 text-foreground">
              <Heart className="w-4 h-4 text-red-500 shrink-0" />
              <span><strong>Donate to Save</strong> — fund rescue before the deadline</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Heart className="w-4 h-4 text-primary shrink-0" />
              <span><strong>Adopt or Foster</strong> — give a pet a home</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Heart className="w-4 h-4 text-primary shrink-0" />
              <span><strong>Share</strong> — spread the word to reach more people</span>
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="bg-muted/30 py-10 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, breed, location or ID..."
                className="pl-10 h-11 bg-background"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["at-risk", "all", "dog", "cat", "rescued"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    filter === f
                      ? f === "at-risk" ? "bg-red-600 text-white border-red-600" : "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {f === "at-risk" ? "Urgent" : f === "all" ? "All" : f === "dog" ? "Dogs" : f === "cat" ? "Cats" : "Rescued"}
                </button>
              ))}
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(listing => (
                <EuthanasiaCard key={listing.id} listing={listing} searchQuery={search} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {search ? "No matches found" : "No pets in this category"}
              </h3>
              <p className="text-muted-foreground">
                {search ? "Try a different search term." : "Check back soon or browse other categories."}
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 bg-background rounded-2xl border border-border p-8 text-center">
            <Heart className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Every Life Matters</h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6">
              Even if you cannot adopt, a donation helps fund transport, vet care, and shelter costs
              that keep rescue organisations running.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/donate">
                <Button size="lg" className="px-8 bg-red-600 hover:bg-red-700">
                  <Heart className="w-4 h-4 mr-2 fill-white" /> Donate to Save Lives
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="px-8">Contact Us to Help</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
