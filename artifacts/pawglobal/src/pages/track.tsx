import { PageTransition } from "@/components/PageTransition";
import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import {
  Truck, CheckCircle2, Clock, BoxIcon, Navigation, Package,
  MapPin, ChevronDown, ChevronUp, RefreshCw, Search, AlertCircle,
  AlertTriangle, Heart, User, Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAdminData } from "@/contexts/AdminDataContext";
import { petDisplayId, EuthanasiaListing } from "@/lib/data";

interface TrackingEvent {
  id: string;
  status: string;
  message: string;
  location: string;
  timestamp: string;
}

interface TrackingData {
  id: string;
  trackingNumber: string;
  trackingEvents: string;
  status: string;
  items: string;
  type: string;
  createdAt: string;
  customerEmail: string | null;
}

const TRACKING_STEPS = [
  { value: "processing", label: "Order Confirmed", icon: Clock },
  { value: "packed", label: "Packed & Ready", icon: BoxIcon },
  { value: "in_transit", label: "In Transit", icon: Truck },
  { value: "out_for_delivery", label: "Out for Delivery", icon: Navigation },
  { value: "delivered", label: "Delivered", icon: CheckCircle2 },
];

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function EuthanasiaResult({ listing }: { listing: EuthanasiaListing }) {
  const days = daysUntil(listing.deadline);
  const isRescued = listing.status === "rescued";
  const urgent = !isRescued && days <= 3;

  return (
    <div className={`bg-background border rounded-2xl overflow-hidden ${
      isRescued ? "border-green-300 dark:border-green-800" : urgent ? "border-red-300 dark:border-red-800 ring-1 ring-red-200 dark:ring-red-900" : "border-orange-300 dark:border-orange-700"
    }`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-start justify-between gap-4 flex-wrap ${
        isRescued ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" :
        urgent ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800" :
        "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-700"
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isRescued
              ? <CheckCircle2 className="w-4 h-4 text-green-600" />
              : <AlertTriangle className={`w-4 h-4 ${urgent ? "text-red-600 animate-pulse" : "text-orange-500"}`} />
            }
            <span className={`text-xs font-bold uppercase tracking-wide ${
              isRescued ? "text-green-600" : urgent ? "text-red-600" : "text-orange-600"
            }`}>
              {isRescued ? "Rescued — Safe" : urgent ? "Critical — Urgent Rescue Needed" : "At Risk — Rescue Needed"}
            </span>
          </div>
          <p className="text-2xl font-mono font-bold text-foreground tracking-widest">{petDisplayId(listing.id)}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{listing.name} · {listing.breed}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Listed</p>
          <p className="text-sm font-medium text-foreground">
            {new Date(listing.addedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Photo + details */}
        <div className="flex gap-4">
          {listing.image && (
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
              <img src={listing.image} alt={listing.name} className={`w-full h-full object-cover ${isRescued ? "grayscale" : ""}`} />
            </div>
          )}
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">{listing.age}</span>
              <span>·</span>
              <span>{listing.gender}</span>
              <span>·</span>
              <span className="capitalize">{listing.species}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {listing.shelter}, {listing.location}
            </div>
            {!isRescued && (
              <div className={`flex items-center gap-1.5 font-semibold ${urgent ? "text-red-600" : "text-orange-600"}`}>
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                Deadline: {new Date(listing.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                {days > 0 ? ` (${days} day${days !== 1 ? "s" : ""} left)` : " (passed)"}
              </div>
            )}
            {listing.author && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <User className="w-3.5 h-3.5 shrink-0" />
                Listed by {listing.author}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-border pl-4">
            {listing.description}
          </p>
        )}

        {/* Status message */}
        {isRescued ? (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-700 dark:text-green-300">This pet has been rescued!</p>
              <p className="text-sm text-green-600 dark:text-green-400">Thanks to our amazing community, {listing.name} is now safe.</p>
            </div>
          </div>
        ) : (
          <div className={`rounded-xl p-4 flex items-center gap-3 ${urgent ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800" : "bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-700"}`}>
            <AlertTriangle className={`w-5 h-5 shrink-0 ${urgent ? "text-red-600 animate-pulse" : "text-orange-500"}`} />
            <div>
              <p className={`font-semibold ${urgent ? "text-red-700 dark:text-red-300" : "text-orange-700 dark:text-orange-300"}`}>
                {urgent ? `Only ${days <= 0 ? "0" : days} day${days !== 1 ? "s" : ""} remaining!` : `${days} days until scheduled euthanasia`}
              </p>
              <p className={`text-sm ${urgent ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"}`}>
                {listing.name} needs urgent help — please donate or adopt before the deadline.
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!isRescued && (
          <div className="flex gap-3 flex-wrap">
            <Link href="/donate">
              <Button className="gap-2 bg-red-600 hover:bg-red-700">
                <Heart className="w-4 h-4 fill-white" /> Donate to Save {listing.name}
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="gap-2">
                Adopt / Foster
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="border-t border-border px-6 py-4 bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">Questions? Email <a href="mailto:hello@euthlist.com" className="text-primary hover:underline">hello@euthlist.com</a></p>
        <Link href="/euthanasia">
          <button className="text-xs text-primary hover:underline font-medium">View all urgent listings →</button>
        </Link>
      </div>
    </div>
  );
}

export default function TrackOrder() {
  const params = useParams<{ trackingNumber: string }>();
  const { euthanasiaListings } = useAdminData();

  const [input, setInput] = useState(params.trackingNumber ?? "");
  const [trackingNumber, setTrackingNumber] = useState(params.trackingNumber ?? "");
  const [data, setData] = useState<TrackingData | null>(null);
  const [euthanasiaResult, setEuthanasiaResult] = useState<EuthanasiaListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const lookup = async (tn: string) => {
    const clean = tn.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setError("");
    setData(null);
    setEuthanasiaResult(null);
    setHistoryExpanded(false);

    // Check if it looks like a pet display ID (starts with ID + digits)
    if (/^ID\d+$/.test(clean)) {
      const match = euthanasiaListings.find(l => petDisplayId(l.id) === clean);
      if (match) {
        setEuthanasiaResult(match);
        setTrackingNumber(clean);
        window.history.replaceState(null, "", `/track/${clean}`);
        setLoading(false);
        return;
      }
      setError(`No pet found with ID ${clean}. Check the ID on the Urgent Rescue List.`);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(clean)}`);
      if (res.status === 404) { setError("No order found with this tracking number. Please check and try again."); setLoading(false); return; }
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
      setTrackingNumber(clean);
      window.history.replaceState(null, "", `/track/${clean}`);
    } catch {
      setError("Could not look up tracking information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.trackingNumber) lookup(params.trackingNumber);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const events: TrackingEvent[] = (() => {
    try { return JSON.parse(data?.trackingEvents ?? "[]"); } catch { return []; }
  })();

  const latestEvent = events[events.length - 1];
  const currentStepIdx = latestEvent ? TRACKING_STEPS.findIndex(s => s.value === latestEvent.status) : -1;

  let itemNames: string[] = [];
  if (data?.items) {
    try {
      const parsed = JSON.parse(data.items);
      if (Array.isArray(parsed)) itemNames = parsed.map((i: any) => i.name || i.description || "Item");
    } catch {}
  }

  return (
    <PageTransition>
      <div className="bg-muted/30 min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
              <Truck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">Track</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter an order tracking number <strong>(e.g. PGXYZ123)</strong> or a pet rescue ID <strong>(e.g. ID272757)</strong>.
            </p>
          </div>

          {/* Search */}
          <div className="bg-background border border-border rounded-2xl p-6 mb-6">
            <form
              onSubmit={e => { e.preventDefault(); lookup(input); }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value.toUpperCase())}
                  placeholder="PGXYZ123 or ID272757"
                  className="pl-9 h-11 font-mono tracking-widest uppercase"
                  maxLength={20}
                />
              </div>
              <Button type="submit" disabled={loading} className="h-11 gap-2 shrink-0">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Track
              </Button>
            </form>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
              <span>Order numbers start with <strong>PG</strong></span>
              <span>Pet IDs start with <strong>ID</strong> (find on Urgent Rescue page)</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Euthanasia pet result */}
          {euthanasiaResult && <EuthanasiaResult listing={euthanasiaResult} />}

          {/* Order result */}
          {data && (
            <div className="bg-background border border-border rounded-2xl overflow-hidden">
              <div className="bg-primary/5 border-b border-border px-6 py-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Tracking Number</p>
                    <p className="text-2xl font-mono font-bold text-foreground tracking-widest">{data.trackingNumber}</p>
                    {data.customerEmail && (
                      <p className="text-xs text-muted-foreground mt-1">Order for {data.customerEmail}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Order placed</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(data.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {itemNames.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Items</p>
                    <div className="flex flex-wrap gap-2">
                      {itemNames.map((name, i) => (
                        <span key={i} className="text-xs bg-muted px-3 py-1 rounded-full text-foreground font-medium">{name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {events.length > 0 ? (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Delivery Progress</p>
                      <div className="flex items-center gap-1">
                        {TRACKING_STEPS.map((step, idx) => {
                          const Icon = step.icon;
                          const done = idx <= currentStepIdx;
                          const active = idx === currentStepIdx;
                          return (
                            <div key={step.value} className="flex items-center flex-1 last:flex-none">
                              <div className="flex flex-col items-center gap-1.5">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${active ? "bg-primary text-white shadow-lg ring-4 ring-primary/20 scale-110" : done ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/40"}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span className={`text-[10px] font-medium text-center leading-tight hidden sm:block ${done ? "text-primary" : "text-muted-foreground/50"}`}>
                                  {step.label}
                                </span>
                              </div>
                              {idx < TRACKING_STEPS.length - 1 && (
                                <div className={`flex-1 h-1 mx-1 rounded-full ${idx < currentStepIdx ? "bg-primary/40" : "bg-muted"}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {latestEvent && (
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-foreground">
                              {TRACKING_STEPS[currentStepIdx]?.label ?? latestEvent.status}
                            </p>
                            {latestEvent.message && (
                              <p className="text-sm text-muted-foreground mt-1">{latestEvent.message}</p>
                            )}
                            {latestEvent.location && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                <MapPin className="w-3 h-3 text-primary" /> {latestEvent.location}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                            {new Date(latestEvent.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    )}

                    {events.length > 1 && (
                      <div>
                        <button
                          onClick={() => setHistoryExpanded(!historyExpanded)}
                          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                        >
                          {historyExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {historyExpanded ? "Hide" : "Show"} full tracking history ({events.length} updates)
                        </button>
                        {historyExpanded && (
                          <div className="mt-4 space-y-4 border-l-2 border-border ml-4 pl-5">
                            {[...events].reverse().map((ev, idx) => {
                              const stepMeta = TRACKING_STEPS.find(s => s.value === ev.status);
                              const Icon = stepMeta?.icon ?? Package;
                              const isLatest = idx === 0;
                              return (
                                <div key={ev.id} className="relative">
                                  <div className={`absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center ring-2 ring-background ${isLatest ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                                    <Icon className="w-3 h-3" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-semibold text-foreground">{stepMeta?.label ?? ev.status}</p>
                                      {isLatest && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">Latest</span>}
                                    </div>
                                    {ev.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-2.5 h-2.5" /> {ev.location}</p>}
                                    {ev.message && <p className="text-xs text-muted-foreground/70 mt-0.5">{ev.message}</p>}
                                    <p className="text-xs text-muted-foreground/50 mt-1">
                                      {new Date(ev.timestamp).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="font-medium text-foreground mb-1">Tracking updates coming soon</p>
                    <p className="text-sm text-muted-foreground">Your order is confirmed. Tracking information will be updated shortly.</p>
                  </div>
                )}
              </div>

              <div className="border-t border-border px-6 py-4 bg-muted/20 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">Questions? Email <a href="mailto:shipping@euthlist.com" className="text-primary hover:underline">shipping@euthlist.com</a></p>
                <Link href="/my-orders">
                  <button className="text-xs text-primary hover:underline font-medium">View all orders →</button>
                </Link>
              </div>
            </div>
          )}

          {!data && !euthanasiaResult && !loading && !error && (
            <div className="text-center mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Don't have a tracking number?{" "}
                <Link href="/my-orders" className="text-primary hover:underline font-medium">Look up by email →</Link>
              </p>
              <p className="text-sm text-muted-foreground">
                Looking for a rescue pet?{" "}
                <Link href="/euthanasia" className="text-red-500 hover:underline font-medium">View urgent rescue list →</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
