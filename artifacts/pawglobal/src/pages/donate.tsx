import { PageTransition } from "@/components/PageTransition";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, Loader2, Shield, Globe, Stethoscope, Home, PawPrint, CheckCircle2, RefreshCw, Zap, MessageCircle, Send, Copy, X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { useCurrency } from "@/contexts/CurrencyContext";

// Rates are handled dynamically now via CurrencyContext, but we keep a fallback for the Stripe checkout session
const FALLBACK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, NGN: 1500, CAD: 1.35, AUD: 1.5,
};

const donationSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be at least 1"),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  message: z.string().optional(),
  petId: z.string().optional(),
});

type DonationFormValues = z.infer<typeof donationSchema>;
type Frequency = "once" | "monthly";

const BASE_CAUSES = [
  {
    id: "general",
    label: "General Rescue Fund",
    sub: "Where it's needed most",
    icon: Globe,
    color: "from-primary/20 to-primary/5 border-primary/30",
    activeColor: "from-primary/30 to-primary/10 border-primary",
  },
  {
    id: "medical",
    label: "Medical & Vet Care",
    sub: "Surgery, vaccines & treatment",
    icon: Stethoscope,
    color: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
    activeColor: "from-blue-500/30 to-blue-500/10 border-blue-500",
  },
  {
    id: "shelter",
    label: "Shelter & Housing",
    sub: "Safe spaces for strays",
    icon: Home,
    color: "from-amber-500/20 to-amber-500/5 border-amber-500/30",
    activeColor: "from-amber-500/30 to-amber-500/10 border-amber-500",
  },
  {
    id: "rescue",
    label: "Rescue Operations",
    sub: "Food, transport & rehoming",
    icon: Heart,
    color: "from-rose-500/20 to-rose-500/5 border-rose-500/30",
    activeColor: "from-rose-500/30 to-rose-500/10 border-rose-500",
  },
];

const IMPACT = [
  { amount: "$10", label: "Feeds a rescued pet for a week" },
  { amount: "$25", label: "Covers vaccinations & deworming" },
  { amount: "$50", label: "Funds a vet consultation" },
  { amount: "$100", label: "Sponsors emergency surgery" },
];

