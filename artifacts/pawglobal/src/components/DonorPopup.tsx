import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

const DONORS = [
  { name: "Alex M.", amount: "$10", location: "London" },
  { name: "Sarah K.", amount: "£25", location: "Manchester" },
  { name: "James R.", amount: "$50", location: "New York" },
  { name: "Priya S.", amount: "€15", location: "Dublin" },
  { name: "Tom W.", amount: "£100", location: "Birmingham" },
  { name: "Emily C.", amount: "$30", location: "Toronto" },
  { name: "Lucas B.", amount: "€20", location: "Paris" },
  { name: "Olivia H.", amount: "£40", location: "Bristol" },
  { name: "Aisha N.", amount: "$75", location: "Chicago" },
  { name: "Noah F.", amount: "€50", location: "Amsterdam" },
  { name: "Grace T.", amount: "£15", location: "Edinburgh" },
  { name: "Daniel O.", amount: "$20", location: "Melbourne" },
  { name: "Sophie L.", amount: "€35", location: "Berlin" },
  { name: "Liam P.", amount: "£60", location: "Leeds" },
  { name: "Chloe W.", amount: "$45", location: "Sydney" },
  { name: "Ethan J.", amount: "€10", location: "Brussels" },
  { name: "Amara K.", amount: "£80", location: "Glasgow" },
  { name: "Ryan D.", amount: "$25", location: "Dublin" },
];

const PETS = ["Loki", "Bella", "Max", "Daisy", "Charlie", "Luna", "Milo", "Rosie", "Cooper", "Molly"];

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
}

export default function DonorPopup() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counter, setCounter] = useState(0);

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
  }, []);

  function showNotification() {
    const id = Date.now();
    const notif: Notification = {
      id,
      donor: randomItem(DONORS),
      pet: randomItem(PETS),
    };
    setNotifications(prev => [...prev.slice(-1), notif]); // max 1 at a time
    setCounter(c => c + 1);

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
              {notif.donor.name} just donated {notif.donor.amount}
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
