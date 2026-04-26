import { useState, useEffect } from "react";

export interface StoreSettings {
  storeName: string;
  contactEmail: string;
  phone: string;
  address: string;
  notificationEmail: string;
  whatsappNumber: string;
  telegramUsername: string;
}

const DEFAULTS: StoreSettings = {
  storeName: "EuthList",
  contactEmail: "hello@euthlist.com",
  phone: "",
  address: "London, United Kingdom",
  notificationEmail: "",
  whatsappNumber: "",
  telegramUsername: "",
};

let cache: StoreSettings | null = null;
let promise: Promise<StoreSettings> | null = null;

async function fetchSettings(): Promise<StoreSettings> {
  if (cache) return cache;
  if (!promise) {
    promise = fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        cache = {
          storeName: data.storeName || DEFAULTS.storeName,
          contactEmail: data.contactEmail || DEFAULTS.contactEmail,
          phone: data.phone || DEFAULTS.phone,
          address: data.address || DEFAULTS.address,
          notificationEmail: data.notificationEmail || DEFAULTS.notificationEmail,
          whatsappNumber: data.whatsappNumber || DEFAULTS.whatsappNumber,
          telegramUsername: data.telegramUsername || DEFAULTS.telegramUsername,
        };
        return cache;
      })
      .catch(() => {
        promise = null;
        return DEFAULTS;
      });
  }
  return promise;
}

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(cache ?? DEFAULTS);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    fetchSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  return { settings, loading };
}

export function invalidateSettingsCache() {
  cache = null;
  promise = null;
}