export default function Donate() {
  const { toast } = useToast();
  const { currency } = useCurrency();
  const searchString = useSearch();
  const [locationPath, navigate] = useLocation();

  const params = new URLSearchParams(searchString);
  const isRedeem = locationPath.includes("/redeem-pledge") || params.get("redeem") === "true";

  // Parse pet-specific query params (e.g. /donate?pet=Loki&id=ID123456)
  const petName = params.get("pet") || "";
  const petId = params.get("id") || "";
  const hasPetContext = !!(petName.trim());

  // Build the causes list — add pet-specific cause at the top when navigated from a pet
  const CAUSES = hasPetContext
    ? [
        {
          id: "pet-specific",
          label: `Help ${petName}`,
          sub: petId ? `${petId} — rescue, vet care & rehoming` : "Rescue, vet care & rehoming",
          icon: PawPrint,
          color: "from-red-500/20 to-red-500/5 border-red-500/30",
          activeColor: "from-red-500/30 to-red-500/10 border-red-500",
        },
        ...BASE_CAUSES,
      ]
    : BASE_CAUSES;

  const [isCustom, setIsCustom] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCause, setSelectedCause] = useState(hasPetContext ? "pet-specific" : "general");
  const [frequency, setFrequency] = useState<Frequency>("once");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [donationMethods, setDonationMethods] = useState({
    stripe: { enabled: false },
    whatsapp: { enabled: false, number: "" },
    paypal: { enabled: false, link: "" },
    gofundme: { enabled: false, link: "" },
    telegram: { enabled: false, username: "" },
    crypto: { enabled: false, address: "", network: "Bitcoin", coin: "BTC" },
  });
  const [methodsLoaded, setMethodsLoaded] = useState(false);

  const clearPetContext = () => {
    navigate("/donate", { replace: true });
    setSelectedCause("general");
  };

  useEffect(() => {
    fetch("/api/settings/donation-method", { cache: "no-store" })
      .then(r => r.json())
      .then(d => { setDonationMethods(prev => ({ ...prev, ...d })); setMethodsLoaded(true); })
      .catch(() => { setMethodsLoaded(true); });
  }, []);

  const anyMethodEnabled = Object.values(donationMethods).some(m => m.enabled);

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr).then(() => {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    });
  };

  const presets =
    currency === "EUR" ? [10, 25, 50, 100] :
    currency === "GBP" ? [8, 20, 40, 80] :
    currency === "NGN" ? [5000, 10000, 20000, 50000] :
    currency === "CAD" ? [10, 25, 50, 100] :
    currency === "AUD" ? [15, 30, 50, 100] :
    [10, 25, 50, 100];

  const currencySymbol = new Intl.NumberFormat(navigator.language, { style: 'currency', currency })
    .formatToParts(0).find(p => p.type === 'currency')?.value || currency;

  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema),
    defaultValues: { amount: presets[1], name: "", email: "", message: "", petId: "" },
  });

  const watchedAmount = form.watch("amount") || 0;
  const causeLabel = CAUSES.find(c => c.id === selectedCause)?.label ?? selectedCause;

  // Sync preset amount when currency auto-detects or changes
  useEffect(() => {
    const newPresets =
      currency === "EUR" ? [10, 25, 50, 100] :
      currency === "GBP" ? [8, 20, 40, 80] :
      currency === "NGN" ? [5000, 10000, 20000, 50000] :
      currency === "CAD" ? [10, 25, 50, 100] :
      currency === "AUD" ? [15, 30, 50, 100] :
      [10, 25, 50, 100];
    form.setValue("amount", newPresets[1]);
    setIsCustom(false);
  }, [currency]);

  const buildDonationMessage = (data: DonationFormValues) => {
    const amountStr = `${currencySymbol}${data.amount.toLocaleString()}`;
    return [
      "🐾 EuthList — Donation Request",
      "",
      "Hi! I'd like to make a donation:",
      "",
      `💝 Cause: ${causeLabel}`,
      `💰 Amount: ${amountStr}${frequency === "monthly" ? " / month" : ""}`,
      `🔄 Frequency: ${frequency === "monthly" ? "Monthly recurring" : "One-time"}`,
      "",
      `👤 Name: ${data.name}`,
      `📧 Email: ${data.email}`,
      ...(data.petId ? [`🆔 Pet ID: ${data.petId}`] : []),
      ...(data.message ? [`💬 Message: "${data.message}"`] : []),
      "",
      "Please help me complete my donation. Thank you! 🐾",
    ].join("\n");
  };

  const donateViaWhatsApp = (data: DonationFormValues) => {
    const phone = donationMethods.whatsapp.number.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(buildDonationMessage(data))}`, "_blank");
  };

  const donateViaTelegram = (data: DonationFormValues) => {
    const username = donationMethods.telegram.username.replace(/^@/, "");
    window.open(`https://t.me/${username}?text=${encodeURIComponent(buildDonationMessage(data))}`, "_blank");
  };

  const onSubmit = async (data: DonationFormValues) => {
    setSubmitting(true);
    try {
      const rateToUSD = FALLBACK_RATES[currency] ?? 1; // Used for USD equivalent in Stripe
      // Convert their local amount backward to USD for Stripe baseline
      const amountUSD = Math.max(0.5, parseFloat((data.amount / rateToUSD).toFixed(2)));

      const resp = await fetch("/api/checkout/stripe-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              name: frequency === "monthly"
                ? `Monthly Donation — ${causeLabel}`
                : `Donation — ${causeLabel}`,
              description: hasPetContext
                ? `Donation for ${petName}${petId ? ` (${petId})` : ""} — from ${data.name}`
                : data.message
                ? `"${data.message}" — from ${data.name}`
                : `Donation from ${data.name}`,
              priceUSD: amountUSD,
              quantity: 1,
            },
          ],
          customerEmail: data.email,
          origin: window.location.origin,
          metadata: {
            type: isRedeem ? "pledge_redemption" : "donation",
            donor: data.name,
            shelter: selectedCause === "pet-specific" ? "rescue" : selectedCause,
            message: data.message ?? "",
            originalAmount: `${currencySymbol}${data.amount}`,
            frequency,
            ...(hasPetContext ? { petName, petId } : {}),
            ...((!hasPetContext && data.petId) ? { petId: data.petId } : {}),
          },
        }),
      });

      const json = await resp.json();

      if (!resp.ok || !json.url) {
        throw new Error(json.error ?? "Could not start payment. Please try again.");
      }

      window.location.href = json.url;
    } catch (err: any) {
      toast({
        title: "Payment could not be started",
        description: err.message ?? "Please try again or contact us.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <SEOHead
        title={isRedeem ? "Redeem Your Pledge" : "Donate to Pet Rescue"}
        description={isRedeem ? "Fulfill your rescue pledge to help save a life." : "Support EuthList's mission to save animals from euthanasia. Donate via Stripe, PayPal, WhatsApp, Crypto and more. Every pound saves a life."}
        keywords="donate pet rescue, animal charity donation, save dogs from euthanasia, animal rescue fund, donate crypto pet rescue"
      />
      {/* Pet-specific banner */}
      {hasPetContext && (
        <div className="bg-red-600 text-white">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <PawPrint className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm sm:text-lg leading-tight">You're donating to help <span className="underline underline-offset-2">{petName}</span></p>
                {petId && <p className="text-xs sm:text-sm text-white/80 mt-0.5 leading-snug">Pet {petId} — your donation goes directly towards their rescue, vet care, and rehoming.</p>}
              </div>
            </div>
            <button onClick={clearPetContext} className="shrink-0 p-1 sm:p-1.5 rounded-full hover:bg-white/20 transition-colors mt-0.5 sm:mt-0" title="Remove pet context">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative bg-primary overflow-hidden py-10 sm:py-16 md:py-24">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        <div className="container mx-auto px-4 relative z-10 text-primary-foreground text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl mb-4 sm:mb-6">
            <Heart className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-serif font-bold mb-3 sm:mb-4 leading-tight">
            {isRedeem ? (hasPetContext ? `Redeem pledge for ${petName}` : "Redeem Your Pledge") : (hasPetContext ? `Help save ${petName}` : "Give a pet a second chance")}
          </h1>
          <p className="text-sm sm:text-lg md:text-xl opacity-85 max-w-2xl mx-auto px-2">
            {isRedeem
              ? (hasPetContext ? `Thank you for honoring your pledge. Your contribution directly funds ${petName}'s rescue and vet care.` : "Thank you for honoring your pledge. Your contribution directly funds the vet care and rehoming of rescued pets.")
              : (hasPetContext ? `Your donation will directly fund ${petName}'s rescue, vet care, and journey to a forever home.` : "100% of your donation goes directly to animal rescue operations, vet care, and shelter support around the world.")}
          </p>
          <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-lg mx-auto mt-6 sm:mt-10">
            {[
              { num: "12,400+", label: "Animals helped" },
              { num: "85+", label: "Partner shelters" },
              { num: "40+", label: "Countries" },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-lg sm:text-2xl md:text-3xl font-bold">{stat.num}</p>
                <p className="text-[10px] sm:text-xs opacity-75 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="bg-muted/20 py-8 sm:py-14">
        <div className="container mx-auto px-3 sm:px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">

            {/* Form */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">

              {/* Frequency toggle */}
              <div className="bg-background rounded-2xl border p-4 sm:p-6">
                <h2 className="text-lg font-bold font-serif mb-4">How often would you like to give?</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFrequency("once")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      frequency === "once"
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <Zap className="w-6 h-6" />
                    <div className="text-center">
                      <p className="font-bold text-sm">One-time</p>
                      <p className="text-xs opacity-70 mt-0.5">A single gift today</p>
                    </div>
                    {frequency === "once" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequency("monthly")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                      frequency === "monthly"
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {frequency !== "monthly" && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary uppercase tracking-wide">
                        Most Impact
                      </span>
                    )}
                    <RefreshCw className="w-6 h-6" />
                    <div className="text-center">
                      <p className="font-bold text-sm">Monthly</p>
                      <p className="text-xs opacity-70 mt-0.5">Recurring every month</p>
                    </div>
                    {frequency === "monthly" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </button>
                </div>
                {frequency === "monthly" && (
                  <div className="mt-3 flex items-start gap-2.5 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm text-muted-foreground">
                    <RefreshCw className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      Your card will be charged monthly. You can cancel your subscription anytime by contacting us at{" "}
                      <a href="mailto:hello@euthlist.com" className="text-primary underline-offset-2 hover:underline">hello@euthlist.com</a>.
                    </span>
                  </div>
                )}
              </div>

              {/* Cause selector cards */}
              <div className="bg-background rounded-2xl border p-4 sm:p-6">
                <h2 className="text-lg font-bold font-serif mb-4">Choose a cause</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CAUSES.map(cause => {
                    const Icon = cause.icon;
                    const active = selectedCause === cause.id;
                    return (
                      <button
                        key={cause.id}
                        type="button"
                        onClick={() => setSelectedCause(cause.id)}
                        className={`relative text-left p-4 rounded-xl border bg-gradient-to-br transition-all ${active ? cause.activeColor + " shadow-sm" : cause.color + " hover:opacity-90"}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 mt-0.5">
                            <Icon className="w-5 h-5 text-foreground/70" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{cause.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{cause.sub}</p>
                          </div>
                        </div>
                        {active && (
                          <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount selector */}
              <div className="bg-background rounded-2xl border p-4 sm:p-6">
                <h2 className="text-lg font-bold font-serif mb-1">
                  Select an amount{frequency === "monthly" && <span className="text-sm font-normal text-muted-foreground ml-2">per month</span>}
                </h2>
                {frequency === "monthly" && (
                  <p className="text-xs text-muted-foreground mb-4">
                    Monthly donors provide long-term stability for our shelter partners.
                  </p>
                )}
                {frequency === "once" && <div className="mb-4" />}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                  {presets.map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => { form.setValue("amount", amount); setIsCustom(false); }}
                      className={`h-14 rounded-xl border-2 text-base font-bold transition-all ${
                        form.watch("amount") === amount && !isCustom
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-muted/30 text-foreground hover:border-primary/50"
                      }`}
                    >
                      {currencySymbol}{amount.toLocaleString()}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setIsCustom(true); form.setValue("amount", 0); }}
                    className={`h-14 rounded-xl border-2 text-base font-bold transition-all col-span-2 sm:col-span-4 ${
                      isCustom
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-muted/30 text-foreground hover:border-primary/50"
                    }`}
                  >
                    Custom amount
                  </button>
                </div>
                {isCustom && (
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">{currencySymbol}</span>
                    <Input
                      type="number"
                      className="pl-10 h-12 text-lg"
                      placeholder="Enter amount"
                      onChange={e => form.setValue("amount", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                )}
              </div>

              {/* Donor details */}
              <div className="bg-background rounded-2xl border p-4 sm:p-6">
                <h2 className="text-lg font-bold font-serif mb-4">Your details</h2>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Jane Smith" className="h-11" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="jane@example.com" type="email" className="h-11" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {isRedeem && !hasPetContext && (
                      <FormField
                        control={form.control}
                        name="petId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pet ID or Name <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. ID123456 or Loki" className="h-11" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message of Support <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Keep up the wonderful work!" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2 mt-2">
                      {/* Stripe — shown when explicitly enabled, OR as fallback when nothing is configured yet */}
                      {(donationMethods.stripe.enabled || (!methodsLoaded || !anyMethodEnabled)) && (
                        <>
                          <Button
                            type="submit"
                            size="lg"
                            className="w-full h-14 text-lg font-bold gap-2 bg-[#635BFF] hover:bg-[#4f47e0] text-white"
                            disabled={submitting}
                            data-testid="button-submit-donation"
                          >
                            {submitting ? (
                              <><Loader2 className="w-5 h-5 animate-spin" /> Preparing payment…</>
                            ) : frequency === "monthly" ? (
                              <><RefreshCw className="w-5 h-5" /> Give {currencySymbol}{watchedAmount.toLocaleString()} / month</>
                            ) : (
                              <><Heart className="w-5 h-5 fill-current" /> {isRedeem ? "Redeem Pledge" : "Donate"} {currencySymbol}{watchedAmount.toLocaleString()}</>
                            )}
                          </Button>
                          <p className="text-center text-xs text-muted-foreground">
                            {frequency === "monthly"
                              ? "Monthly recurring — secured by Stripe. Cancel anytime."
                              : "Secure card payment via Stripe. You'll be redirected to complete your donation."}
                          </p>
                        </>
                      )}

                      {/* WhatsApp */}
                      {donationMethods.whatsapp.enabled && donationMethods.whatsapp.number && (
                        <Button
                          type="button"
                          size="lg"
                          className="w-full h-14 text-base font-bold gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white"
                          disabled={submitting}
                          data-testid="button-submit-donation"
                          onClick={() => form.handleSubmit(donateViaWhatsApp)()}
                        >
                          <MessageCircle className="w-5 h-5" /> Donate via WhatsApp
                        </Button>
                      )}

                      {/* PayPal */}
                      {donationMethods.paypal.enabled && donationMethods.paypal.link && (
                        <a href={donationMethods.paypal.link} target="_blank" rel="noopener noreferrer" className="block w-full">
                          <Button
                            type="button"
                            size="lg"
                            className="w-full h-14 text-base font-bold gap-2 bg-[#003087] hover:bg-[#001f5e] text-white"
                            data-testid="button-donate-paypal"
                          >
                            <span className="font-extrabold text-[#009cde]">Pay</span><span className="font-extrabold text-white">Pal</span>
                            <span className="ml-1">— Donate via PayPal</span>
                          </Button>
                        </a>
                      )}

                      {/* GoFundMe */}
                      {donationMethods.gofundme.enabled && donationMethods.gofundme.link && (
                        <a href={donationMethods.gofundme.link} target="_blank" rel="noopener noreferrer" className="block w-full">
                          <Button
                            type="button"
                            size="lg"
                            className="w-full h-14 text-base font-bold gap-2 bg-[#02a95c] hover:bg-[#019150] text-white"
                            data-testid="button-donate-gofundme"
                          >
                            <Heart className="w-5 h-5 fill-current" /> Donate via GoFundMe
                          </Button>
                        </a>
                      )}

                      {/* Telegram */}
                      {donationMethods.telegram.enabled && donationMethods.telegram.username && (
                        <Button
                          type="button"
                          size="lg"
                          className="w-full h-14 text-base font-bold gap-2 bg-[#229ED9] hover:bg-[#1a8bbf] text-white"
                          disabled={submitting}
                          data-testid="button-donate-telegram"
                          onClick={() => form.handleSubmit(donateViaTelegram)()}
                        >
                          <Send className="w-5 h-5" /> Donate via Telegram
                        </Button>
                      )}

                      {/* Crypto */}
                      {donationMethods.crypto.enabled && donationMethods.crypto.address && (
                        <div className="rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-600 font-extrabold text-lg">₿</span>
                            <span className="font-bold text-sm text-foreground">Donate Crypto</span>
                            <span className="text-xs text-muted-foreground ml-1">({donationMethods.crypto.coin} · {donationMethods.crypto.network})</span>
                          </div>
                          <div className="flex items-center gap-2 bg-background rounded-lg border px-3 py-2">
                            <span className="font-mono text-xs text-foreground break-all flex-1">{donationMethods.crypto.address}</span>
                            <button
                              type="button"
                              onClick={() => copyAddress(donationMethods.crypto.address)}
                              className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                              title="Copy address"
                            >
                              {copiedAddress ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                            </button>
                          </div>
                          <p className="text-xs text-amber-700 dark:text-amber-400">Send {donationMethods.crypto.coin} to this address. Double-check before sending — crypto is irreversible.</p>
                        </div>
                      )}

                      {anyMethodEnabled && (
                        <p className="text-center text-xs text-muted-foreground pt-1">
                          All donations go directly to animal rescue operations. Thank you for your support.
                        </p>
                      )}
                    </div>
                  </form>
                </Form>
              </div>

            </div>

            {/* Sidebar */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-5">

              {/* Trust badge — changes based on frequency */}
              <div className="bg-primary text-primary-foreground rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 opacity-10">
                  <PawPrint className="w-36 h-36" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    {frequency === "monthly" ? <RefreshCw className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                    <span className="font-bold">
                      {frequency === "monthly" ? "Recurring impact, every month" : "100% to the animals"}
                    </span>
                  </div>
                  <p className="text-sm opacity-85 leading-relaxed">
                    {frequency === "monthly"
                      ? "Monthly donors are our most impactful supporters. Your consistent giving lets shelters plan ahead, hire vets, and rescue more animals — month after month."
                      : "EuthList is a non-profit initiative. Every dollar you donate goes directly to our partner rescue centres and shelters — no admin fees, no overhead cuts."}
                  </p>
                </div>
              </div>

              {/* What your donation does */}
              <div className="bg-background rounded-2xl border p-6">
                <h3 className="font-bold font-serif text-lg mb-4">
                  {frequency === "monthly" ? "What your monthly gift does" : "What your donation does"}
                </h3>
                <div className="space-y-3">
                  {IMPACT.map(({ amount, label }) => (
                    <div key={amount} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                      <span className="text-primary font-bold text-sm w-14 shrink-0">{amount}{frequency === "monthly" ? "/mo" : ""}</span>
                      <p className="text-sm text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Global reach */}
              <div className="bg-background rounded-2xl border p-6">
                <h3 className="font-bold font-serif text-lg mb-3 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" /> Our Global Partners
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    "North American Rescue Alliance",
                    "European Animal Welfare Network",
                    "Asia-Pacific Shelter Coalition",
                    "International Stray Support",
                    "+ 80 more shelters worldwide",
                  ].map(name => (
                    <li key={name} className="flex items-center gap-2">
                      <PawPrint className="w-3.5 h-3.5 text-primary shrink-0" />
                      {name}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
