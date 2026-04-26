import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'USD' | 'EUR' | 'GBP';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceNGN: number, priceUSD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('GBP');

  useEffect(() => {
    const saved = localStorage.getItem('pawglobal_currency') as Currency;
    if (saved && ['USD', 'EUR', 'GBP'].includes(saved)) {
      setCurrency(saved);
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
