import { ReactNode, useEffect, useState } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ScrollRestoration } from "./ScrollRestoration";
import { MessageCircle } from "lucide-react";
import DonorPopup from "./DonorPopup";

function FloatingWhatsApp() {
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/checkout-method")
      .then(r => r.json())
      .then(d => {
        const num = (d.whatsappNumber || "").replace(/\D/g, "");
        if (num.length >= 7) setPhone(num);
      })
      .catch(() => {});
  }, []);

  if (!phone) return null;

  return (
    <a
      href={`https://wa.me/${phone}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5a] shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95"
    >
      <MessageCircle className="w-7 h-7 text-white fill-white" strokeWidth={1.5} />
    </a>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col flex-grow">
      <ScrollRestoration />
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
      <FloatingWhatsApp />
      <DonorPopup />
    </div>
  );
}
