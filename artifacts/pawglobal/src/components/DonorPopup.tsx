import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useAdminData } from "@/contexts/AdminDataContext";
import { useCurrency } from "@/contexts/CurrencyContext";

const DONORS = [
  { name: "Alex M.", location: "London" },
  { name: "Sarah K.", location: "Manchester" },
  { name: "James R.", location: "New York" },
  { name: "Priya S.", location: "Dublin" },
  { name: "Tom W.", location: "Birmingham" },
  { name: "Emily C.", location: "Toronto" },
  { name: "Lucas B.", location: "Paris" },
  { name: "Olivia H.", location: "Bristol" },
  { name: "Aisha N.", location: "Chicago" },
  { name: "Noah F.", location: "Amsterdam" },
  { name: "Grace T.", location: "Edinburgh" },
  { name: "Daniel O.", location: "Melbourne" },
  { name: "Sophie L.", location: "Berlin" },
  { name: "Liam P.", location: "Leeds" },
  { name: "Chloe W.", location: "Sydney" },
  { name: "Ethan J.", location: "Brussels" },
  { name: "Amara K.", location: "Glasgow" },
  { name: "Ryan D.", location: "Dublin" },
];

const AMOUNTS = [10, 15, 20, 25, 30, 40, 50, 75, 100];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDelay(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min) * 1000;
}

interface Notification {
  id: number;
  donor: typeof DONORS[0];
  pet: string;
  amountStr: string;
}

export default function DonorPopup() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { euthanasiaListings } = useAdminData();
  const { currency } = useCurrency();

  const currencySymbol =
    currency === "EUR" ? "€" :
    currency === "GBP" ? "£" : "$";

  useEffect(() => {
    // Initial delay before first popup
    const first = setTimeout(() => {
      showNotification();
      // Then repeat every 8–18 seconds
      const interval = setInterval(() => {
        showNotification();
      }, randomDelay(8, 18));
      return () => clearInterval(interval);
    }, randomDelay(4, 10));

    return () => clearTimeout(first);
  }, [euthanasiaListings, currency]);

  function showNotification() {
    // Use real pets if available, else fallback
    const pets = euthanasiaListings.length > 0
      ? euthanasiaListings.map(l => l.name)
      : ["Loki", "Bella", "Max", "Daisy", "Charlie"];

    const amount = randomItem(AMOUNTS);
    const id = Date.now();
    const notif: Notification = {
      id,
      donor: randomItem(DONORS),
      pet: randomItem(pets),
      amountStr: `${currencySymbol}${amount}`,
    };

    setNotifications(prev => [...prev.slice(-1), notif]); // max 1 at a time

    // Auto-remove after 5s
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }

  return (
    <div className="fixed bottom-6 left-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map(notif => (
        <div
          key={notif.id}
          className="pointer-events-auto animate-in slide-in-from-left-5 fade-in duration-500 bg-white dark:bg-zinc-900 border border-border rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 max-w-xs"
        >
          <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 text-red-500 fill-red-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">
              {notif.donor.name} just donated {notif.amountStr}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              to help {notif.pet} · {notif.donor.location}
            </p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
        </div>
      ))}
    </div>
  );
}
