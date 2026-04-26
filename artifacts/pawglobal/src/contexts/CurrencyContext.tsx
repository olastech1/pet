import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = string;

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceNGN: number, priceUSD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Major country to currency map as fallback
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  US: 'USD', GB: 'GBP', EU: 'EUR', CA: 'CAD', AU: 'AUD', 
  NZ: 'NZD', NG: 'NGN', ZA: 'ZAR', IN: 'INR', JP: 'JPY',
  CN: 'CNY', CH: 'CHF', SG: 'SGD', AE: 'AED', SA: 'SAR'
};

const EUROZONE = new Set([
  'AT','BE','CY','EE','FI','FR','DE','GR','IE','IT',
  'LV','LT','LU','MT','NL','PT','SK','SI','ES',
]);

async function detectCurrency(): Promise<string> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    if (data.currency) return data.currency;
    if (data.country_code) {
      if (EUROZONE.has(data.country_code)) return 'EUR';
      return COUNTRY_CURRENCY_MAP[data.country_code] || 'USD';
    }
    throw new Error('Fallback to ipwho');
  } catch {
    try {
      const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(4000) });
      const data = await res.json();
      if (data.country_code) {
        if (EUROZONE.has(data.country_code)) return 'EUR';
        return COUNTRY_CURRENCY_MAP[data.country_code] || 'USD';
      }
    } catch {
      // Ignored
    }
  }
  
  // Last resort locale fallback
  const locale = navigator.language || '';
  if (locale.includes('GB')) return 'GBP';
  const region = (locale.split('-')[1] ?? '').toUpperCase();
  if (EUROZONE.has(region)) return 'EUR';
  return COUNTRY_CURRENCY_MAP[region] || 'USD';
}

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<string>('USD');
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1, EUR: 0.92, GBP: 0.79 });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Fetch live exchange rates
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(d => {
        if (d.rates) setRates(d.rates);
      })
      .catch(() => {});

    const saved = localStorage.getItem('pawglobal_currency');
    if (saved) {
      setCurrency(saved);
      setIsLoaded(true);
    } else {
      detectCurrency().then(curr => {
        setCurrency(curr);
        setIsLoaded(true);
      });
    }
  }, []);

  const handleSetCurrency = (curr: string) => {
    setCurrency(curr);
    localStorage.setItem('pawglobal_currency', curr);
  };

  const formatPrice = (priceNGN: number, priceUSD: number) => {
    if (priceNGN === 0 && priceUSD === 0) return 'Free / Adopt';
    
    // Always use USD base for conversion since our rates are USD-based
    // Even if you had priceNGN, we'll assume priceUSD is the source of truth for global conversions
    const rate = rates[currency] || 1;
    const converted = priceUSD * rate;
    
    // Auto-format using Intl for the correct symbol/locale
    return new Intl.NumberFormat(navigator.language || 'en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(converted);
  };

  // We can choose to wait for detection, but returning immediately is smoother
  // and useEffect will sync it shortly.
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
