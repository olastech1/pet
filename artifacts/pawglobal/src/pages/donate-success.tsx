import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Heart, CheckCircle, Loader2, PawPrint, Globe, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/PageTransition";

interface DonationDetails {
  status: string;
  customerEmail?: string;
  amountTotal?: number;
  currency?: string;
  metadata?: Record<string, string>;
  isRecurring?: boolean;
}

const CAUSE_LABELS: Record<string, string> = {
  general: "EuthList General Rescue Fund",
  medical: "Medical & Vet Care Fund",
  shelter: "Shelter & Housing Support",
  rescue: "Rescue Operations Fund",
};

export default function DonateSuccess() {
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");

  const [details, setDetails] = useState<DonationDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    fetch(`/api/checkout/stripe-session/${sessionId}`)
      .then(r => r.json())
      .then(data => setDetails(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  const amountDisplay =
    details?.amountTotal && details?.currency
      ? `${details.currency.toUpperCase()} ${(details.amountTotal / 100).toFixed(2)}`
      : null;

  const causeKey = details?.metadata?.shelter;
  const causeLabel = causeKey ? (CAUSE_LABELS[causeKey] ?? causeKey) : null;
  const isMonthly = details?.isRecurring || details?.metadata?.frequency === "monthly";

  return (
    <PageTransition>
      <div className="min-h-screen bg-muted/30 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Confirming your donation…</p>
            </div>
          ) : (
            <div className="bg-background border border-border rounded-3xl p-8 shadow-sm">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
                {isMonthly ? (
                  <RefreshCw className="w-10 h-10 text-primary" />
                ) : details?.status === "paid" ? (
                  <Heart className="w-10 h-10 text-primary fill-primary" />
                ) : (
                  <CheckCircle className="w-10 h-10 text-primary" />
                )}
              </div>

              <h1 className="text-3xl font-serif font-bold text-foreground mb-3">
                {isMonthly ? "You're a monthly donor!" : "Thank you!"}
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                {isMonthly
                  ? "Your monthly support makes a lasting difference for animals around the world."
                  : "Your generosity makes a real difference for animals around the world."}
              </p>

              {isMonthly && (
                <div className="flex items-center gap-2 justify-center bg-primary/8 border border-primary/20 rounded-xl px-4 py-3 mb-5 text-sm text-primary font-medium">
                  <RefreshCw className="w-4 h-4 shrink-0" />
                  <span>Your card will be charged monthly — cancel anytime</span>
                </div>
              )}

              {amountDisplay && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Donation amount</span>
                    <span className="font-semibold text-foreground">
                      {amountDisplay}{isMonthly ? " / month" : ""}
                    </span>
                  </div>
                  {causeLabel && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Directed to</span>
                      <span className="font-medium text-foreground text-right max-w-[60%]">{causeLabel}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frequency</span>
                    <span className="font-medium text-foreground">{isMonthly ? "Monthly recurring" : "One-time"}</span>
                  </div>
                  {details?.customerEmail && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Receipt sent to</span>
                      <span className="font-medium text-foreground">{details.customerEmail}</span>
                    </div>
                  )}
                  {details?.metadata?.message && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground italic">"{details.metadata.message}"</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 justify-center mb-8 text-sm text-muted-foreground">
                <Globe className="w-4 h-4 text-primary" />
                <span>100% of your donation goes directly to our global shelter partners</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/donate" className="flex-1">
                  <Button variant="outline" className="w-full gap-2">
                    <Heart className="w-4 h-4" /> {isMonthly ? "View causes" : "Donate Again"}
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button className="w-full gap-2">
                    <PawPrint className="w-4 h-4" /> Back to Store
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
