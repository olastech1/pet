import { useState, useEffect } from "react";
import { PageTransition } from "@/components/PageTransition";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { CreditCard, ShieldCheck, Lock, MessageCircle, Send } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const checkoutSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  country: z.string().min(2, "Country is required"),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "NL", label: "Netherlands" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "SG", label: "Singapore" },
  { value: "JP", label: "Japan" },
  { value: "NG", label: "Nigeria" },
  { value: "ZA", label: "South Africa" },
  { value: "OTHER", label: "Other" },
];

export default function Checkout() {
  const { items, totalNGN, totalUSD, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [checkoutMethod, setCheckoutMethod] = useState<"stripe" | "messaging">("stripe");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");

  useEffect(() => {
    fetch("/api/settings/checkout-method")
      .then(r => r.json())
      .then(d => {
        const m = d.method;
        if (m === "messaging" || m === "whatsapp" || m === "telegram") {
          setCheckoutMethod("messaging");
          setWhatsappNumber(d.whatsappNumber || "");
          setTelegramUsername(d.telegramUsername || "");
        }
      })
      .catch(() => {});
  }, []);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      country: "US",
    },
  });

  if (items.length === 0) {
    setLocation("/cart");
    return null;
  }

  const countryLabel = (code: string) => COUNTRIES.find(c => c.value === code)?.label ?? code;

  const buildOrderMessage = (data: CheckoutFormValues) => {
    const linesList = items.map(item =>
      `• ${item.quantity}× ${item.product.name} — $${(item.product.priceUSD * item.quantity).toFixed(2)}`
    ).join("\n");
    return [
      "🐾 EuthList — New Order",
      "",
      "Hi! I'd like to place the following order:",
      "",
      "📦 Items:",
      linesList,
      "",
      `💰 Order Total: $${totalUSD.toFixed(2)}`,
      "",
      `👤 Name: ${data.firstName} ${data.lastName}`,
      `📧 Email: ${data.email}`,
      `📍 Ship to: ${data.address}, ${data.city}, ${countryLabel(data.country)}`,
      "",
      "Please confirm my order and payment details. Thank you! 🐾",
    ].join("\n");
  };

  const sendViaWhatsApp = (data: CheckoutFormValues) => {
    const phone = whatsappNumber.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(buildOrderMessage(data))}`, "_blank");
  };

  const sendViaTelegram = (data: CheckoutFormValues) => {
    const username = telegramUsername.replace(/^@/, "");
    window.open(`https://t.me/${username}?text=${encodeURIComponent(buildOrderMessage(data))}`, "_blank");
  };

  const onSubmit = async (data: CheckoutFormValues) => {

    toast({
      title: "Redirecting to payment...",
      description: "Please wait while we prepare your secure checkout.",
    });
    try {
      const origin = window.location.origin;
      const body = {
        items: items.map(item => ({
          name: item.product.name,
          priceUSD: item.product.priceUSD,
          quantity: item.quantity,
          image: item.product.images[0],
        })),
        customerEmail: data.email,
        origin,
      };
      const resp = await fetch("/api/checkout/stripe-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await resp.json();
      if (resp.ok && result.url) {
        window.location.href = result.url;
        return;
      }
      toast({
        title: "Payment unavailable",
        description: result.error || "Could not start checkout. Please try again.",
        variant: "destructive",
      });
    } catch {
      toast({
        title: "Connection error",
        description: "Could not reach the payment server. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <PageTransition>
      <div className="bg-muted/10 min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Form Section */}
            <div className="lg:col-span-7 space-y-8">
              <Form {...form}>
                <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                  {/* Contact Info */}
                  <div className="bg-background p-6 rounded-2xl border">
                    <h2 className="text-xl font-bold mb-4 font-serif">Contact Information</h2>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Shipping Address */}
                  <div className="bg-background p-6 rounded-2xl border space-y-4">
                    <h2 className="text-xl font-bold mb-4 font-serif">Shipping Address</h2>
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country / Region</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COUNTRIES.map(c => (
                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input className="h-12" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input className="h-12" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Payment notice */}
                  <div className="bg-background p-6 rounded-2xl border">
                    <h2 className="text-xl font-bold mb-2 font-serif">Payment</h2>
                    {checkoutMethod === "messaging" ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-4">
                          Choose how to send your order. We'll confirm it and share payment instructions via your preferred chat.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {whatsappNumber && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#25D366]/5 border border-[#25D366]/30">
                              <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                              <div>
                                <p className="font-medium text-xs">WhatsApp</p>
                                <p className="text-[10px] text-muted-foreground">Chat order</p>
                              </div>
                            </div>
                          )}
                          {telegramUsername && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#229ED9]/5 border border-[#229ED9]/30">
                              <Send className="w-4 h-4 text-[#229ED9] shrink-0" />
                              <div>
                                <p className="font-medium text-xs">Telegram</p>
                                <p className="text-[10px] text-muted-foreground">Chat order</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground mb-4">You will be securely redirected to Stripe to complete your payment.</p>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                          <CreditCard className="w-5 h-5 text-primary shrink-0" />
                          <div>
                            <p className="font-medium text-sm">Stripe Secure Checkout</p>
                            <p className="text-xs text-muted-foreground">All major cards accepted worldwide</p>
                          </div>
                          <Lock className="w-4 h-4 text-green-500 ml-auto shrink-0" />
                        </div>
                      </>
                    )}
                  </div>
                </form>
              </Form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-5">
              <div className="bg-background p-6 rounded-2xl border sticky top-24">
                <h3 className="text-xl font-serif font-bold mb-6">Order Summary</h3>

                <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                  {items.map(item => (
                    <div key={item.product.id} className="flex gap-4 items-center">
                      <div className="relative">
                        <img src={item.product.images[0]} alt={item.product.name} className="w-16 h-16 rounded-md object-cover border" />
                        <span className="absolute -top-2 -right-2 bg-muted text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium border">{item.quantity}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
                        <p className="text-muted-foreground text-xs">{formatPrice(item.product.priceNGN, item.product.priceUSD)}</p>
                      </div>
                      <p className="font-medium text-sm">
                        {formatPrice(item.product.priceNGN * item.quantity, item.product.priceUSD * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-6 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatPrice(totalNGN, totalUSD)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t">
                    <span>Total</span>
                    <span>{formatPrice(totalNGN, totalUSD)}</span>
                  </div>
                </div>

                {checkoutMethod === "messaging" ? (
                  <div className="mt-8 space-y-2">
                    {whatsappNumber && (
                      <Button
                        type="button"
                        size="lg"
                        className="w-full h-14 font-bold text-base gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white"
                        data-testid="button-complete-checkout"
                        onClick={() => form.handleSubmit(sendViaWhatsApp)()}
                      >
                        <MessageCircle className="w-5 h-5" /> Order via WhatsApp
                      </Button>
                    )}
                    {telegramUsername && (
                      <Button
                        type="button"
                        size="lg"
                        className="w-full h-14 font-bold text-base gap-2 bg-[#229ED9] hover:bg-[#1a8bbf] text-white"
                        data-testid="button-checkout-telegram"
                        onClick={() => form.handleSubmit(sendViaTelegram)()}
                      >
                        <Send className="w-5 h-5" /> Order via Telegram
                      </Button>
                    )}
                    <p className="text-xs text-center text-muted-foreground pt-1">
                      <MessageCircle className="w-3 h-3 inline mr-1 text-[#25D366]" />
                      Order details sent directly to our team
                    </p>
                  </div>
                ) : (
                  <>
                    <Button
                      type="submit"
                      form="checkout-form"
                      size="lg"
                      className="w-full h-14 mt-8 font-bold text-lg gap-2"
                      data-testid="button-complete-checkout"
                    >
                      Pay with Stripe
                    </Button>
                    <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-green-500" /> Secure encrypted checkout
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
