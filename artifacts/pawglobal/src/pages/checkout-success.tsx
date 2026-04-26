import { useEffect, useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShoppingBag, Home, Truck, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Link } from "wouter";

interface SessionData {
  status: string;
  trackingNumber?: string;
  customerEmail?: string;
}

export default function CheckoutSuccess() {
  const { clearCart } = useCart();
  const [status, setStatus] = useState<"loading" | "paid" | "error">("loading");
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  useEffect(() => {
    clearCart();
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId) {
      setStatus("paid");
      return;
    }

    fetch(`/api/checkout/stripe-session/${sessionId}`)
      .then(r => r.json())
      .then(data => {
        setSessionData(data);
        setStatus(data.status === "paid" ? "paid" : "error");
      })
      .catch(() => setStatus("paid"));
  }, []);

  // After payment, also look up the order to get the tracking number
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  useEffect(() => {
    if (status !== "paid" || !sessionData?.customerEmail) return;
    // Fetch orders by email to find the newest one with tracking
    fetch(`/api/orders/by-email?email=${encodeURIComponent(sessionData.customerEmail)}`)
      .then(r => r.json())
      .then(orders => {
        if (Array.isArray(orders) && orders.length > 0) {
          const newest = orders.find((o: any) => o.type === "order" && o.trackingNumber);
          if (newest?.trackingNumber) setTrackingNumber(newest.trackingNumber);
        }
      })
      .catch(() => {});
  }, [status, sessionData]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-muted/10 flex items-center justify-center p-6">
        <div className="text-center max-w-md w-full">
          {status === "loading" && (
            <div className="animate-pulse">
              <div className="w-20 h-20 bg-primary/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-primary/50" />
              </div>
              <p className="text-muted-foreground">Verifying your payment…</p>
            </div>
          )}

          {status === "paid" && (
            <>
              <div className="w-20 h-20 bg-green-100 dark:bg-green-950/40 rounded-full mx-auto mb-6 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-3">
                Payment Successful!
              </h1>
              <p className="text-muted-foreground mb-6">
                Thank you for your order. A confirmation email with your tracking details has been sent.
              </p>

              {/* Tracking number card */}
              {trackingNumber && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-primary" />
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">Your Tracking Number</p>
                  </div>
                  <p className="text-3xl font-mono font-bold text-foreground tracking-widest mb-3">
                    {trackingNumber}
                  </p>
                  <Link href={`/track/${trackingNumber}`}>
                    <Button size="sm" className="gap-2 w-full">
                      <Truck className="w-4 h-4" /> Track My Order
                    </Button>
                  </Link>
                </div>
              )}

              {/* Tracking placeholder while fetching */}
              {!trackingNumber && sessionData?.customerEmail && (
                <div className="bg-muted/50 border border-border rounded-2xl p-4 mb-6 text-center">
                  <Package className="w-6 h-6 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Your tracking number will appear in your confirmation email.
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-center flex-wrap">
                <Link href="/my-orders">
                  <Button variant="outline" className="gap-2">
                    <Package className="w-4 h-4" /> My Orders
                  </Button>
                </Link>
                <Link href="/shop/dogs">
                  <Button className="gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-950/40 rounded-full mx-auto mb-6 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-amber-600" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-foreground mb-3">Order Received</h1>
              <p className="text-muted-foreground mb-8">
                Your order has been placed. If you completed payment, you will receive a confirmation email. Please contact us if you have any questions.
              </p>
              <Link href="/">
                <Button variant="outline" className="gap-2">
                  <Home className="w-4 h-4" /> Back to Home
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
