import { PageTransition } from "@/components/PageTransition";
import { useState } from "react";
import {
  Search, Receipt, Heart, Package, PawPrint, Loader2, Mail,
  MapPin, Truck, CheckCircle2, Clock, BoxIcon, Navigation,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface TrackingEvent {
  id: string;
  status: string;
  message: string;
  location: string;
  timestamp: string;
}

interface Order {
  id: string;
  sessionId: string;
  type: string;
  customerEmail: string | null;
  amountUSD: number;
  currency: string;
  status: string;
  items: string;
  metadata: string;
  trackingNumber: string | null;
  trackingEvents: string;
  createdAt: string;
}

const TRACKING_STEPS = [
  { value: "processing", label: "Processing", icon: Clock },
  { value: "packed", label: "Packed", icon: BoxIcon },
  { value: "in_transit", label: "In Transit", icon: Truck },
  { value: "out_for_delivery", label: "Out for Delivery", icon: Navigation },
  { value: "delivered", label: "Delivered", icon: CheckCircle2 },
];

function TrackingTimeline({ events, trackingNumber }: { events: TrackingEvent[]; trackingNumber: string | null }) {
  const [expanded, setExpanded] = useState(false);

  if (events.length === 0) return null;

  const latestEvent = events[events.length - 1];
  const currentStepIdx = TRACKING_STEPS.findIndex(s => s.value === latestEvent.status);

  return (
    <div className="mt-4 border-t border-border pt-4">
      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-4">
        {TRACKING_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const done = idx <= currentStepIdx;
          const active = idx === currentStepIdx;
          return (
            <div key={step.value} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${active ? "bg-primary text-white shadow-lg scale-110" : done ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/40"}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap hidden sm:block ${done ? "text-primary" : "text-muted-foreground/50"}`}>
                  {step.label}
                </span>
              </div>
              {idx < TRACKING_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded ${idx < currentStepIdx ? "bg-primary/40" : "bg-muted"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Current status summary */}
      <div className="bg-muted/40 rounded-xl p-3 mb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {TRACKING_STEPS[currentStepIdx]?.label ?? latestEvent.status}
            </p>
            {latestEvent.message && (
              <p className="text-xs text-muted-foreground mt-0.5">{latestEvent.message}</p>
            )}
            {latestEvent.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-2.5 h-2.5" /> {latestEvent.location}
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {new Date(latestEvent.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        {trackingNumber && (
          <p className="text-xs text-muted-foreground font-mono mt-2 pt-2 border-t border-border">
            Tracking #: <span className="text-foreground">{trackingNumber}</span>
          </p>
        )}
      </div>

      {/* Full history toggle */}
      {events.length > 1 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Hide" : "Show"} full history ({events.length} updates)
          </button>
          {expanded && (
            <div className="mt-3 space-y-3 pl-2 border-l-2 border-border ml-3">
              {[...events].reverse().map(ev => {
                const stepMeta = TRACKING_STEPS.find(s => s.value === ev.status);
                const Icon = stepMeta?.icon ?? Package;
                return (
                  <div key={ev.id} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 -ml-4 ring-2 ring-background">
                      <Icon className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{stepMeta?.label ?? ev.status}</p>
                      {ev.location && <p className="text-xs text-muted-foreground">{ev.location}</p>}
                      {ev.message && <p className="text-xs text-muted-foreground/70">{ev.message}</p>}
                      <p className="text-xs text-muted-foreground/50 mt-0.5">
                        {new Date(ev.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function MyOrders() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    setOrders(null);
    setSubmitted(trimmed);
    try {
      const res = await fetch(`/api/orders/by-email?email=${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setOrders(data);
    } catch {
      setError("Could not look up orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = orders?.filter(o => o.type === "order").reduce((s, o) => s + o.amountUSD, 0) ?? 0;
  const totalDonated = orders?.filter(o => o.type === "donation").reduce((s, o) => s + o.amountUSD, 0) ?? 0;

  return (
    <PageTransition>
      <div className="bg-muted/30 min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
              <PawPrint className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">My Orders</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter the email address you used at checkout to see your order history and live tracking.
            </p>
          </div>

          {/* Lookup form */}
          <div className="bg-background border border-border rounded-2xl p-6 mb-6">
            <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-9 h-11"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="h-11 gap-2 shrink-0">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Look Up Orders
              </Button>
            </form>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          {orders !== null && (
            <>
              {orders.length === 0 ? (
                <div className="bg-background border border-border rounded-2xl p-12 text-center">
                  <Receipt className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h2 className="text-lg font-semibold text-foreground mb-2">No orders found</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    We couldn't find any orders for <strong>{submitted}</strong>. Make sure you're using the same email as at checkout.
                  </p>
                  <Link href="/shop/dogs">
                    <Button variant="outline">Browse Pets</Button>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-background border border-border rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{orders.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total Transactions</p>
                    </div>
                    <div className="bg-background border border-border rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">${(totalSpent / 100).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Spent on Pets & Supplies</p>
                    </div>
                    <div className="bg-background border border-border rounded-xl p-4 text-center col-span-2 sm:col-span-1">
                      <p className="text-2xl font-bold text-rose-600">${(totalDonated / 100).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Donated to Shelters</p>
                    </div>
                  </div>

                  {/* Order list */}
                  <div className="space-y-4">
                    {orders.map(order => {
                      const isDonation = order.type === "donation";
                      let itemNames: string[] = [];
                      try {
                        const parsed = JSON.parse(order.items);
                        if (Array.isArray(parsed)) itemNames = parsed.map((i: any) => i.name || i.description || "Item");
                      } catch {}

                      let shelterName = "";
                      if (isDonation && itemNames.length === 0) {
                        try {
                          const meta = JSON.parse(order.metadata);
                          const shelterMap: Record<string, string> = {
                            general: "General Rescue Fund",
                            medical: "Medical & Vet Care",
                            shelter: "Shelter & Housing",
                            rescue: "Rescue Operations",
                          };
                          shelterName = shelterMap[meta.shelter] || meta.shelter || "";
                        } catch {}
                      }

                      let trackingEvents: TrackingEvent[] = [];
                      try { trackingEvents = JSON.parse(order.trackingEvents || "[]"); } catch {}

                      return (
                        <div key={order.id} className="bg-background border border-border rounded-xl p-5">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isDonation ? "bg-rose-50 dark:bg-rose-950/30" : "bg-blue-50 dark:bg-blue-950/30"}`}>
                                {isDonation ? <Heart className="w-5 h-5 text-rose-600" /> : <Package className="w-5 h-5 text-blue-600" />}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground text-sm">
                                  {isDonation ? "Donation" : "Purchase"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                                    weekday: "short", year: "numeric", month: "long", day: "numeric",
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-foreground">${(order.amountUSD / 100).toFixed(2)}</p>
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 capitalize">
                                {order.status}
                              </span>
                            </div>
                          </div>

                          {(itemNames.length > 0 || shelterName) && (
                            <div className="bg-muted/50 rounded-lg p-3">
                              {isDonation && shelterName ? (
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium text-foreground">Directed to:</span> {shelterName}
                                </p>
                              ) : (
                                <ul className="space-y-1">
                                  {itemNames.map((name, i) => (
                                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                                      <PawPrint className="w-3 h-3 text-primary shrink-0" />
                                      {name}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}

                          {/* Tracking */}
                          {!isDonation && (
                            <TrackingTimeline
                              events={trackingEvents}
                              trackingNumber={order.trackingNumber}
                            />
                          )}

                          {!isDonation && trackingEvents.length === 0 && (
                            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5" /> Tracking will appear here once your order is dispatched.
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground mt-3 font-mono border-t border-border pt-3">
                            Order ref: {order.sessionId.slice(0, 30)}…
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* CTA if no lookup done */}
          {orders === null && !loading && (
            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground mb-4">Don't have an order yet?</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href="/shop/dogs">
                  <Button variant="outline" className="gap-2">
                    <PawPrint className="w-4 h-4" /> Browse Pets
                  </Button>
                </Link>
                <Link href="/donate">
                  <Button variant="outline" className="gap-2">
                    <Heart className="w-4 h-4" /> Make a Donation
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
