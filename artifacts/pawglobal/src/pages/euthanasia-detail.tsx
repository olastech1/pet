import { PageTransition } from "@/components/PageTransition";
import { useParams, Link } from "wouter";
import { useAdminData } from "@/contexts/AdminDataContext";
import { petDisplayId } from "@/lib/data";
import { Button } from "@/components/ui/button";
import {
  Heart, MapPin, Calendar, User, ArrowLeft, Share2,
  AlertTriangle, CheckCircle2, MessageCircle, Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function EuthanasiaDetail() {
  const { id } = useParams<{ id: string }>();
  const { euthanasiaListings } = useAdminData();
  const { toast } = useToast();
  const [whatsappPhone, setWhatsappPhone] = useState("447700000000");
  const [adoptName, setAdoptName] = useState("");
  const [adoptPhone, setAdoptPhone] = useState("");
  const [adoptMessage, setAdoptMessage] = useState("");
  const [adoptSent, setAdoptSent] = useState(false);

  useEffect(() => {
    fetch("/api/settings/checkout-method")
      .then(r => r.json())
      .then(d => {
        const num = (d.whatsappNumber || "").replace(/\D/g, "");
        if (num.length >= 7) setWhatsappPhone(num);
      })
      .catch(() => {});
  }, []);

  const listing = euthanasiaListings.find(l => l.id === id);

  if (!listing) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-muted/30">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Pet not found</h1>
            <p className="text-muted-foreground mb-6">This listing may have been removed or the link is incorrect.</p>
            <Link href="/euthanasia">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Urgent List
              </Button>
            </Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  const days = daysUntil(listing.deadline);
  const isRescued = listing.status === "rescued";
  const urgent = !isRescued && days <= 3;
  const displayId = petDisplayId(listing.id);

  function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `Help save ${listing.name}!`, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Share it with friends to help save " + listing.name });
    }
  }

  function handleAdoptSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lines = [
      `🐾 *Adoption / Foster Enquiry*`,
      ``,
      `*Pet:* ${listing!.name} (${petDisplayId(listing!.id)})`,
      `*Shelter:* ${listing!.shelter}, ${listing!.location}`,
      ``,
      `*My name:* ${adoptName}`,
      adoptPhone ? `*My phone:* ${adoptPhone}` : "",
      adoptMessage ? `*Message:* ${adoptMessage}` : "",
      ``,
      `I'm interested in adopting or fostering ${listing!.name}. Please get in touch!`,
    ].filter(l => l !== undefined).join("\n");
    const url = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(lines)}`;
    window.open(url, "_blank");
    setAdoptSent(true);
    toast({ title: "Opening WhatsApp!", description: `Send the pre-filled message to enquire about ${listing!.name}.` });
  }

  return (
    <PageTransition>
      <div className="bg-muted/30 min-h-screen py-10">
        <div className="container mx-auto px-4 max-w-3xl">

          {/* Back link */}
          <Link href="/euthanasia">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Urgent Rescue List
            </button>
          </Link>

          {/* Status banner */}
          {isRescued ? (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl px-6 py-4 mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <p className="font-bold text-green-700 dark:text-green-300">{listing.name} has been rescued!</p>
                <p className="text-sm text-green-600 dark:text-green-400">Thanks to our amazing community, {listing.name} is now safe and sound.</p>
              </div>
            </div>
          ) : urgent ? (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl px-6 py-4 mb-6 flex items-center gap-3 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="font-bold text-red-700 dark:text-red-300">
                  {days <= 0 ? "Deadline has passed!" : `Only ${days} day${days !== 1 ? "s" : ""} left to save ${listing.name}!`}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">Please act now — donate or enquire about fostering today.</p>
              </div>
            </div>
          ) : (
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-700 rounded-2xl px-6 py-4 mb-6 flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-500 shrink-0" />
              <div>
                <p className="font-bold text-orange-700 dark:text-orange-300">{days} days until {listing.name}'s scheduled euthanasia</p>
                <p className="text-sm text-orange-600 dark:text-orange-400">Every contribution and enquiry brings {listing.name} closer to safety.</p>
              </div>
            </div>
          )}

          {/* Main card */}
          <div className="bg-background border border-border rounded-2xl overflow-hidden mb-6">
            {/* Photo */}
            <div className="relative aspect-[16/9] bg-muted overflow-hidden">
              {listing.image ? (
                <img
                  src={listing.image}
                  alt={listing.name}
                  className={`w-full h-full object-cover ${isRescued ? "grayscale" : ""}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                  <Heart className="w-16 h-16" />
                </div>
              )}
              {isRescued && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-green-500 text-white text-lg font-bold px-6 py-2 rounded-full flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Rescued — Safe
                  </span>
                </div>
              )}
              {!isRescued && urgent && (
                <div className="absolute top-4 left-4">
                  <span className="bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
                    <AlertTriangle className="w-4 h-4" /> URGENT
                  </span>
                </div>
              )}
              <div className="absolute top-4 right-4">
                <span className="bg-background/90 backdrop-blur-sm text-foreground text-sm font-mono font-bold px-3 py-1 rounded-full">
                  {displayId}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-foreground mb-1">{listing.name}</h1>
                  <p className="text-muted-foreground text-lg">{listing.breed} · {listing.age} · {listing.gender}</p>
                </div>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-3 py-1.5 shrink-0"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span><strong className="text-foreground">{listing.shelter}</strong>, {listing.location}</span>
                </div>
                {!isRescued && (
                  <div className={`flex items-center gap-2 text-sm font-semibold ${urgent ? "text-red-600" : "text-orange-600"}`}>
                    <Calendar className="w-4 h-4 shrink-0" />
                    Deadline: {new Date(listing.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                )}
                {listing.author && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4 shrink-0" />
                    Listed by <strong className="text-foreground">{listing.author}</strong>
                  </div>
                )}
              </div>

              {listing.description && (
                <p className="text-muted-foreground leading-relaxed text-[15px] border-l-4 border-primary/30 pl-4">
                  {listing.description}
                </p>
              )}
            </div>
          </div>

          {!isRescued && (
            <div className="grid md:grid-cols-2 gap-6">

              {/* Donate section */}
              <div className="bg-background border border-red-200 dark:border-red-800 rounded-2xl overflow-hidden">
                <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900 px-6 py-4">
                  <h2 className="font-bold text-lg text-red-700 dark:text-red-300 flex items-center gap-2">
                    <Heart className="w-5 h-5 fill-red-500 text-red-500" /> Donate to Save {listing.name}
                  </h2>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Your donation funds {listing.name}'s rescue, vet care, and rehoming.
                  </p>
                </div>
                <div className="p-6 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Funds go directly to {listing.shelter} to cover medical costs, food, and safe transport to a foster home.
                  </p>
                  <Link href={`/donate?pet=${encodeURIComponent(listing.name)}&id=${displayId}`}>
                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 h-11">
                      <Heart className="w-4 h-4 fill-white" /> Donate Now for {listing.name}
                    </Button>
                  </Link>
                  <p className="text-xs text-muted-foreground text-center">Secure · All major cards · PayPal accepted</p>
                </div>
              </div>

              {/* Adopt / Foster section */}
              <div className="bg-background border border-border rounded-2xl overflow-hidden">
                <div className="bg-[#25D366]/10 border-b border-[#25D366]/20 px-6 py-4">
                  <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-[#25D366]" /> Adopt or Foster {listing.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Give {listing.name} a loving home — permanent or temporary.
                  </p>
                </div>
                {adoptSent ? (
                  <div className="p-6 flex flex-col items-center text-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                      <MessageCircle className="w-7 h-7 text-[#25D366]" />
                    </div>
                    <p className="font-bold text-foreground">WhatsApp is opening!</p>
                    <p className="text-sm text-muted-foreground">Just tap Send in WhatsApp to complete your enquiry about {listing.name}. We'll be in touch very soon!</p>
                    <button onClick={() => setAdoptSent(false)} className="text-xs text-primary hover:underline mt-2">Fill in again</button>
                  </div>
                ) : (
                  <form onSubmit={handleAdoptSubmit} className="p-6 space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={adoptName}
                        onChange={e => setAdoptName(e.target.value)}
                        placeholder="e.g. Sarah Jones"
                        className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#25D366]/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Your Phone (optional)</label>
                      <input
                        type="tel"
                        value={adoptPhone}
                        onChange={e => setAdoptPhone(e.target.value)}
                        placeholder="+44 7700 000000"
                        className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#25D366]/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Message (optional)</label>
                      <textarea
                        rows={3}
                        value={adoptMessage}
                        onChange={e => setAdoptMessage(e.target.value)}
                        placeholder="Tell us a little about yourself and your home..."
                        className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 resize-none"
                      />
                    </div>
                    <Button type="submit" className="w-full gap-2 h-11 bg-[#25D366] hover:bg-[#1ebe5d] text-white">
                      <MessageCircle className="w-4 h-4" /> Send via WhatsApp
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">Opens WhatsApp with a pre-filled message · We reply fast</p>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Footer links */}
          <div className="mt-8 text-center text-sm text-muted-foreground space-y-1">
            <p>
              <Link href="/euthanasia" className="text-primary hover:underline">View all urgent rescue listings</Link>
              {" · "}
              <Link href="/donate" className="text-primary hover:underline">Make a general donation</Link>
            </p>
            <p>Track this pet: <Link href={`/track/${displayId}`} className="text-primary hover:underline font-mono">{displayId}</Link></p>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
