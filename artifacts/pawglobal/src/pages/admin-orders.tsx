import { AdminLayout } from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import {
  Receipt, Heart, Search, Download, MapPin, Package,
  Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, X,
  Truck, CheckCircle2, Clock, BoxIcon, Navigation, MessageCircle, Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

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

type FilterType = "all" | "order" | "donation";

const TRACKING_STATUSES = [
  { value: "processing", label: "Order Processing", icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
  { value: "packed", label: "Packed & Ready", icon: BoxIcon, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
  { value: "in_transit", label: "In Transit", icon: Truck, color: "text-violet-600 bg-violet-50 dark:bg-violet-950/30" },
  { value: "out_for_delivery", label: "Out for Delivery", icon: Navigation, color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30" },
  { value: "delivered", label: "Delivered", icon: CheckCircle2, color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
];

function statusMeta(status: string) {
  return TRACKING_STATUSES.find(s => s.value === status) ?? {
    value: status, label: status, icon: Package, color: "text-muted-foreground bg-muted",
  };
}

function TrackingModal({ order, onClose, onUpdated }: { order: Order; onClose: () => void; onUpdated: (o: Order) => void }) {
  const { toast } = useToast();
  const [events, setEvents] = useState<TrackingEvent[]>(() => {
    try { return JSON.parse(order.trackingEvents || "[]"); } catch { return []; }
  });
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");
  const [newStatus, setNewStatus] = useState("processing");
  const [newMessage, setNewMessage] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [adding, setAdding] = useState(false);
  const [savingNumber, setSavingNumber] = useState(false);

  const addEvent = async () => {
    setAdding(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/tracking`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          message: newMessage,
          location: newLocation,
          ...(trackingNumber && { trackingNumber }),
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const updated = [...events, data.event];
      setEvents(updated);
      onUpdated({ ...order, trackingEvents: JSON.stringify(updated), trackingNumber: trackingNumber || order.trackingNumber });
      setNewMessage("");
      setNewLocation("");
      toast({ title: "Tracking update added" });
    } catch {
      toast({ title: "Failed to add update", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await fetch(`/api/orders/${order.id}/tracking/${eventId}`, { method: "DELETE" });
      const updated = events.filter(e => e.id !== eventId);
      setEvents(updated);
      onUpdated({ ...order, trackingEvents: JSON.stringify(updated) });
    } catch {
      toast({ title: "Failed to remove event", variant: "destructive" });
    }
  };

  const saveTrackingNumber = async () => {
    setSavingNumber(true);
    try {
      await fetch(`/api/orders/${order.id}/tracking-number`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber }),
      });
      onUpdated({ ...order, trackingNumber: trackingNumber || null });
      toast({ title: "Tracking number saved" });
    } catch {
      toast({ title: "Failed to save tracking number", variant: "destructive" });
    } finally {
      setSavingNumber(false);
    }
  };

  let itemNames = "";
  try {
    const parsed = JSON.parse(order.items);
    if (Array.isArray(parsed)) itemNames = parsed.map((i: any) => i.name || i.description || "Item").join(", ");
  } catch {}

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold text-foreground text-lg">Order Tracking</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {order.customerEmail || "Guest"} · ${(order.amountUSD / 100).toFixed(2)}
            </p>
            {itemNames && <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">{itemNames}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Tracking number */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Tracking Number</label>
            <div className="flex gap-2">
              <Input
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="e.g. DHL1234567890, FedEx9876543210"
                className="h-9 font-mono text-sm flex-1"
              />
              <Button size="sm" variant="outline" onClick={saveTrackingNumber} disabled={savingNumber} className="shrink-0">
                {savingNumber ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>

          {/* Existing timeline */}
          {events.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-3">Timeline</label>
              <div className="space-y-2">
                {[...events].reverse().map((event, idx) => {
                  const meta = statusMeta(event.status);
                  const Icon = meta.icon;
                  return (
                    <div key={event.id} className="flex items-start gap-3 group">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{meta.label}</span>
                          {event.location && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" /> {event.location}
                            </span>
                          )}
                        </div>
                        {event.message && <p className="text-xs text-muted-foreground mt-0.5">{event.message}</p>}
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {new Date(event.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="p-1 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add new event */}
          <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Add Tracking Update</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TRACKING_STATUSES.map(s => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.value}
                    onClick={() => setNewStatus(s.value)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-all ${newStatus === s.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
                  >
                    <Icon className="w-4 h-4" />
                    {s.label}
                  </button>
                );
              })}
            </div>
            <Input
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
              placeholder="Location (e.g. London, UK)"
              className="h-9 text-sm"
            />
            <Textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Optional message for the customer…"
              className="text-sm min-h-[70px] resize-none"
            />
            <Button onClick={addEvent} disabled={adding} className="w-full gap-2">
              {adding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Update
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CAUSES = [
  { value: "general", label: "General Rescue Fund" },
  { value: "medical", label: "Medical & Vet Care" },
  { value: "shelter", label: "Shelter & Housing" },
  { value: "rescue", label: "Rescue Operations" },
];

interface ManualItem { name: string; quantity: number; priceUSD: string; }

function ManualOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: (o: Order) => void }) {
  const { toast } = useToast();
  const [platform, setPlatform] = useState<"whatsapp" | "telegram">("whatsapp");
  const [orderType, setOrderType] = useState<"order" | "donation">("order");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending">("paid");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Order-specific
  const [items, setItems] = useState<ManualItem[]>([{ name: "", quantity: 1, priceUSD: "" }]);

  // Donation-specific
  const [cause, setCause] = useState("general");
  const [frequency, setFrequency] = useState<"once" | "monthly">("once");
  const [donationAmount, setDonationAmount] = useState("");

  const addItem = () => setItems(prev => [...prev, { name: "", quantity: 1, priceUSD: "" }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof ManualItem, val: string | number) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const orderTotalUSD = items.reduce((s, it) => {
    const p = parseFloat(it.priceUSD) || 0;
    return s + p * (it.quantity || 1);
  }, 0);

  const totalCents = orderType === "order"
    ? Math.round(orderTotalUSD * 100)
    : Math.round((parseFloat(donationAmount) || 0) * 100);

  const handleSubmit = async () => {
    if (totalCents <= 0) {
      toast({ title: "Amount must be greater than zero", variant: "destructive" });
      return;
    }
    if (orderType === "order" && items.every(it => !it.name.trim())) {
      toast({ title: "Please add at least one item", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        type: orderType,
        customerEmail: customerEmail.trim() || undefined,
        customerName: customerName.trim() || undefined,
        items: orderType === "order" ? items.filter(it => it.name.trim()).map(it => ({
          name: it.name.trim(),
          quantity: it.quantity,
          priceUSD: parseFloat(it.priceUSD) || 0,
        })) : undefined,
        amountUSD: totalCents,
        currency: "usd",
        paymentStatus,
        notes: notes.trim() || undefined,
        cause: orderType === "donation" ? cause : undefined,
        frequency: orderType === "donation" ? frequency : undefined,
        platform,
      };
      const res = await fetch("/api/orders/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log order");
      toast({ title: "Order logged successfully", description: data.order.trackingNumber ? `Tracking: ${data.order.trackingNumber}` : undefined });
      onCreated(data.order);
      onClose();
    } catch (err: any) {
      toast({ title: "Failed to log order", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${platform === "telegram" ? "bg-[#229ED9]/10" : "bg-[#25D366]/10"}`}>
              {platform === "telegram"
                ? <Send className="w-5 h-5 text-[#229ED9]" />
                : <MessageCircle className="w-5 h-5 text-[#25D366]" />}
            </div>
            <div>
              <h2 className="font-bold text-foreground text-base">Log Messaging Order</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Record an order received via WhatsApp or Telegram</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Platform */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Platform</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPlatform("whatsapp")}
                className={`flex items-center justify-center gap-2 h-10 rounded-xl border-2 text-sm font-medium transition-all ${
                  platform === "whatsapp" ? "border-[#25D366] bg-[#25D366]/10 text-[#25D366]" : "border-border text-muted-foreground hover:border-[#25D366]/40"
                }`}
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setPlatform("telegram")}
                className={`flex items-center justify-center gap-2 h-10 rounded-xl border-2 text-sm font-medium transition-all ${
                  platform === "telegram" ? "border-[#229ED9] bg-[#229ED9]/10 text-[#229ED9]" : "border-border text-muted-foreground hover:border-[#229ED9]/40"
                }`}
              >
                <Send className="w-4 h-4" /> Telegram
              </button>
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["order", "donation"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setOrderType(t)}
                  className={`flex items-center justify-center gap-2 h-10 rounded-xl border-2 text-sm font-medium transition-all capitalize ${
                    orderType === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {t === "order" ? <Receipt className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
                  {t === "order" ? "Product Order" : "Donation"}
                </button>
              ))}
            </div>
          </div>

          {/* Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Customer Name</label>
              <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="John Smith" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Customer Email</label>
              <Input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="john@example.com" type="email" className="h-9 text-sm" />
            </div>
          </div>

          {/* Order items */}
          {orderType === "order" && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Items</label>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      value={item.name}
                      onChange={e => updateItem(i, "name", e.target.value)}
                      placeholder="Item name"
                      className="h-9 text-sm flex-1"
                    />
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e => updateItem(i, "quantity", parseInt(e.target.value) || 1)}
                      className="h-9 text-sm w-16 shrink-0"
                      placeholder="Qty"
                    />
                    <div className="relative w-24 shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.priceUSD}
                        onChange={e => updateItem(i, "priceUSD", e.target.value)}
                        className="h-9 text-sm pl-6"
                        placeholder="0.00"
                      />
                    </div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="p-1.5 text-muted-foreground/50 hover:text-destructive transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addItem} className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-2 font-medium">
                <Plus className="w-3.5 h-3.5" /> Add item
              </button>
              {orderTotalUSD > 0 && (
                <p className="mt-2 text-sm font-semibold text-foreground">
                  Total: ${orderTotalUSD.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Donation fields */}
          {orderType === "donation" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Cause</label>
                <div className="grid grid-cols-2 gap-2">
                  {CAUSES.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCause(c.value)}
                      className={`h-9 rounded-xl border text-xs font-medium transition-all px-3 text-left ${cause === c.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input value={donationAmount} onChange={e => setDonationAmount(e.target.value)} type="number" min={0} step="0.01" placeholder="0.00" className="h-9 text-sm pl-6" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Frequency</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["once", "monthly"] as const).map(f => (
                      <button key={f} type="button" onClick={() => setFrequency(f)} className={`h-9 rounded-xl border text-xs font-medium capitalize transition-all ${frequency === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment status */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Payment Status</label>
            <div className="grid grid-cols-2 gap-2">
              {(["paid", "pending"] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPaymentStatus(s)}
                  className={`flex items-center justify-center gap-2 h-10 rounded-xl border-2 text-sm font-medium transition-all capitalize ${
                    paymentStatus === s
                      ? s === "paid" ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {s === "paid" ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  {s === "paid" ? "Payment Received" : "Awaiting Payment"}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">Notes / WhatsApp Reference</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. WhatsApp chat ref, customer message, special instructions…"
              className="text-sm min-h-[70px] resize-none"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border shrink-0 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className={`flex-1 gap-2 text-white ${platform === "telegram" ? "bg-[#229ED9] hover:bg-[#1a8bbf]" : "bg-[#25D366] hover:bg-[#1ebe5a]"}`}
            onClick={handleSubmit}
            disabled={submitting || totalCents <= 0}
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : platform === "telegram" ? <Send className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
            Log Order
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);

  useEffect(() => {
    fetch("/api/orders")
      .then(r => r.json())
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    const matchType = filter === "all" || o.type === filter;
    const matchSearch =
      !search ||
      (o.customerEmail ?? "").toLowerCase().includes(search.toLowerCase()) ||
      o.sessionId.toLowerCase().includes(search.toLowerCase()) ||
      (o.trackingNumber ?? "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalRevenue = filtered.filter(o => o.type === "order").reduce((s, o) => s + o.amountUSD, 0);
  const totalDonations = filtered.filter(o => o.type === "donation").reduce((s, o) => s + o.amountUSD, 0);

  const downloadCSV = () => {
    const rows = [
      ["Date", "Type", "Email", "Amount (USD)", "Status", "Tracking #", "Session ID"],
      ...filtered.map(o => [
        new Date(o.createdAt).toISOString(),
        o.type,
        o.customerEmail || "",
        (o.amountUSD / 100).toFixed(2),
        o.status,
        o.trackingNumber || "",
        o.sessionId,
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "euthlist-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOrderUpdated = (updated: Order) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
    if (trackingOrder?.id === updated.id) setTrackingOrder(updated);
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Orders & Donations</h1>
            <p className="text-muted-foreground mt-1">Stripe, WhatsApp & Telegram transactions with tracking</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white shrink-0"
              onClick={() => setShowManualModal(true)}
            >
              <MessageCircle className="w-4 h-4" /> Log Messaging Order
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={downloadCSV}>
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-background border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Transactions</p>
            <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
          </div>
          <div className="bg-background border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Order Revenue</p>
            <p className="text-2xl font-bold text-foreground">${(totalRevenue / 100).toFixed(2)}</p>
          </div>
          <div className="bg-background border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Donations Received</p>
            <p className="text-2xl font-bold text-foreground">${(totalDonations / 100).toFixed(2)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search email, session ID, or tracking #..."
              className="pl-9 h-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {(["all", "order", "donation"] as FilterType[]).map(f => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize">
                {f === "all" ? "All" : f === "order" ? "Orders" : "Donations"}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-background border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Loading transactions…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Items</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tracking</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map(order => {
                    const isDonation = order.type === "donation";
                    let itemNames = "";
                    try {
                      const parsed = JSON.parse(order.items);
                      if (Array.isArray(parsed)) itemNames = parsed.map((i: any) => i.name || i.description || "Item").join(", ");
                    } catch {}
                    if (!itemNames) {
                      try {
                        const meta = JSON.parse(order.metadata);
                        if (meta.shelter) {
                          const m: Record<string, string> = { general: "General Rescue Fund", medical: "Medical & Vet Care", shelter: "Shelter & Housing", rescue: "Rescue Operations" };
                          itemNames = m[meta.shelter] || meta.shelter;
                        }
                      } catch {}
                    }

                    let events: TrackingEvent[] = [];
                    try { events = JSON.parse(order.trackingEvents || "[]"); } catch {}
                    const latestEvent = events[events.length - 1];
                    const meta = latestEvent ? statusMeta(latestEvent.status) : null;

                    const isExpanded = expandedId === order.id;

                    return [
                      <tr key={order.id} className={`hover:bg-muted/30 transition-colors ${isExpanded ? "bg-muted/20" : ""}`}>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${isDonation ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"}`}>
                              {isDonation ? <Heart className="w-3 h-3" /> : <Receipt className="w-3 h-3" />}
                              {isDonation ? "Donation" : "Order"}
                            </span>
                            {(() => { try { return JSON.parse(order.metadata)?.source; } catch { return null; } })() === "whatsapp" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#25D366]/15 text-[#25D366]">
                                <MessageCircle className="w-2.5 h-2.5" /> WhatsApp
                              </span>
                            )}
                            {(() => { try { return JSON.parse(order.metadata)?.source; } catch { return null; } })() === "telegram" && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#229ED9]/15 text-[#229ED9]">
                                <Send className="w-2.5 h-2.5" /> Telegram
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {order.customerEmail || <span className="text-muted-foreground">Guest</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{itemNames || "—"}</td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">
                          ${(order.amountUSD / 100).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          {meta ? (
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
                              <meta.icon className="w-3 h-3" />
                              {meta.label}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">No tracking</span>
                          )}
                          {order.trackingNumber && (
                            <p className="text-xs text-muted-foreground/70 font-mono mt-0.5 truncate max-w-[120px]">{order.trackingNumber}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setTrackingOrder(order)}
                              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap"
                            >
                              <Truck className="w-3 h-3" /> Update Tracking
                            </button>
                            {events.length > 0 && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                title="Toggle timeline"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>,
                      isExpanded && events.length > 0 && (
                        <tr key={`${order.id}-expand`} className="bg-muted/10">
                          <td colSpan={7} className="px-8 py-4">
                            <div className="flex flex-col gap-2 max-w-xl">
                              {[...events].reverse().map(ev => {
                                const evMeta = statusMeta(ev.status);
                                const EvIcon = evMeta.icon;
                                return (
                                  <div key={ev.id} className="flex items-start gap-3">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${evMeta.color}`}>
                                      <EvIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <span className="text-xs font-semibold text-foreground">{evMeta.label}</span>
                                      {ev.location && <span className="text-xs text-muted-foreground ml-2">· {ev.location}</span>}
                                      {ev.message && <p className="text-xs text-muted-foreground mt-0.5">{ev.message}</p>}
                                      <p className="text-xs text-muted-foreground/50 mt-0.5">
                                        {new Date(ev.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      ),
                    ];
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Tracking modal */}
      {trackingOrder && (
        <TrackingModal
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
          onUpdated={handleOrderUpdated}
        />
      )}

      {/* Manual WhatsApp order modal */}
      {showManualModal && (
        <ManualOrderModal
          onClose={() => setShowManualModal(false)}
          onCreated={(newOrder) => {
            setOrders(prev => [newOrder, ...prev]);
          }}
        />
      )}
    </AdminLayout>
  );
}
