import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'USD' | 'EUR' | 'GBP';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceNGN: number, priceUSD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Eurozone countries by ISO 3166-1 alpha-2 code
const EUROZONE = new Set([
  'AT','BE','CY','EE','FI','FR','DE','GR','IE','IT',
  'LV','LT','LU','MT','NL','PT','SK','SI','ES',
]);

async function detectCurrency(): Promise<Currency> {
  try {
    // Fast hint from browser locale
    const locale = navigator.language || '';
    if (locale === 'en-GB') return 'GBP';
    if (locale === 'en-US') return 'USD';

    // IP-based geolocation (no API key needed)
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error('geo failed');
    const data = await res.json();
    const country: string = data.country_code ?? '';

    if (country === 'GB') return 'GBP';
    if (EUROZONE.has(country)) return 'EUR';
    if (country === 'US') return 'USD';

    // Locale region fallback
    const region = (locale.split('-')[1] ?? '').toUpperCase();
    if (region === 'GB') return 'GBP';
    if (EUROZONE.has(region)) return 'EUR';

    return 'USD';
  } catch {
    // Silent fallback — use locale only
    const locale = navigator.language || '';
    if (locale.startsWith('en-GB')) return 'GBP';
    const region = (locale.split('-')[1] ?? '').toUpperCase();
    if (EUROZONE.has(region)) return 'EUR';
    return 'USD';
  }
}

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('GBP');

  useEffect(() => {
    const saved = localStorage.getItem('pawglobal_currency') as Currency;
    if (saved && ['USD', 'EUR', 'GBP'].includes(saved)) {
      // User previously chose manually — respect that choice
      setCurrency(saved);
    } else {
      // No saved preference — auto-detect from location
      detectCurrency().then(setCurrency);
    }
  }, []);

  const handleSetCurrency = (curr: Currency) => {
    setCurrency(curr);
    localStorage.setItem('pawglobal_currency', curr);
  };

  const formatPrice = (priceNGN: number, priceUSD: number) => {
    if (priceNGN === 0 && priceUSD === 0) return 'Free / Adopt';
    switch (currency) {
      case 'USD':
        return `$${priceUSD.toLocaleString()}`;
      case 'EUR':
        return `€${Math.round(priceUSD * 0.92).toLocaleString()}`;
      case 'GBP':
        return `£${Math.round(priceUSD * 0.79).toLocaleString()}`;
      default:
        return `$${priceUSD.toLocaleString()}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: handleSetCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};
