import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminData } from "@/contexts/AdminDataContext";
import { Link } from "wouter";
import { Dog, Cat, ShoppingBag, Heart, PlusCircle, TrendingUp, DollarSign, Receipt, ArrowUpRight, RefreshCw, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { invalidateSettingsCache } from "@/hooks/use-store-settings";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface OrderStats {
  totalOrders: number;
  totalDonations: number;
  totalRevenue: number;
  totalDonationAmount: number;
  recentDays: { date: string; orders: number; donations: number; revenue: number }[];
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
  createdAt: string;
}

const CACHE_KEYS = [
  "pawglobal-dogs-v3",
  "pawglobal-cats-v3",
  "pawglobal-supplies-v3",
  "pawglobal-euthanasia-v1",
  "pawglobal-db-migrated-v1",
];

export default function AdminDashboard() {
  const { dogs, cats, supplies } = useAdminData();
  const { toast } = useToast();
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const clearCache = async () => {
    setClearing(true);
    try {
      invalidateSettingsCache();
      CACHE_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch {} });
      if ("caches" in window) {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
      }
      setCleared(true);
      toast({ title: "Cache cleared", description: "All cached data has been removed. Reloading fresh data…" });
      setTimeout(() => { window.location.reload(); }, 1200);
    } catch {
      toast({ title: "Clear failed", description: "Something went wrong. Try reloading the page manually.", variant: "destructive" });
    } finally {
      setClearing(false);
    }
  };

  const adoptDogs = dogs.filter(d => d.status === "adopt").length;
  const adoptCats = cats.filter(c => c.status === "adopt").length;
  const totalListings = dogs.length + cats.length + supplies.length;

  useEffect(() => {
    fetch("/api/orders/stats")
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
    fetch("/api/orders")
      .then(r => r.json())
      .then((rows: Order[]) => setRecentOrders(rows.slice(0, 6)))
      .catch(() => {});
  }, []);

  const revenueUSD = stats ? (stats.totalRevenue / 100).toFixed(2) : "—";
  const donationUSD = stats ? (stats.totalDonationAmount / 100).toFixed(2) : "—";

  const topStats = [
    {
      label: "Orders",
      value: stats?.totalOrders ?? "—",
      sub: "Paid purchases",
      icon: Receipt,
      href: "/admin/orders",
      color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Revenue",
      value: stats ? `$${revenueUSD}` : "—",
      sub: "Sales",
      icon: DollarSign,
      href: "/admin/orders",
      color: "text-green-600 bg-green-50 dark:bg-green-950/30",
    },
    {
      label: "Donations",
      value: stats?.totalDonations ?? "—",
      sub: stats ? `$${donationUSD}` : "Total",
      icon: Heart,
      href: "/admin/orders",
      color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30",
    },
    {
      label: "Listings",
      value: totalListings,
      sub: `${adoptDogs + adoptCats} adopt`,
      icon: TrendingUp,
      href: "#",
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
    },
  ];

  const catalogStats = [
    { label: "Dogs", value: dogs.length, sub: `${adoptDogs} adoptable`, icon: Dog, href: "/admin/dogs", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
    { label: "Cats", value: cats.length, sub: `${adoptCats} adoptable`, icon: Cat, href: "/admin/cats", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
    { label: "Supplies", value: supplies.length, sub: "Products", icon: ShoppingBag, href: "/admin/supplies", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
  ];

  const chartData = stats?.recentDays ?? [];

  const quickActions = [
    { label: "Add Dog", href: "/admin/dogs", icon: Dog },
    { label: "Add Cat", href: "/admin/cats", icon: Cat },
    { label: "Add Supply", href: "/admin/supplies", icon: ShoppingBag },
    { label: "Settings", href: "/admin/settings", icon: TrendingUp },
  ];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">Overview of your EuthList store</p>
          </div>
          <button
            type="button"
            onClick={clearCache}
            disabled={clearing || cleared}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all shrink-0
              ${cleared
                ? "border-green-400 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/40"
              }
              disabled:opacity-60 disabled:cursor-not-allowed`}
            title="Clear all cached data and reload fresh from server"
          >
            {clearing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : cleared ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {clearing ? "Clearing…" : cleared ? "Cleared!" : "Clear Cache"}
          </button>
        </div>

        {/* Top stats — 2×2 on mobile, 4 cols on lg */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {topStats.map(({ label, value, sub, icon: Icon, href, color }) => (
            <Link
              key={label}
              href={href}
              className="bg-background border border-border rounded-xl p-4 hover:shadow-md transition-shadow block"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground leading-none">{value}</p>
              <p className="text-xs sm:text-sm font-medium text-foreground mt-1">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{sub}</p>
            </Link>
          ))}
        </div>

        {/* Revenue chart */}
        <div className="bg-background border border-border rounded-xl p-4 sm:p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-foreground text-sm sm:text-base">Revenue — Last 7 Days</h2>
              <p className="text-xs text-muted-foreground mt-0.5">USD</p>
            </div>
            <Link href="/admin/orders" className="flex items-center gap-1 text-xs text-primary font-medium hover:underline shrink-0">
              All orders <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData.map(d => ({ ...d, revenue: +(d.revenue / 100).toFixed(2) }))}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#f97316" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm text-center px-4">
              No data yet. Revenue will appear here after orders are placed.
            </div>
          )}
        </div>

        {/* Recent transactions + Catalog */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-background border border-border rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground text-sm sm:text-base">Recent Transactions</h2>
              <Link href="/admin/orders" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No transactions yet.</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map(order => {
                  const isDonation = order.type === "donation";
                  const amount = `$${(order.amountUSD / 100).toFixed(2)}`;
                  const date = new Date(order.createdAt).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
                  return (
                    <div key={order.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDonation ? "bg-rose-50 dark:bg-rose-950/30" : "bg-blue-50 dark:bg-blue-950/30"}`}>
                        {isDonation ? <Heart className="w-4 h-4 text-rose-600" /> : <Receipt className="w-4 h-4 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {isDonation ? "Donation" : "Order"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {order.customerEmail || "Guest"} · {date}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${isDonation ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"}`}>
                        {amount}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Catalog */}
          <div className="bg-background border border-border rounded-xl p-4 sm:p-6">
            <h2 className="font-semibold text-foreground mb-4 text-sm sm:text-base">Catalog</h2>
            <div className="space-y-2">
              {catalogStats.map(({ label, value, sub, icon: Icon, href, color }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                  <span className="text-lg font-bold text-foreground shrink-0">{value}</span>
                </Link>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                <span>
                  <strong className="text-foreground">{adoptDogs + adoptCats}</strong> awaiting adoption
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-2 px-3 py-3 sm:px-4 bg-background border border-border rounded-lg hover:shadow-sm hover:border-primary/30 transition-all text-sm font-medium text-foreground"
            >
              <PlusCircle className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
